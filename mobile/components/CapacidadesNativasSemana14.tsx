import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import {
  abrirAjustesAplicacion,
  EstadoPermisoNativo,
  mensajeCamara,
  mensajeUbicacion,
  obtenerEstadoPermisoCamara,
  obtenerEstadoPermisoUbicacion,
  solicitarPermisoCamara,
  solicitarPermisoUbicacion,
} from "../services/nativePermissions";

import {
  actualizarFotoNativa,
  actualizarUbicacionNativa,
} from "../services/nativeDraft";

type Coordenadas = {
  latitud: number;
  longitud: number;
  precision: number | null;
};

export default function CapacidadesNativasSemana14() {
  const [estadoCamara, setEstadoCamara] =
    useState<EstadoPermisoNativo>("no_solicitado");

  const [estadoUbicacion, setEstadoUbicacion] =
    useState<EstadoPermisoNativo>("no_solicitado");

  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [coordenadas, setCoordenadas] =
    useState<Coordenadas | null>(null);

  const [procesandoCamara, setProcesandoCamara] =
    useState(false);

  const [procesandoUbicacion, setProcesandoUbicacion] =
    useState(false);

  useEffect(() => {
    void consultarEstados();
  }, []);

  async function consultarEstados() {
    try {
      const [camara, ubicacion] = await Promise.all([
        obtenerEstadoPermisoCamara(),
        obtenerEstadoPermisoUbicacion(),
      ]);

      setEstadoCamara(camara);
      setEstadoUbicacion(ubicacion);
    } catch (error) {
      console.log(
        "No fue posible consultar capacidades nativas:",
        error
      );
    }
  }

  async function ejecutarCamara() {
    try {
      setProcesandoCamara(true);

      let estado = await obtenerEstadoPermisoCamara();
      setEstadoCamara(estado);

      if (estado === "no_disponible") {
        Alert.alert(
          "Cámara no disponible",
          mensajeCamara(estado)
        );
        return;
      }

      if (estado === "denegado_permanente") {
        Alert.alert(
          "Permiso de cámara deshabilitado",
          mensajeCamara(estado),
          [
            {
              text: "Continuar sin foto",
              style: "cancel",
            },
            {
              text: "Abrir Ajustes",
              onPress: () => {
                void abrirAjustesAplicacion();
              },
            },
          ]
        );
        return;
      }

      if (estado !== "concedido") {
        Alert.alert(
          "Permiso para usar la cámara",
          "BioSacha utiliza la cámara únicamente cuando usted decide fotografiar una especie vegetal. La fotografía es opcional y el registro puede guardarse sin ella.",
          [
            {
              text: "Ahora no",
              style: "cancel",
            },
            {
              text: "Continuar",
              onPress: () => {
                void solicitarYAbrirCamara().catch((error) => {
                  console.log("❌ ERROR SOLICITANDO CÁMARA:", error);
                  Alert.alert(
                    "Cámara no disponible",
                    "No fue posible iniciar la cámara. Puede continuar sin fotografía."
                  );
                });
              },
            },
          ]
        );

        return;
      }

      await abrirCamara();
    } finally {
      setProcesandoCamara(false);
    }
  }

  async function solicitarYAbrirCamara() {
    const estado = await solicitarPermisoCamara();
    setEstadoCamara(estado);

    if (estado === "concedido") {
      await abrirCamara();
      return;
    }

    if (estado === "denegado_permanente") {
      Alert.alert(
        "Cámara deshabilitada",
        mensajeCamara(estado),
        [
          {
            text: "Continuar sin foto",
            style: "cancel",
          },
          {
            text: "Abrir Ajustes",
            onPress: () => {
              void abrirAjustesAplicacion();
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Permiso no concedido",
      mensajeCamara(estado)
    );
  }

  async function abrirCamara() {
    const resultado =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const uri = resultado.assets[0].uri;

      setFotoUri(uri);
      actualizarFotoNativa(uri);

      console.log(
        "✅ FOTO NATIVA CAPTURADA:",
        uri
      );
    }
  }

  async function seleccionarFotografia() {
    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !resultado.canceled &&
        resultado.assets.length > 0
      ) {
        const uri = resultado.assets[0].uri;

        setFotoUri(uri);

        console.log(
          "✅ PHOTO PICKER DEL SISTEMA:",
          uri
        );
      }
    } catch (error) {
      Alert.alert(
        "Selector no disponible",
        "No fue posible abrir el selector de fotografías. Puede continuar guardando el registro sin imagen."
      );

      console.log(
        "Error Photo Picker:",
        error
      );
    }
  }

  async function ejecutarUbicacion() {
    try {
      setProcesandoUbicacion(true);

      let estado =
        await obtenerEstadoPermisoUbicacion();

      setEstadoUbicacion(estado);

      if (estado === "no_disponible") {
        Alert.alert(
          "Ubicación no disponible",
          mensajeUbicacion(estado)
        );
        return;
      }

      if (estado === "denegado_permanente") {
        Alert.alert(
          "Permiso de ubicación deshabilitado",
          mensajeUbicacion(estado),
          [
            {
              text: "Continuar sin ubicación",
              style: "cancel",
            },
            {
              text: "Abrir Ajustes",
              onPress: () => {
                void abrirAjustesAplicacion();
              },
            },
          ]
        );

        return;
      }

      if (estado !== "concedido") {
        Alert.alert(
          "Permiso para usar la ubicación",
          "BioSacha utiliza su ubicación únicamente cuando usted decide asociar el lugar de observación al registro botánico. Puede continuar sin compartirla.",
          [
            {
              text: "Ahora no",
              style: "cancel",
            },
            {
              text: "Continuar",
              onPress: () => {
                void solicitarYObtenerUbicacion();
              },
            },
          ]
        );

        return;
      }

      await obtenerUbicacion();
    } finally {
      setProcesandoUbicacion(false);
    }
  }

  async function solicitarYObtenerUbicacion() {
    const estado =
      await solicitarPermisoUbicacion();

    setEstadoUbicacion(estado);

    if (estado === "concedido") {
      await obtenerUbicacion();
      return;
    }

    if (estado === "denegado_permanente") {
      Alert.alert(
        "Ubicación deshabilitada",
        mensajeUbicacion(estado),
        [
          {
            text: "Continuar sin ubicación",
            style: "cancel",
          },
          {
            text: "Abrir Ajustes",
            onPress: () => {
              void abrirAjustesAplicacion();
            },
          },
        ]
      );

      return;
    }

    Alert.alert(
      "Permiso no concedido",
      mensajeUbicacion(estado)
    );
  }

  async function obtenerUbicacion() {
    try {
      const posicion =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const nuevasCoordenadas: Coordenadas = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
        precision: posicion.coords.accuracy,
      };

      setCoordenadas(nuevasCoordenadas);

      actualizarUbicacionNativa(
        nuevasCoordenadas.latitud,
        nuevasCoordenadas.longitud,
        nuevasCoordenadas.precision
      );

      console.log(
        "✅ UBICACIÓN NATIVA OBTENIDA:",
        nuevasCoordenadas
      );
    } catch (error) {
      Alert.alert(
        "Ubicación no disponible",
        "No fue posible obtener las coordenadas en este momento. Puede continuar guardando el registro sin ubicación."
      );

      console.log(
        "Error obteniendo ubicación:",
        error
      );
    }
  }

  function textoEstado(
    estado: EstadoPermisoNativo
  ): string {
    switch (estado) {
      case "concedido":
        return "Concedido";

      case "denegado":
        return "Denegado";

      case "denegado_permanente":
        return "Denegado permanentemente";

      case "no_disponible":
        return "No disponible";

      default:
        return "No solicitado";
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.titulo}>
        Capacidades nativas
      </Text>

      <Text style={styles.descripcion}>
        BioSacha solicita cada permiso únicamente cuando
        usted utiliza la función correspondiente.
      </Text>

      <View style={styles.capacidad}>
        <Text style={styles.subtitulo}>
          📷 Cámara
        </Text>

        <Text style={styles.estado}>
          Estado: {textoEstado(estadoCamara)}
        </Text>

        <Pressable
          style={styles.botonPrincipal}
          onPress={() => {
            void ejecutarCamara().catch((error) => {
              console.log("❌ ERROR FLUJO CÁMARA:", error);
              Alert.alert(
                "Cámara no disponible",
                "No fue posible abrir la cámara. Puede seleccionar una fotografía existente o continuar sin imagen."
              );
            });
          }}
          disabled={procesandoCamara}
        >
          <Text style={styles.botonTexto}>
            {procesandoCamara
              ? "Comprobando..."
              : "Tomar fotografía"}
          </Text>
        </Pressable>

        {estadoCamara ===
          "denegado_permanente" && (
          <Pressable
            style={styles.botonSecundario}
            onPress={() => {
              void abrirAjustesAplicacion();
            }}
          >
            <Text style={styles.botonSecundarioTexto}>
              Abrir Ajustes
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.capacidad}>
        <Text style={styles.subtitulo}>
          🖼 Fotografía existente
        </Text>

        <Text style={styles.textoAuxiliar}>
          Se utiliza el selector del sistema sin solicitar
          acceso amplio a toda la galería.
        </Text>

        <Pressable
          style={styles.botonPrincipal}
          onPress={() => {
            void seleccionarFotografia();
          }}
        >
          <Text style={styles.botonTexto}>
            Seleccionar fotografía
          </Text>
        </Pressable>
      </View>

      {fotoUri ? (
        <View style={styles.resultado}>
          <Text style={styles.resultadoTitulo}>
            Fotografía seleccionada
          </Text>

          <Image
            source={{ uri: fotoUri }}
            style={styles.imagen}
            resizeMode="cover"
          />

          <Pressable
            style={styles.botonQuitar}
            onPress={() => {
              setFotoUri(null);
              actualizarFotoNativa(null);
            }}
          >
            <Text style={styles.botonQuitarTexto}>
              Quitar fotografía
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.sinDato}>
          Sin fotografía. El registro puede continuar.
        </Text>
      )}

      <View style={styles.capacidad}>
        <Text style={styles.subtitulo}>
          📍 Ubicación
        </Text>

        <Text style={styles.estado}>
          Estado: {textoEstado(estadoUbicacion)}
        </Text>

        <Pressable
          style={styles.botonPrincipal}
          onPress={() => {
            void ejecutarUbicacion();
          }}
          disabled={procesandoUbicacion}
        >
          <Text style={styles.botonTexto}>
            {procesandoUbicacion
              ? "Comprobando..."
              : "Obtener ubicación"}
          </Text>
        </Pressable>

        {estadoUbicacion ===
          "denegado_permanente" && (
          <Pressable
            style={styles.botonSecundario}
            onPress={() => {
              void abrirAjustesAplicacion();
            }}
          >
            <Text style={styles.botonSecundarioTexto}>
              Abrir Ajustes
            </Text>
          </Pressable>
        )}
      </View>

      {coordenadas ? (
        <View style={styles.resultado}>
          <Text style={styles.resultadoTitulo}>
            Ubicación asociada
          </Text>

          <Text style={styles.textoResultado}>
            Latitud: {coordenadas.latitud.toFixed(6)}
          </Text>

          <Text style={styles.textoResultado}>
            Longitud: {coordenadas.longitud.toFixed(6)}
          </Text>

          <Text style={styles.textoResultado}>
            Precisión:{" "}
            {coordenadas.precision !== null
              ? `${Math.round(
                  coordenadas.precision
                )} m`
              : "No disponible"}
          </Text>

          <Pressable
            style={styles.botonQuitar}
            onPress={() => {
              setCoordenadas(null);
              actualizarUbicacionNativa(
                null,
                null,
                null
              );
            }}
          >
            <Text style={styles.botonQuitarTexto}>
              Quitar ubicación
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.sinDato}>
          Sin ubicación. El registro puede continuar.
        </Text>
      )}

      {(estadoCamara === "denegado_permanente" ||
        estadoUbicacion ===
          "denegado_permanente") && (
        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>
            ⚙️ Permiso deshabilitado
          </Text>

          <Text style={styles.avisoTexto}>
            Puede modificar los permisos de BioSacha
            directamente desde los Ajustes del sistema.
          </Text>

          <Pressable
            style={styles.botonAjustes}
            onPress={() => {
              void Linking.openSettings();
            }}
          >
            <Text style={styles.botonTexto}>
              Abrir Ajustes del sistema
            </Text>
          </Pressable>
        </View>
      )}
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
    gap: 14,
    backgroundColor: "#ffffff",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#172033",
  },

  descripcion: {
    fontSize: 16,
    lineHeight: 23,
    color: "#4b5563",
  },

  capacidad: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 16,
    gap: 8,
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
  },

  estado: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4b5563",
  },

  textoAuxiliar: {
    fontSize: 15,
    lineHeight: 21,
    color: "#4b5563",
  },

  botonPrincipal: {
    minHeight: 50,
    backgroundColor: "#0b6b46",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  botonTexto: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },

  botonSecundario: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: "#0b6b46",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  botonSecundarioTexto: {
    color: "#0b6b46",
    fontSize: 16,
    fontWeight: "800",
  },

  resultado: {
    backgroundColor: "#eef7f2",
    borderRadius: 12,
    padding: 12,
    gap: 7,
  },

  resultadoTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b6b46",
  },

  textoResultado: {
    fontSize: 15,
    color: "#172033",
  },

  imagen: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 5,
  },

  sinDato: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6b7280",
  },

  botonQuitar: {
    paddingVertical: 8,
  },

  botonQuitarTexto: {
    color: "#9a5b00",
    fontSize: 15,
    fontWeight: "700",
  },

  aviso: {
    backgroundColor: "#fff4e5",
    borderWidth: 1,
    borderColor: "#9a5b00",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },

  avisoTitulo: {
    color: "#9a5b00",
    fontSize: 17,
    fontWeight: "800",
  },

  avisoTexto: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 21,
  },

  botonAjustes: {
    minHeight: 48,
    backgroundColor: "#9a5b00",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
});
