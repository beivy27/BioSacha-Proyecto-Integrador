import { z } from "zod";

/**
 * SEMANA 13
 * Contrato recibido desde BioSacha Backend.
 */
export const RegistroBotanicoApiSchema = z.object({
  id_registro: z.number(),
  local_uuid: z.string(),
  estado_validacion: z.string(),

  fecha_registro: z.string().nullable().optional(),
  actualizado_en: z.string().nullable().optional(),
  eliminado: z.boolean().optional().default(false),

  planta: z
    .object({
      nombre_local_principal: z.string().nullable().optional(),
      nombre_cientifico: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),

  comunidad: z
    .object({
      nombre: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type RegistroBotanicoApi =
  z.infer<typeof RegistroBotanicoApiSchema>;

/**
 * Modelo interno utilizado por la aplicación.
 * La UI trabaja con camelCase y no depende
 * directamente de la nomenclatura del backend.
 */
export type RegistroBotanico = {
  idRegistro: number;
  localUuid: string;
  nombreLocal: string;
  nombreCientifico: string;
  comunidad: string | null;
  estadoValidacion: string;
  fechaRegistro: string | null;
  actualizadoEn: string | null;
  eliminado: boolean;
};

export function registroDesdeApi(
  datos: unknown
): RegistroBotanico {
  const api = RegistroBotanicoApiSchema.parse(datos);

  return {
    idRegistro: api.id_registro,
    localUuid: api.local_uuid,

    nombreLocal:
      api.planta?.nombre_local_principal ??
      "Sin nombre local",

    nombreCientifico:
      api.planta?.nombre_cientifico ??
      "Sin nombre científico",

    comunidad:
      api.comunidad?.nombre ?? null,

    estadoValidacion:
      api.estado_validacion,

    fechaRegistro:
      api.fecha_registro ?? null,

    actualizadoEn:
      api.actualizado_en ?? null,

    eliminado:
      api.eliminado ?? false,
  };
}
