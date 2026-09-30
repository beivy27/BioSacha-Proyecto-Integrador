import axios, { AxiosError } from "axios";

export type FamiliaError =
  | "SIN_CONEXION"
  | "TIMEOUT"
  | "CLIENTE_4XX"
  | "SERVIDOR_5XX"
  | "DESCONOCIDO";

export type ErroresCampos =
  Record<string, string>;

export class ApiError extends Error {
  constructor(
    public familia: FamiliaError,
    message: string,
    public status?: number,
    public erroresCampos?: ErroresCampos
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function traducirErrorApi(
  error: unknown
): ApiError {

  if (!axios.isAxiosError(error)) {
    return new ApiError(
      "DESCONOCIDO",
      "Ocurrió un error inesperado."
    );
  }

  const axiosError = error as AxiosError<{
    mensaje?: string;
    errores?: ErroresCampos;
  }>;

  const status = axiosError.response?.status;

  // 1. Sin conexión / fallo de red
  if (
    !axiosError.response &&
    axiosError.code !== "ECONNABORTED" &&
    axiosError.code !== "ETIMEDOUT"
  ) {
    return new ApiError(
      "SIN_CONEXION",
      "No hay conexión con el servidor."
    );
  }

  // 2. Timeout
  if (
    axiosError.code === "ECONNABORTED" ||
    axiosError.code === "ETIMEDOUT"
  ) {
    return new ApiError(
      "TIMEOUT",
      "La solicitud tardó demasiado. Intente nuevamente."
    );
  }

  // 3. Errores del cliente 4xx
  if (status && status >= 400 && status < 500) {
    return new ApiError(
      "CLIENTE_4XX",
      axiosError.response?.data?.mensaje ??
        "La solicitud contiene datos inválidos.",
      status,
      axiosError.response?.data?.errores
    );
  }

  // 4. Errores del servidor 5xx
  if (status && status >= 500) {
    return new ApiError(
      "SERVIDOR_5XX",
      "El servidor no está disponible temporalmente.",
      status
    );
  }

  return new ApiError(
    "DESCONOCIDO",
    "No fue posible completar la solicitud.",
    status
  );
}
