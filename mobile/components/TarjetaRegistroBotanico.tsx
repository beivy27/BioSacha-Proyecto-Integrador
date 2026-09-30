import React, { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme";

type TarjetaRegistroBotanicoProps = {
  nombreComun: string;
  nombreCientifico: string;
  comunidad?: string;
  estadoValidacion?: string;
  compacta?: boolean;
  mostrarComunidad?: boolean;
  onPress?: () => void;
  accionFinal?: ReactNode;
};

export function TarjetaRegistroBotanico({
  nombreComun,
  nombreCientifico,
  comunidad,
  estadoValidacion,
  compacta = false,
  mostrarComunidad = true,
  onPress,
  accionFinal,
}: TarjetaRegistroBotanicoProps) {
  const interactiva = Boolean(onPress);

  const contenido = (
    <View
      style={[
        styles.tarjeta,
        compacta && styles.tarjetaCompacta,
      ]}
    >
      <View style={styles.contenidoPrincipal}>
        <Text style={styles.nombreComun}>
          {nombreComun}
        </Text>

        <Text style={styles.nombreCientifico}>
          {nombreCientifico}
        </Text>

        {mostrarComunidad && comunidad ? (
          <Text style={styles.datoSecundario}>
            Comunidad: {comunidad}
          </Text>
        ) : null}

        {estadoValidacion ? (
          <Text style={styles.estado}>
            Estado: {estadoValidacion}
          </Text>
        ) : null}
      </View>

      {accionFinal ? (
        <View style={styles.accionFinal}>
          {accionFinal}
        </View>
      ) : null}
    </View>
  );

  if (!interactiva) {
    return (
      <View
        accessible
        accessibilityLabel={`${nombreComun}, ${nombreCientifico}`}
      >
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir registro de ${nombreComun}, ${nombreCientifico}`}
      style={({ pressed }) => [
        pressed && styles.presionada,
      ]}
    >
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.components.cardBackground,
    borderRadius: theme.components.cardRadius,
    padding: theme.components.cardPadding,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.textSecondary,
    gap: theme.spacing.md,
  },

  tarjetaCompacta: {
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },

  contenidoPrincipal: {
    flex: 1,
    gap: theme.spacing.xs,
  },

  nombreComun: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
  },

  nombreCientifico: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },

  datoSecundario: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },

  estado: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },

  accionFinal: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  presionada: {
    opacity: theme.stateOpacity.pressed,
  },
});
