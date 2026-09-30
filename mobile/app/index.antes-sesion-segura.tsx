import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  BotonPrimario,
  TarjetaRegistroBotanico,
  VistaEstado,
} from "../components";

import { theme } from "../theme";

type RegistroBotanico = {
  id_registro: number;
  habitat: string;
  estado_validacion: string;

  planta: {
    nombre_cientifico: string;
    nombre_local_principal: string;
  };

  comunidad: {
    nombre: string;
    provincia: string;
  };

  usuario: {
    nombre: string;
    rol: string;
  };
};

type RespuestaRegistros = {
  exito: boolean;
  datos: RegistroBotanico[];
  mensaje?: string;
};

export default function Index() {
  const { width } = useWindowDimensions();

  const esAnchoAmplio =
    width >= theme.breakpoints.wide;

  const [registros, setRegistros] =
    useState<RegistroBotanico[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const API_URL =
    process.env.EXPO_PUBLIC_API_URL;

  const cargarRegistros =
    useCallback(async () => {
      setCargando(true);
      setError("");

      try {
        if (!API_URL) {
          throw new Error("CONFIGURACION_API");
        }

        const respuesta = await fetch(
          `${API_URL}/api/registros`
        );

        if (respuesta.status === 401) {
          throw new Error("SESION_EXPIRADA");
        }

        if (respuesta.status === 403) {
          throw new Error("SIN_PERMISOS");
        }

        if (!respuesta.ok) {
          throw new Error("ERROR_SERVIDOR");
        }

        const json =
          (await respuesta.json()) as RespuestaRegistros;

        if (
          !json.exito ||
          !Array.isArray(json.datos)
        ) {
          throw new Error("RESPUESTA_INVALIDA");
        }

        setRegistros(json.datos);
      } catch (e) {
        const codigo =
          e instanceof Error
            ? e.message
            : "ERROR_CONEXION";

        const mensajes:
          Record<string, string> = {
          CONFIGURACION_API:
            "La aplicación no tiene configurada la dirección del servicio.",
          SESION_EXPIRADA:
            "La sesión ha expirado. Inicie sesión nuevamente.",
          SIN_PERMISOS:
            "No dispone de permisos para consultar los registros.",
          ERROR_SERVIDOR:
            "El servicio no está disponible temporalmente.",
          RESPUESTA_INVALIDA:
            "La información recibida no tiene el formato esperado.",
          ERROR_CONEXION:
            "No fue posible conectar con BioSacha.",
        };

        setError(
          mensajes[codigo] ??
            mensajes.ERROR_CONEXION
        );
      } finally {
        setCargando(false);
      }
    }, [API_URL]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  return (
    <SafeAreaView
      style={styles.pantalla}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          esAnchoAmplio &&
            styles.contenidoAmplio,
        ]}
      >
        <View
          style={[
            styles.distribucion,
            esAnchoAmplio &&
              styles.distribucionAmplia,
          ]}
        >
          <View
            style={[
              styles.panelIntroduccion,
              esAnchoAmplio &&
                styles.panelIntroduccionAmplio,
            ]}
          >
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>
                BioSacha
              </Text>

              <Text style={styles.subtitulo}>
                Herbario digital y sabiduría ancestral
              </Text>

              <Text style={styles.descripcion}>
                Registros botánicos almacenados
                en la API del proyecto.
              </Text>
            </View>

            {!cargando && !error ? (
              <BotonPrimario
                texto="Actualizar registros"
                onPress={cargarRegistros}
                accessibilityLabel="Actualizar registros botánicos"
              />
            ) : null}
          </View>

          <View
            style={[
              styles.panelDatos,
              esAnchoAmplio &&
                styles.panelDatosAmplio,
            ]}
          >
            {cargando ? (
              <VistaEstado
                tipo="cargando"
                mensaje="Consultando los registros botánicos."
              />
            ) : null}

            {!cargando && error ? (
              <VistaEstado
                tipo="error"
                mensaje={error}
                onReintentar={cargarRegistros}
              />
            ) : null}

            {!cargando &&
            !error &&
            registros.length === 0 ? (
              <VistaEstado
                tipo="vacio"
                mensaje="Todavía no existen registros botánicos para mostrar."
              />
            ) : null}

            {!cargando &&
            !error &&
            registros.length > 0 ? (
              <View style={styles.lista}>
                <Text style={styles.seccionTitulo}>
                  Registros botánicos
                </Text>

                {registros.map((registro) => (
                  <TarjetaRegistroBotanico
                    key={registro.id_registro}
                    nombreComun={
                      registro.planta
                        .nombre_local_principal
                    }
                    nombreCientifico={
                      registro.planta
                        .nombre_cientifico
                    }
                    comunidad={
                      registro.comunidad.nombre
                    }
                    estadoValidacion={
                      registro.estado_validacion
                    }
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  contenido: {
    flexGrow: 1,
    paddingHorizontal:
      theme.spacing.md,
    paddingVertical:
      theme.spacing.lg,
  },

  contenidoAmplio: {
    paddingHorizontal:
      theme.spacing.xl,
  },

  distribucion: {
    gap: theme.spacing.lg,
  },

  distribucionAmplia: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  panelIntroduccion: {
    gap: theme.spacing.lg,
  },

  panelIntroduccionAmplio: {
    flex: 1,
  },

  panelDatos: {
    gap: theme.spacing.md,
  },

  panelDatosAmplio: {
    flex: 2,
  },

  encabezado: {
    gap: theme.spacing.sm,
  },

  titulo: {
    ...theme.typography.titleLarge,
    color:
      theme.colors.actionPrimary,
  },

  subtitulo: {
    ...theme.typography.subtitle,
    color:
      theme.colors.textPrimary,
  },

  descripcion: {
    ...theme.typography.body,
    color:
      theme.colors.textSecondary,
  },

  lista: {
    gap: theme.spacing.md,
  },

  seccionTitulo: {
    ...theme.typography.title,
    color:
      theme.colors.textPrimary,
  },
});
