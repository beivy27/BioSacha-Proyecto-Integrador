import { leerRegistrosLocales } from "../../services/cacheRegistros";
import type { RegistroBotanico } from "../../models/RegistroBotanico";

export async function obtenerRegistrosLocales():
  Promise<RegistroBotanico[]> {

  const registros =
    await leerRegistrosLocales();

  return registros.map((registro) => ({
    idRegistro:
      registro.id_registro_servidor ?? 0,

    localUuid:
      registro.local_uuid,

    nombreLocal:
      registro.nombre_local,

    nombreCientifico:
      registro.nombre_cientifico,

    comunidad:
      registro.comunidad,

    estadoValidacion:
      registro.estado_validacion,

    fechaRegistro: null,

    actualizadoEn:
      registro.sincronizado_en,

    eliminado: false,
  }));
}
