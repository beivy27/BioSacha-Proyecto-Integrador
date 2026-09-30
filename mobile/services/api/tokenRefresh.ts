import axios from "axios";

import {
  eliminarTokens,
  guardarTokens,
  obtenerTokens,
  type TokensSesion,
} from "../sessionStorage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL no está configurada."
  );
}

/*
 * Una única renovación compartida entre
 * peticiones concurrentes que reciben 401.
 */
let renovacionEnCurso:
  Promise<string> | null = null;

async function ejecutarRenovacion():
  Promise<string> {

  const tokensActuales =
    await obtenerTokens();

  if (!tokensActuales?.refresh_token) {
    await eliminarTokens();

    throw new Error(
      "No existe refresh token almacenado."
    );
  }

  console.log(
    "🔐 Enviando refresh token al backend..."
  );

  /*
   * IMPORTANTE:
   * usamos axios directamente y NO httpClient.
   * Así evitamos que /api/auth/refresh pase
   * nuevamente por el interceptor de 401.
   */
  const respuesta = await axios.post(
    `${API_URL}/api/auth/refresh`,
    {
      refresh_token:
        tokensActuales.refresh_token,
    },
    {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const nuevosTokens:
    TokensSesion | undefined =
      respuesta.data?.datos?.tokens;

  if (
    !respuesta.data?.exito ||
    !nuevosTokens?.access_token ||
    !nuevosTokens?.refresh_token
  ) {
    await eliminarTokens();

    throw new Error(
      "El backend no devolvió tokens válidos."
    );
  }

  await guardarTokens(nuevosTokens);

  console.log(
    "✅ Nuevos tokens guardados en SecureStore."
  );

  return nuevosTokens.access_token;
}

export async function renovarAccessToken():
  Promise<string> {

  if (!renovacionEnCurso) {
    renovacionEnCurso =
      ejecutarRenovacion()
        .catch(async (error) => {
          console.log(
            "❌ Error real durante refresh:",
            axios.isAxiosError(error)
              ? {
                  status:
                    error.response?.status,
                  data:
                    error.response?.data,
                  message:
                    error.message,
                }
              : error
          );

          throw error;
        })
        .finally(() => {
          renovacionEnCurso = null;
        });
  }

  return renovacionEnCurso;
}
