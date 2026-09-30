import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme";
import { BotonPrimario } from "./BotonPrimario";

export type TipoVistaEstado = "cargando" | "vacio" | "error";

type VistaEstadoProps = {
  tipo: TipoVistaEstado;
  mensaje?: string;
  compacta?: boolean;
  onReintentar?: () => void;
  accionAdicional?: ReactNode;
};

const contenidoPorEstado = {
  cargando: {
    titulo: "Cargando información",
    mensaje: "Estamos obteniendo los datos de BioSacha.",
  },
  vacio: {
    titulo: "Aún no existen registros",
    mensaje:
      "Cuando se registren plantas, aparecerán en este espacio.",
  },
  error: {
    titulo: "No fue posible cargar la información",
    mensaje:
      "Verifique la conexión e intente nuevamente.",
  },
} as const;

export function VistaEstado({
  tipo,
  mensaje,
  compacta = false,
  onReintentar,
  accionAdicional,
}: VistaEstadoProps) {
  const contenido = contenidoPorEstado[tipo];

  return (
    <View
      style={[
        styles.contenedor,
        compacta && styles.compacto,
      ]}
      accessible
      accessibilityLabel={`${contenido.titulo}. ${
        mensaje ?? contenido.mensaje
      }`}
    >
      {tipo === "cargando" ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.actionPrimary}
          accessibilityLabel="Cargando información"
        />
      ) : null}

      <Text style={styles.titulo}>
        {contenido.titulo}
      </Text>

      <Text style={styles.mensaje}>
        {mensaje ?? contenido.mensaje}
      </Text>

      {tipo === "error" && onReintentar ? (
        <View style={styles.accion}>
          <BotonPrimario
            texto="Reintentar"
            onPress={onReintentar}
            accessibilityLabel="Reintentar carga de información"
          />
        </View>
      ) : null}

      {accionAdicional ? (
        <View style={styles.accionAdicional}>
          {accionAdicional}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.medium,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  compacto: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  titulo: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },

  mensaje: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  accion: {
    width: "100%",
    marginTop: theme.spacing.sm,
  },

  accionAdicional: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
  },
});
