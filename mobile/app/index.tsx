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
import SesionSegura from "../components/SesionSegura";
import { EstadoPersistenciaLocal } from "../components/EstadoPersistenciaLocal";
import { RegistrosOffline } from "../components/RegistrosOffline";
import { CrearRegistroOffline } from "../components/CrearRegistroOffline";
import CapacidadesNativasSemana14 from "../components/CapacidadesNativasSemana14";
import { obtenerRegistros } from "../data/repositories/registrosRepository";

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

  const cargarRegistros =
    useCallback(async () => {
      setCargando(true);
      setError("");

      try {
        /*
         * SEMANA 13
         * La UI consulta únicamente al Repository.
         * No conoce si los datos proceden
         * del backend/PostgreSQL o de SQLite.
         */
        const datos =
          await obtenerRegistros();

        const registrosUI: RegistroBotanico[] =
          datos.map((registro) => ({
            id_registro:
              registro.idRegistro,

            habitat:
              "Registro botánico BioSacha",

            estado_validacion:
              registro.estadoValidacion,

            planta: {
              nombre_cientifico:
                registro.nombreCientifico,

              nombre_local_principal:
                registro.nombreLocal,
            },

            comunidad: {
              nombre:
                registro.comunidad ??
                "No registrada",

              provincia:
                "",
            },

            usuario: {
              nombre:
                "Usuario BioSacha",

              rol:
                "comunitario",
            },
          }));

        setRegistros(registrosUI);

      } catch (e) {
        console.log(
          "Error cargando registros desde Repository:",
          e
        );

        setError(
          "No fue posible recuperar los registros botánicos."
        );
      } finally {
        setCargando(false);
      }
    }, []);

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
        <SesionSegura />
        <EstadoPersistenciaLocal />
        <RegistrosOffline />
        <CrearRegistroOffline />
        <CapacidadesNativasSemana14 />
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
