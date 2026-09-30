import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme";

type BotonPrimarioProps = {
  texto: string;
  onPress: () => void;
  cargando?: boolean;
  habilitado?: boolean;
  anchoCompleto?: boolean;
  iconoInicio?: ReactNode;
  accessibilityLabel?: string;
};

export function BotonPrimario({
  texto,
  onPress,
  cargando = false,
  habilitado = true,
  anchoCompleto = true,
  iconoInicio,
  accessibilityLabel,
}: BotonPrimarioProps) {
  const deshabilitado = !habilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? texto}
      accessibilityState={{
        disabled: deshabilitado,
        busy: cargando,
      }}
      style={({ pressed }) => [
        styles.boton,
        anchoCompleto && styles.anchoCompleto,
        pressed && !deshabilitado && styles.presionado,
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <View style={styles.contenido}>
        {cargando ? (
          <ActivityIndicator
            color={theme.components.primaryButtonText}
            accessibilityLabel="Procesando"
          />
        ) : (
          <>
            {iconoInicio}
            <Text style={styles.texto}>{texto}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: theme.sizes.touchTarget,
    backgroundColor: theme.components.primaryButtonBackground,
    borderRadius: theme.radius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: "center",
  },

  anchoCompleto: {
    width: "100%",
  },

  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },

  texto: {
    ...theme.typography.label,
    color: theme.components.primaryButtonText,
    textAlign: "center",
  },

  presionado: {
    opacity: theme.stateOpacity.pressed,
  },

  deshabilitado: {
    opacity: theme.stateOpacity.disabled,
  },
});
