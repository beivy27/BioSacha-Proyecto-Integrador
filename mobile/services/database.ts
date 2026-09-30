import * as SQLite from "expo-sqlite";

const NOMBRE_BD = "biosacha_semana12.db";

let conexion: Promise<SQLite.SQLiteDatabase> | null = null;

async function obtenerBD(): Promise<SQLite.SQLiteDatabase> {
  if (!conexion) {
    conexion = SQLite.openDatabaseAsync(NOMBRE_BD);
  }

  return conexion;
}

export async function inicializarBaseDatosLocal(): Promise<void> {
  const db = await obtenerBD();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS registros_locales (
      id_local INTEGER PRIMARY KEY AUTOINCREMENT,

      local_uuid TEXT NOT NULL UNIQUE,

      id_registro_servidor INTEGER,

      nombre_local TEXT NOT NULL,
      nombre_cientifico TEXT NOT NULL,
      comunidad TEXT,

      foto_uri TEXT,
      latitud REAL,
      longitud REAL,
      precision_ubicacion REAL,

      estado_validacion TEXT NOT NULL DEFAULT 'pendiente',

      estado_sync TEXT NOT NULL DEFAULT 'sincronizado'
        CHECK (
          estado_sync IN (
            'sincronizado',
            'pendiente',
            'error'
          )
        ),

      actualizado_local_en TEXT NOT NULL,
      actualizado_servidor_en TEXT,
      sincronizado_en TEXT,

      eliminado INTEGER NOT NULL DEFAULT 0
        CHECK (eliminado IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id_outbox INTEGER PRIMARY KEY AUTOINCREMENT,

      local_uuid TEXT NOT NULL,

      operacion TEXT NOT NULL
        CHECK (
          operacion IN (
            'crear',
            'actualizar',
            'eliminar'
          )
        ),

      payload_json TEXT NOT NULL,

      idempotency_key TEXT NOT NULL UNIQUE,

      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (
          estado IN (
            'pendiente',
            'enviando',
            'error'
          )
        ),

      intentos INTEGER NOT NULL DEFAULT 0,
      max_intentos INTEGER NOT NULL DEFAULT 5,

      ultimo_error TEXT,

      creado_en TEXT NOT NULL,
      actualizado_en TEXT NOT NULL,
      proximo_intento_en TEXT
    );

    CREATE INDEX IF NOT EXISTS
      idx_registros_estado_sync
    ON registros_locales(estado_sync);

    CREATE INDEX IF NOT EXISTS
      idx_registros_servidor
    ON registros_locales(id_registro_servidor);

    CREATE INDEX IF NOT EXISTS
      idx_outbox_estado
    ON outbox(estado);

    CREATE INDEX IF NOT EXISTS
      idx_outbox_local_uuid
    ON outbox(local_uuid);

    PRAGMA user_version = 2;
  `);

  await asegurarColumnasSemana14(db);
}

async function asegurarColumnasSemana14(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const columnas =
    await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(registros_locales)"
    );

  const existentes =
    new Set(columnas.map((columna) => columna.name));

  const nuevasColumnas: Array<[string, string]> = [
    ["foto_uri", "TEXT"],
    ["latitud", "REAL"],
    ["longitud", "REAL"],
    ["precision_ubicacion", "REAL"],
  ];

  for (const [nombre, tipo] of nuevasColumnas) {
    if (!existentes.has(nombre)) {
      await db.execAsync(
        `ALTER TABLE registros_locales ADD COLUMN ${nombre} ${tipo}`
      );

      console.log(
        `✅ Migración Semana 14: columna ${nombre} creada.`
      );
    }
  }

  await db.execAsync("PRAGMA user_version = 2");
}

export async function obtenerResumenBaseLocal(): Promise<{
  version: number;
  registros: number;
  pendientes: number;
}> {
  const db = await obtenerBD();

  const version = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");

  const registros = await db.getFirstAsync<{
    total: number;
  }>(
    "SELECT COUNT(*) AS total FROM registros_locales"
  );

  const pendientes = await db.getFirstAsync<{
    total: number;
  }>(
    `
      SELECT COUNT(*) AS total
      FROM outbox
      WHERE estado = 'pendiente'
    `
  );

  return {
    version: version?.user_version ?? 0,
    registros: registros?.total ?? 0,
    pendientes: pendientes?.total ?? 0,
  };
}

export async function obtenerConexionLocal():
  Promise<SQLite.SQLiteDatabase> {
  return obtenerBD();
}


// ============================================================
// SEMANA 12 - LIMPIEZA DE DATOS LOCALES AL CERRAR SESION
// Conserva el esquema SQLite, elimina todos los datos del usuario.
// ============================================================
export async function limpiarAlmacenLocal(): Promise<void> {
  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();

  // Primero la cola para evitar referencias pendientes.
  await db.runAsync(`DELETE FROM outbox`);

  // Después los registros almacenados localmente.
  await db.runAsync(`DELETE FROM registros_locales`);

  console.log("✅ SQLite y Outbox eliminados al cerrar sesión.");
}
