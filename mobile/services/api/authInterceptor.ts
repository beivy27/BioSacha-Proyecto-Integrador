import type { InternalAxiosRequestConfig } from "axios";

import { obtenerTokens } from "../sessionStorage";

/**
 * SEMANA 13
 * Interceptor de autenticación.
 *
 * Lee el access token desde SecureStore antes de cada petición
 * y lo incorpora automáticamente como Bearer Token.
 */
export async function agregarAutenticacion(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const tokens = await obtenerTokens();

  if (tokens?.access_token) {
    config.headers.Authorization =
      `Bearer ${tokens.access_token}`;
  }

  return config;
}
