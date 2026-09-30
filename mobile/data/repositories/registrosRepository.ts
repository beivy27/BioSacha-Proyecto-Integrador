import type { RegistroBotanico } from "../../models/RegistroBotanico";

import {
  obtenerRegistrosRemotos,
} from "../remote/registrosRemoteSource";

import {
  obtenerRegistrosLocales,
} from "../local/registrosLocalSource";

import {
  sincronizarRegistrosLocales,
} from "../../services/cacheRegistros";

/**
 * SEMANA 13
 * Repository único para registros botánicos.
 *
 * La UI no necesita conocer si los datos
 * provienen de API/PostgreSQL o SQLite.
 */
export async function obtenerRegistros():
  Promise<RegistroBotanico[]> {

  try {
    await sincronizarRegistrosLocales();

    return await obtenerRegistrosRemotos();
  } catch {
    return obtenerRegistrosLocales();
  }
}
