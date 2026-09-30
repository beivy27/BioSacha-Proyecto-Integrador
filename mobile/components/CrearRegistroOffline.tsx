import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  crearRegistroOffline,
  obtenerOperacionesPendientes,
} from "../services/outboxService";

import {
  obtenerMetadatosNativos,
} from "../services/nativeDraft";

export function CrearRegistroOffline() {
  const [nombreLocal, setNombreLocal] =
    useState("Guayusa");

  const [nombreCientifico, setNombreCientifico] =
    useState("Ilex guayusa");

  const [comunidad, setComunidad] =
    useState("Comunidad Amazónica BioSacha");

  const [mensaje, setMensaje] =
    useState<string>("");

  const [detalle, setDetalle] =
    useState<string>("");

  const [guardando, setGuardando] =
    useState(false);

  const [localUuidActual, setLocalUuidActual] =
    useState<string | null>(null);

  /*
   * SEMANA 13
   * Recupera del Outbox los errores HTTP 422
   * y los presenta asociados a sus campos.
   */
  useEffect(() => {
    if (!localUuidActual) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const operaciones =
          await obtenerOperacionesPendientes();

        const operacion = operaciones.find(
          (item) =>
            item.local_uuid === localUuidActual
        );

        if (!operacion?.ultimo_error) {
          return;
        }

        let info: any;

        try {
          info = JSON.parse(
            operacion.ultimo_error
          );
        } catch {
          return;
        }

        if (info?.tipo !== "VALIDATION_422") {
          return;
        }

        const errores =
          info?.errores ?? {};

        const textoError = (valor: unknown) => {
          if (Array.isArray(valor)) {
            return valor.join(" ");
          }

          return String(valor ?? "");
        };

        const mensajes: string[] = [];

        if (errores.nombre_local) {
          mensajes.push(
            `Nombre local: ${textoError(
              errores.nombre_local
            )}`
          );
        }

        if (errores.nombre_cientifico) {
          mensajes.push(
            `Nombre científico: ${textoError(
              errores.nombre_cientifico
            )}`
          );
        }

        if (errores.comunidad) {
          mensajes.push(
            `Comunidad: ${textoError(
              errores.comunidad
            )}`
          );
        }

        setMensaje(
          "❌ Respuesta HTTP 422 — datos inválidos."
        );

        setDetalle(
          mensajes.join("\n") ||
          info?.mensaje ||
          "Revise los campos ingresados."
        );

        console.log(
          "🧩 HTTP 422 mostrado en formulario:",
          errores
        );

        clearInterval(timer);

      } catch (error) {
        console.log(
          "No se pudo consultar el estado 422:",
          error
        );
      }
    }, 800);

    return () => {
      clearInterval(timer);
    };
  }, [localUuidActual]);

  async function guardar() {
    if (
      !nombreLocal.trim() ||
      !nombreCientifico.trim() ||
      !comunidad.trim()
    ) {
      setMensaje("Complete todos los campos.");
      return;
    }

    const metadatosNativos =
      obtenerMetadatosNativos();

    setGuardando(true);

    try {
      const resultado =
        await crearRegistroOffline({
          nombre_local: nombreLocal,
          nombre_cientifico: nombreCientifico,
          comunidad,

          foto_uri:
            metadatosNativos.foto_uri,

          latitud:
            metadatosNativos.latitud,

          longitud:
            metadatosNativos.longitud,

          precision_ubicacion:
            metadatosNativos.precision_ubicacion,
        });

      setLocalUuidActual(


        resultado.local_uuid


      );



      const pendientes =


        await obtenerOperacionesPendientes();

      setMensaje(
        "Registro guardado localmente. Pendiente de sincronización."
      );

      setDetalle(
        `Outbox: ${resultado.pendientes} pendiente(s)\n` +
        `Estado: pendiente\n` +
        `Intentos: 0 / 5\n` +
        `local_uuid: ${resultado.local_uuid.slice(0, 13)}...\n` +
        `Idempotencia: configurada\n` +
        `Fotografía: ${
          metadatosNativos.foto_uri
            ? "asociada"
            : "no asociada"
        }\n` +
        `Ubicación: ${
          metadatosNativos.latitud !== null &&
          metadatosNativos.longitud !== null
            ? "asociada"
            : "no asociada"
        }\n` +
        `Persistencia nativa: SQLite`
      );

      console.log(
        "✅ REGISTRO OFFLINE CREADO",
        {
          local_uuid: resultado.local_uuid,
          idempotency_key:
            resultado.idempotency_key,
          operaciones:
            pendientes.length,
        }
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro local."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View
      style={styles.panel}
      accessible
      accessibilityLabel="Creación de registro sin conexión"
    >
      <Text style={styles.titulo}>
        Registro sin conexión
      </Text>

      <Text style={styles.descripcion}>
        El registro se guarda primero en SQLite y
        permanece en la cola Outbox hasta recuperar
        la conexión.
      </Text>

      <Text style={styles.etiqueta}>
        Nombre local
      </Text>

      <TextInput
        value={nombreLocal}
        onChangeText={setNombreLocal}
        style={styles.campo}
        accessibilityLabel="Nombre local de la planta"
      />

      <Text style={styles.etiqueta}>
        Nombre científico
      </Text>

      <TextInput
        value={nombreCientifico}
        onChangeText={setNombreCientifico}
        style={styles.campo}
        accessibilityLabel="Nombre científico de la planta"
      />

      <Text style={styles.etiqueta}>
        Comunidad
      </Text>

      <TextInput
        value={comunidad}
        onChangeText={setComunidad}
        style={styles.campo}
        accessibilityLabel="Comunidad del registro"
      />

      <Pressable
        onPress={guardar}
        disabled={guardando}
        accessibilityRole="button"
        accessibilityLabel="Guardar registro sin conexión"
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>
          {guardando
            ? "Guardando..."
            : "Guardar sin conexión"}
        </Text>
      </Pressable>

      {mensaje ? (
        <Text style={styles.mensaje}>
          {mensaje}
        </Text>
      ) : null}

      {detalle ? (
        <Text style={styles.detalle}>
          {detalle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: "#5f6872",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 10,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#172033",
  },

  descripcion: {
    fontSize: 16,
    color: "#4b5563",
  },

  etiqueta: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172033",
  },

  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#667085",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#172033",
  },

  boton: {
    minHeight: 48,
    backgroundColor: "#086b46",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  botonTexto: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  mensaje: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9a5b00",
  },

  detalle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
});
