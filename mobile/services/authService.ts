import { limpiarAlmacenLocal } from "./database";
import {
  eliminarTokens,
  guardarTokens,
  obtenerTokens,
  TokensSesion,
} from "./sessionStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL no está configurada. La aplicación necesitará esta variable para conectarse al backend."
  );
}

export type UsuarioSesion = {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
};

type LoginRespuesta = {
  exito: boolean;
  datos?: {
    usuario?: UsuarioSesion;
    tokens?: TokensSesion;
  };
  mensaje?: string;
};

type SesionRespuesta = {
  exito: boolean;
  datos?: {
    usuario?: UsuarioSesion;
  };
  mensaje?: string;
};

export async function iniciarSesion(
  correo: string,
  password: string
): Promise<UsuarioSesion> {
  if (!API_URL) {
    throw new Error("La URL de la API no está configurada.");
  }

  const respuesta = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo,
      password,
    }),
  });

  const data: LoginRespuesta = await respuesta.json();

  if (
    !respuesta.ok ||
    !data.exito ||
    !data.datos?.usuario ||
    !data.datos?.tokens
  ) {
    throw new Error(
      data.mensaje ?? "No fue posible iniciar sesión."
    );
  }

  await guardarTokens(data.datos.tokens);

  return data.datos.usuario;
}

export async function restaurarSesion():
  Promise<UsuarioSesion | null> {
  if (!API_URL) {
    return null;
  }

  const tokens = await obtenerTokens();

  if (!tokens?.access_token || !tokens.refresh_token) {
    return null;
  }

  // Intento inicial con access token almacenado.
  const sesion = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (sesion.ok) {
    const data: SesionRespuesta = await sesion.json();

    return data.datos?.usuario ?? null;
  }

  // Si venció el access token, intenta renovarlo.
  const refresh = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!refresh.ok) {
    await eliminarTokens();
    return null;
  }

  const refreshData: LoginRespuesta = await refresh.json();
  const nuevosTokens = refreshData.datos?.tokens;

  if (!nuevosTokens) {
    await eliminarTokens();
    return null;
  }

  await guardarTokens(nuevosTokens);

  const nuevaSesion = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${nuevosTokens.access_token}`,
    },
  });

  if (!nuevaSesion.ok) {
    await eliminarTokens();
    return null;
  }

  const data: SesionRespuesta = await nuevaSesion.json();

  return data.datos?.usuario ?? null;
}

export async function cerrarSesion(): Promise<void> {
  try {
    // Elimina registros botánicos y operaciones pendientes.
    await limpiarAlmacenLocal();
  } finally {
    // Las credenciales siempre se eliminan del almacenamiento cifrado.
    await eliminarTokens();
  }

  console.log("✅ Sesión cerrada y almacén local eliminado completamente.");
}
