import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Linking } from "react-native";

export type EstadoPermisoNativo =
  | "no_solicitado"
  | "concedido"
  | "denegado"
  | "denegado_permanente"
  | "no_disponible";

type RespuestaPermiso = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

function interpretarPermiso(
  permiso: RespuestaPermiso,
  disponible = true
): EstadoPermisoNativo {
  if (!disponible) {
    return "no_disponible";
  }

  if (permiso.granted || permiso.status === "granted") {
    return "concedido";
  }

  if (permiso.status === "undetermined") {
    return "no_solicitado";
  }

  if (
    permiso.status === "denied" &&
    permiso.canAskAgain === false
  ) {
    return "denegado_permanente";
  }

  return "denegado";
}

/**
 * =========================================================
 * CÁMARA
 * Se utiliza la API de permisos del mismo módulo que
 * posteriormente abre la cámara: expo-image-picker.
 * =========================================================
 */

export async function obtenerEstadoPermisoCamara():
  Promise<EstadoPermisoNativo> {

  try {
    const permiso =
      await ImagePicker.getCameraPermissionsAsync();

    return interpretarPermiso(permiso);
  } catch (error) {
    console.log(
      "❌ No fue posible consultar permiso de cámara:",
      error
    );

    return "no_disponible";
  }
}

export async function solicitarPermisoCamara():
  Promise<EstadoPermisoNativo> {

  try {
    const actual =
      await ImagePicker.getCameraPermissionsAsync();

    if (actual.granted) {
      return "concedido";
    }

    if (
      actual.status === "denied" &&
      actual.canAskAgain === false
    ) {
      return "denegado_permanente";
    }

    const permiso =
      await ImagePicker.requestCameraPermissionsAsync();

    return interpretarPermiso(permiso);
  } catch (error) {
    console.log(
      "❌ No fue posible solicitar permiso de cámara:",
      error
    );

    return "no_disponible";
  }
}

/**
 * =========================================================
 * UBICACIÓN
 * =========================================================
 */

export async function obtenerEstadoPermisoUbicacion():
  Promise<EstadoPermisoNativo> {

  try {
    const serviciosActivos =
      await Location.hasServicesEnabledAsync();

    if (!serviciosActivos) {
      return "no_disponible";
    }

    const permiso =
      await Location.getForegroundPermissionsAsync();

    return interpretarPermiso(
      permiso,
      serviciosActivos
    );
  } catch (error) {
    console.log(
      "❌ No fue posible consultar ubicación:",
      error
    );

    return "no_disponible";
  }
}

export async function solicitarPermisoUbicacion():
  Promise<EstadoPermisoNativo> {

  try {
    const serviciosActivos =
      await Location.hasServicesEnabledAsync();

    if (!serviciosActivos) {
      return "no_disponible";
    }

    const actual =
      await Location.getForegroundPermissionsAsync();

    if (actual.granted) {
      return "concedido";
    }

    if (
      actual.status === "denied" &&
      actual.canAskAgain === false
    ) {
      return "denegado_permanente";
    }

    const permiso =
      await Location.requestForegroundPermissionsAsync();

    return interpretarPermiso(
      permiso,
      serviciosActivos
    );
  } catch (error) {
    console.log(
      "❌ No fue posible solicitar ubicación:",
      error
    );

    return "no_disponible";
  }
}

/**
 * =========================================================
 * AJUSTES
 * =========================================================
 */

export async function abrirAjustesAplicacion():
  Promise<void> {

  await Linking.openSettings();
}

/**
 * =========================================================
 * MENSAJES DE DEGRADACIÓN
 * =========================================================
 */

export function mensajeCamara(
  estado: EstadoPermisoNativo
): string {
  switch (estado) {
    case "concedido":
      return "Cámara disponible.";

    case "denegado":
      return (
        "La cámara permite adjuntar evidencia visual " +
        "de la especie. Puede volver a solicitar el permiso " +
        "o continuar sin fotografía."
      );

    case "denegado_permanente":
      return (
        "El acceso a la cámara está deshabilitado. " +
        "Puede habilitarlo desde los Ajustes del dispositivo " +
        "o continuar sin fotografía."
      );

    case "no_disponible":
      return (
        "La cámara no está disponible. " +
        "Puede seleccionar una fotografía existente " +
        "o continuar sin imagen."
      );

    default:
      return (
        "BioSacha puede utilizar la cámara para fotografiar " +
        "la especie vegetal cuando usted lo solicite."
      );
  }
}

export function mensajeUbicacion(
  estado: EstadoPermisoNativo
): string {
  switch (estado) {
    case "concedido":
      return "Ubicación disponible.";

    case "denegado":
      return (
        "La ubicación permite asociar el registro botánico " +
        "con el lugar de observación. Puede volver a solicitar " +
        "el permiso o continuar sin ubicación."
      );

    case "denegado_permanente":
      return (
        "El acceso a la ubicación está deshabilitado. " +
        "Puede habilitarlo desde los Ajustes del dispositivo " +
        "o continuar guardando el registro sin ubicación."
      );

    case "no_disponible":
      return (
        "Los servicios de ubicación no están disponibles. " +
        "El registro puede guardarse sin coordenadas."
      );

    default:
      return (
        "BioSacha puede utilizar la ubicación únicamente " +
        "cuando usted solicite asociarla al registro."
      );
  }
}
