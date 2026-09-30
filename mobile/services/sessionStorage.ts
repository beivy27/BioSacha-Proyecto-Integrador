import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "biosacha_access_token";
const REFRESH_TOKEN_KEY = "biosacha_refresh_token";

export type TokensSesion = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: string | number;
};

/**
 * Guarda únicamente las credenciales emitidas por la API.
 * La contraseña del usuario nunca se persiste.
 */
export async function guardarTokens(tokens: TokensSesion): Promise<void> {
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("La API no proporcionó los tokens requeridos.");
  }

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

/**
 * Recupera la sesión cifrada almacenada por el sistema operativo.
 */
export async function obtenerTokens(): Promise<TokensSesion | null> {
  const [access_token, refresh_token] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (!access_token || !refresh_token) {
    return null;
  }

  return {
    access_token,
    refresh_token,
    token_type: "Bearer",
  };
}

/**
 * Elimina completamente las credenciales al cerrar sesión.
 */
export async function eliminarTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/**
 * Permite comprobar si existe una sesión persistida.
 */
export async function existeSesionSegura(): Promise<boolean> {
  const tokens = await obtenerTokens();
  return tokens !== null;
}
