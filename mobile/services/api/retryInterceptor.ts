import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import {
  traducirErrorApi,
} from "./apiError";

type ConfigReintento =
  InternalAxiosRequestConfig & {
    _retryCount?: number;
  };

const MAX_REINTENTOS = 2;

function esperar(ms: number) {
  return new Promise<void>((resolve) =>
    setTimeout(resolve, ms)
  );
}

function tieneIdempotencyKey(
  config: ConfigReintento
): boolean {
  const headers = config.headers;

  if (
    headers &&
    typeof headers.get === "function"
  ) {
    return Boolean(
      headers.get("Idempotency-Key")
    );
  }

  return false;
}

function esOperacionIdempotente(
  config: ConfigReintento
): boolean {

  const metodo =
    config.method?.toUpperCase() ?? "GET";

  if (
    ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]
      .includes(metodo)
  ) {
    return true;
  }

  /*
   * POST solo puede reintentarse automáticamente
   * cuando posee una clave de idempotencia.
   */
  if (
    metodo === "POST" &&
    tieneIdempotencyKey(config)
  ) {
    return true;
  }

  return false;
}

function esFalloTemporal(
  error: AxiosError
): boolean {

  const status = error.response?.status;

  // Timeout
  if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    return true;
  }

  // Fallo de red
  if (!error.response) {
    return true;
  }

  // Errores temporales del servidor
  if (status && status >= 500) {
    return true;
  }

  return false;
}

export function configurarReintentos(
  cliente: AxiosInstance
) {
  cliente.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      const config =
        error.config as
          | ConfigReintento
          | undefined;

      /*
       * 401 NO se procesa aquí.
       * Lo resuelve el interceptor de renovación.
       */
      if (error.response?.status === 401) {
        return Promise.reject(
          traducirErrorApi(error)
        );
      }

      if (
        !config ||
        !esOperacionIdempotente(config) ||
        !esFalloTemporal(error)
      ) {
        return Promise.reject(
          traducirErrorApi(error)
        );
      }

      config._retryCount ??= 0;

      if (
        config._retryCount >= MAX_REINTENTOS
      ) {
        return Promise.reject(
          traducirErrorApi(error)
        );
      }

      config._retryCount += 1;

      /*
       * Backoff:
       * intento 1 -> 500 ms
       * intento 2 -> 1000 ms
       */
      const demora =
        500 *
        Math.pow(
          2,
          config._retryCount - 1
        );

      console.log(
        `🔁 Reintento ${config._retryCount}/${MAX_REINTENTOS} en ${demora} ms`
      );

      await esperar(demora);

      return cliente(config);
    }
  );
}
