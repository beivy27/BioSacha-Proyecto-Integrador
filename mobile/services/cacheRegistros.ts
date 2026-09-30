import httpClient from "./api/httpClient";
import { existeSesionSegura } from "./sessionStorage";
import {
  inicializarBaseDatosLocal,
  obtenerConexionLocal,
  obtenerResumenBaseLocal,
} from "./database";

type RegistroServidor = {
  id_registro: number;
  local_uuid: string;
  estado_validacion: string;
  actualizado_en?: string;
  eliminado?: boolean;

  planta?: {
    nombre_local_principal?: string;
    nombre_cientifico?: string;
  };

  comunidad?: {
    nombre?: string;
  };
};

type RespuestaRegistros = {
  exito: boolean;
  datos?: RegistroServidor[];
  mensaje?: string;
};

export type EstadoCacheLocal = {
  version: number;
  registros: number;
  pendientes: number;
  origen: "servidor" | "local";
  ultimaSincronizacion: string | null;
};

export async function sincronizarRegistrosLocales():
  Promise<EstadoCacheLocal> {
  // SEMANA 12 - No reconstruir SQLite después del cierre de sesión.
  const sesionActiva = await existeSesionSegura();

  if (!sesionActiva) {
    const resumen = await obtenerResumenBaseLocal();

    console.log(
      "🔒 Sin sesión segura: no se sincroniza API → SQLite."
    );

    return {
      ...resumen,
      origen: "local",
      ultimaSincronizacion: null,
    };
  }


  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();

  try {
    const respuesta =
      await httpClient.get<RespuestaRegistros>(
        "/api/registros"
      );

    const data = respuesta.data;

    if (!data.exito || !Array.isArray(data.datos)) {
      throw new Error(
        data.mensaje ??
        "La API no devolvió registros válidos."
      );
    }

    const ahora = new Date().toISOString();

    for (const registro of data.datos) {
      const localUuid =
        registro.local_uuid ||
        `server-${registro.id_registro}`;

      await db.runAsync(
        `
        INSERT INTO registros_locales (
          local_uuid,
          id_registro_servidor,
          nombre_local,
          nombre_cientifico,
          comunidad,
          estado_validacion,
          estado_sync,
          actualizado_local_en,
          actualizado_servidor_en,
          sincronizado_en,
          eliminado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(local_uuid)
        DO UPDATE SET
          id_registro_servidor = excluded.id_registro_servidor,
          nombre_local = excluded.nombre_local,
          nombre_cientifico = excluded.nombre_cientifico,
          comunidad = excluded.comunidad,
          estado_validacion = excluded.estado_validacion,
          estado_sync = 'sincronizado',
          actualizado_local_en = excluded.actualizado_local_en,
          actualizado_servidor_en =
            excluded.actualizado_servidor_en,
          sincronizado_en = excluded.sincronizado_en,
          eliminado = excluded.eliminado
        `,
        localUuid,
        registro.id_registro,
        registro.planta?.nombre_local_principal ??
          "Sin nombre local",
        registro.planta?.nombre_cientifico ??
          "Sin nombre científico",
        registro.comunidad?.nombre ?? null,
        registro.estado_validacion ?? "pendiente",
        "sincronizado",
        ahora,
        registro.actualizado_en ?? null,
        ahora,
        registro.eliminado ? 1 : 0
      );
    }

    const resumen =
      await obtenerResumenBaseLocal();

    const pendientesOutbox =
      await db.getFirstAsync<{ total: number }>(`
        SELECT COUNT(*) AS total
        FROM outbox
        WHERE estado IN ('pendiente', 'error')
      `);

    return {
      ...resumen,
      pendientes: pendientesOutbox?.total ?? 0,
      origen: "servidor",
      ultimaSincronizacion: ahora,
    };
  } catch {
    const resumen =
      await obtenerResumenBaseLocal();

    const pendientesOutbox =
      await db.getFirstAsync<{ total: number }>(`
        SELECT COUNT(*) AS total
        FROM outbox
        WHERE estado IN ('pendiente', 'error')
      `);

    const ultima =
      await db.getFirstAsync<{
        sincronizado_en: string | null;
      }>(
        `
        SELECT sincronizado_en
        FROM registros_locales
        WHERE sincronizado_en IS NOT NULL
        ORDER BY sincronizado_en DESC
        LIMIT 1
        `
      );

    return {
      ...resumen,
      pendientes: pendientesOutbox?.total ?? 0,
      origen: "local",
      ultimaSincronizacion:
        ultima?.sincronizado_en ?? null,
    };
  }
}

export async function leerRegistrosLocales() {
  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();

  return db.getAllAsync<{
    local_uuid: string;
    id_registro_servidor: number | null;
    nombre_local: string;
    nombre_cientifico: string;
    comunidad: string | null;
    estado_validacion: string;
    estado_sync: string;
    sincronizado_en: string | null;
  }>(
    `
    SELECT
      local_uuid,
      id_registro_servidor,
      nombre_local,
      nombre_cientifico,
      comunidad,
      estado_validacion,
      estado_sync,
      sincronizado_en
    FROM registros_locales
    WHERE eliminado = 0
    ORDER BY id_local DESC
    `
  );
}
