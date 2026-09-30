import { z } from "zod";

import httpClient from "../../services/api/httpClient";
import {
  RegistroBotanicoApiSchema,
  registroDesdeApi,
  type RegistroBotanico,
} from "../../models/RegistroBotanico";

const RespuestaRegistrosSchema = z.object({
  exito: z.boolean(),
  datos: z.array(RegistroBotanicoApiSchema).optional(),
  mensaje: z.string().optional(),
});

export async function obtenerRegistrosRemotos():
  Promise<RegistroBotanico[]> {

  const response =
    await httpClient.get("/api/registros");

  const resultado =
    RespuestaRegistrosSchema.parse(response.data);

  if (!resultado.exito || !resultado.datos) {
    throw new Error(
      resultado.mensaje ??
      "El servidor no devolvió registros válidos."
    );
  }

  return resultado.datos.map(registroDesdeApi);
}
