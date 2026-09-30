import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { agregarAutenticacion } from "./authInterceptor";
import { renovarAccessToken } from "./tokenRefresh";
import { configurarReintentos } from "./retryInterceptor";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL no está configurada."
  );
}

type ConfigConReintento =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * INTERCEPTOR 1 — AUTENTICACIÓN
 * Lee el access token desde SecureStore
 * y lo inyecta automáticamente.
 */
httpClient.interceptors.request.use(
  agregarAutenticacion,
  async (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR 2 — RENOVACIÓN AUTOMÁTICA
 *
 * Flujo:
 * petición -> 401 -> refresh token ->
 * nuevo access token -> repetir petición.
 *
 * _retry impide bucles infinitos.
 * tokenRefresh comparte una única renovación
 * entre peticiones concurrentes.
 */
httpClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as ConfigConReintento | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      console.log(
        "🔄 HTTP 401 detectado: renovando sesión..."
      );

      const nuevoAccessToken =
        await renovarAccessToken();

      originalRequest.headers.Authorization =
        `Bearer ${nuevoAccessToken}`;

      console.log(
        "✅ Token renovado. Reintentando petición original."
      );

      return httpClient(originalRequest);
    } catch (refreshError) {
      console.log(
        "⛔ No fue posible renovar la sesión."
      );

      return Promise.reject(refreshError);
    }
  }
);

export default httpClient;


/**
 * INTERCEPTOR 3 — ERRORES Y REINTENTOS
 * Solo reintenta fallos temporales
 * en operaciones idempotentes.
 */
configurarReintentos(httpClient);
