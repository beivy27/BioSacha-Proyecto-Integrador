import httpClient from "./api/httpClient";
import * as Crypto from "expo-crypto";

import {
  inicializarBaseDatosLocal,
  obtenerConexionLocal,
} from "./database";

export type NuevoRegistroOffline = {
  nombre_local: string;
  nombre_cientifico: string;
  comunidad: string;

  // Semana 14 - capacidades nativas opcionales
  foto_uri?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  precision_ubicacion?: number | null;
};

export type ResultadoRegistroOffline = {
  local_uuid: string;
  idempotency_key: string;
  pendientes: number;
};

export async function crearRegistroOffline(
  datos: NuevoRegistroOffline
): Promise<ResultadoRegistroOffline> {

  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();

  const localUuid = Crypto.randomUUID();
  const idempotencyKey = `crear-registro:${localUuid}`;
  const ahora = new Date().toISOString();

  const payload = {
    local_uuid: localUuid,

    // Referencias REALES existentes en PostgreSQL BioSacha
    id_planta: 1,
    id_usuario: 2,
    id_comunidad: 1,

    nombre_local: datos.nombre_local.trim(),
    nombre_cientifico: datos.nombre_cientifico.trim(),
    comunidad: datos.comunidad.trim(),

    estado_validacion: "pendiente",

    creado_local_en: ahora,
  };

  await db.withTransactionAsync(async () => {

    await db.runAsync(
      `
      INSERT INTO registros_locales (
        local_uuid,
        id_registro_servidor,
        nombre_local,
        nombre_cientifico,
        comunidad,

        foto_uri,
        latitud,
        longitud,
        precision_ubicacion,

        estado_validacion,
        estado_sync,
        actualizado_local_en,
        actualizado_servidor_en,
        sincronizado_en,
        eliminado
      )
      VALUES (
        ?, NULL,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        NULL, NULL, 0
      )
      `,
      localUuid,
      payload.nombre_local,
      payload.nombre_cientifico,
      payload.comunidad,

      datos.foto_uri ?? null,
      datos.latitud ?? null,
      datos.longitud ?? null,
      datos.precision_ubicacion ?? null,

      "pendiente",
      "pendiente",
      ahora
    );

    await db.runAsync(
      `
      INSERT INTO outbox (
        local_uuid,
        operacion,
        payload_json,
        idempotency_key,
        estado,
        intentos,
        max_intentos,
        ultimo_error,
        creado_en,
        actualizado_en,
        proximo_intento_en
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)
      `,
      localUuid,
      "crear",
      JSON.stringify(payload),
      idempotencyKey,
      "pendiente",
      0,
      5,
      ahora,
      ahora
    );
  });

  const resumen =
    await db.getFirstAsync<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM outbox
      WHERE estado = 'pendiente'
      `
    );

  return {
    local_uuid: localUuid,
    idempotency_key: idempotencyKey,
    pendientes: resumen?.total ?? 0,
  };
}

export async function obtenerOperacionesPendientes() {
  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();

  return db.getAllAsync<{
    id_outbox: number;
    local_uuid: string;
    operacion: string;
    payload_json: string;
    idempotency_key: string;
    estado: string;
    intentos: number;
    max_intentos: number;
    ultimo_error: string | null;
    creado_en: string;
  }>(
    `
    SELECT
      id_outbox,
      local_uuid,
      operacion,
      payload_json,
      idempotency_key,
      estado,
      intentos,
      max_intentos,
      ultimo_error,
      creado_en
    FROM outbox
    WHERE estado IN ('pendiente', 'error')
    ORDER BY id_outbox ASC
    `
  );
}

// ============================================================
// SEMANA 12 - PROCESAMIENTO REAL DE OUTBOX
// SQLite -> API -> PostgreSQL
// Reintentos exponenciales + idempotencia + reconciliación
// ============================================================

export async function procesarOperacionesPendientes() {
  await inicializarBaseDatosLocal();

  const db = await obtenerConexionLocal();
  const todasLasOperaciones =
    await obtenerOperacionesPendientes();

  console.log(
    "🔎 OUTBOX ACTUAL:",
    todasLasOperaciones.map((op) => ({
      id_outbox: op.id_outbox,
      local_uuid: op.local_uuid,
      operacion: op.operacion,
      estado: op.estado,
      intentos: op.intentos,
      max_intentos: op.max_intentos,
      ultimo_error: op.ultimo_error,
      payload_json: op.payload_json,
    }))
  );

  const operaciones =
    todasLasOperaciones.filter(
      (op) => op.estado === "pendiente"
    );

  let procesadas = 0;

  for (const operacion of operaciones) {
    let intentoActual = operacion.intentos ?? 0;
    const maxIntentos = operacion.max_intentos ?? 5;

    const registroYaSincronizado =
      await db.getFirstAsync<{ estado_sync: string }>(
        `
        SELECT estado_sync
        FROM registros_locales
        WHERE local_uuid = ?
        LIMIT 1
        `,
        operacion.local_uuid
      );

    if (registroYaSincronizado?.estado_sync === "sincronizado") {
      await db.runAsync(
        `DELETE FROM outbox WHERE id_outbox = ?`,
        operacion.id_outbox
      );

      procesadas += 1;

      console.log(
        `✅ Outbox reconciliada y eliminada: ${operacion.local_uuid}`
      );

      continue;
    }

    if (intentoActual >= maxIntentos) {
      continue;
    }

    while (intentoActual < maxIntentos) {
      try {
        const payload = JSON.parse(operacion.payload_json);

        payload.local_uuid =
          payload.local_uuid ?? operacion.local_uuid;

        const respuesta =
          await httpClient.post(
            "/api/registros",
            payload,
            {
              headers: {
                "Idempotency-Key":
                  operacion.idempotency_key,
              },
            }
          );

        const resultado = respuesta.data;

        if (!resultado?.exito) {
          throw new Error(
            resultado?.mensaje ??
              "La operación no fue aceptada."
          );
        }

        const servidor = resultado?.datos ?? {};

        /*
         * La marca temporal de reconciliación se toma
         * preferentemente del servidor y no del dispositivo.
         */
        const marcaServidor =
          servidor.actualizado_en ??
          servidor.creado_en ??
          servidor.fecha_registro ??
          null;

        await db.runAsync(
          `
          UPDATE registros_locales
          SET
            id_registro_servidor =
              COALESCE(?, id_registro_servidor),

            estado_sync = 'sincronizado',

            estado_validacion =
              COALESCE(?, estado_validacion),

            actualizado_servidor_en =
              COALESCE(?, actualizado_servidor_en),

            sincronizado_en =
              COALESCE(?, sincronizado_en)

          WHERE local_uuid = ?
          `,
          servidor.id_registro ?? null,
          servidor.estado_validacion ?? null,
          marcaServidor,
          marcaServidor,
          operacion.local_uuid
        );

        await db.runAsync(
          `DELETE FROM outbox WHERE id_outbox = ?`,
          operacion.id_outbox
        );

        procesadas += 1;

        console.log(
          `✅ Outbox sincronizada: ${operacion.local_uuid}`
        );

        break;

      } catch (error) {
        const detalleError = error as any;

      const status =
        detalleError?.status ??
        detalleError?.response?.status;

      const erroresCampos =
        detalleError?.erroresCampos ??
        detalleError?.response?.data?.errores ??
        {};

      /*
       * SEMANA 13
       * HTTP 422 es validación del cliente.
       * No se reintenta automáticamente.
       */
      if (status === 422) {
        const detalle422 = JSON.stringify({
          tipo: "VALIDATION_422",
          status: 422,
          mensaje:
            detalleError?.message ??
            detalleError?.response?.data?.mensaje ??
            "La solicitud contiene datos inválidos.",
          errores: erroresCampos,
        });

        await db.runAsync(
          `
          UPDATE outbox
          SET
            estado = 'error',
            ultimo_error = ?,
            actualizado_en = ?
          WHERE id_outbox = ?
          `,
          detalle422,
          new Date().toISOString(),
          operacion.id_outbox
        );

        console.log(
          "🧩 HTTP 422 asociado a campos:",
          erroresCampos
        );

        break;
      }

      intentoActual += 1;

        const mensaje =
          error instanceof Error
            ? error.message
            : "Error desconocido de sincronización";

        await db.runAsync(
          `
          UPDATE outbox
          SET
            estado = ?,
            intentos = ?,
            ultimo_error = ?,
            actualizado_en = ?
          WHERE id_outbox = ?
          `,
          intentoActual >= maxIntentos
            ? "error"
            : "pendiente",
          intentoActual,
          mensaje,
          new Date().toISOString(),
          operacion.id_outbox
        );

        console.log(
          `⚠️ Reintento ${intentoActual}/${maxIntentos}: ${mensaje}`
        );

        if (intentoActual >= maxIntentos) {
          break;
        }

        /*
         * Espera creciente:
         * 0.5 s -> 1 s -> 2 s -> 4 s -> 8 s
         */
        const esperaMs = Math.min(
          8000,
          500 * 2 ** (intentoActual - 1)
        );

        await new Promise((resolve) =>
          setTimeout(resolve, esperaMs)
        );
      }
    }
  }

  const resumen =
    await db.getFirstAsync<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM outbox
      WHERE estado IN ('pendiente', 'error')
      `
    );

  return {
    procesadas,
    pendientes: resumen?.total ?? 0,
  };
}
