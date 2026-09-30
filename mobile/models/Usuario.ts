import { z } from "zod";

/**
 * Contrato recibido desde BioSacha Backend.
 */
export const UsuarioApiSchema = z.object({
  id_usuario: z.number(),
  nombre: z.string(),
  correo: z.string().email(),
  rol: z.string(),
  activo: z.boolean(),
});

export type UsuarioApi = z.infer<typeof UsuarioApiSchema>;

/**
 * Modelo utilizado internamente por la aplicación móvil.
 * Se desacopla la nomenclatura del backend.
 */
export type Usuario = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
};

export function usuarioDesdeApi(datos: unknown): Usuario {
  const api = UsuarioApiSchema.parse(datos);

  return {
    idUsuario: api.id_usuario,
    nombre: api.nombre,
    correo: api.correo,
    rol: api.rol,
    activo: api.activo,
  };
}
