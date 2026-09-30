import React, { ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { theme } from "../theme";

type CampoTextoProps = {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  placeholder?: string;
  mensajeError?: string;
  esObligatorio?: boolean;
  seguro?: boolean;
  habilitado?: boolean;
  iconoFinal?: ReactNode;
};

export function CampoTexto({
  etiqueta,
  valor,
  onCambiar,
  placeholder,
  mensajeError,
  esObligatorio = false,
  seguro = false,
  habilitado = true,
  iconoFinal,
}: CampoTextoProps) {
  const [enfocado, setEnfocado] = useState(false);

  const tieneError = Boolean(mensajeError);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>
        {etiqueta}
        {esObligatorio ? " *" : ""}
      </Text>

      <View
        style={[
          styles.campo,
          enfocado && styles.campoEnfocado,
          tieneError && styles.campoError,
          !habilitado && styles.campoDeshabilitado,
        ]}
      >
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={seguro}
          editable={habilitado}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={styles.entrada}
          accessibilityLabel={etiqueta}
          accessibilityHint={
            esObligatorio
              ? "Campo obligatorio"
              : undefined
          }
          accessibilityState={{
            disabled: !habilitado,
          }}
        />

        {iconoFinal ? (
          <View style={styles.iconoFinal}>
            {iconoFinal}
          </View>
        ) : null}
      </View>

      {tieneError ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {mensajeError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
    gap: theme.spacing.sm,
  },

  etiqueta: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },

  campo: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.textSecondary,
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.radius.small,
    paddingHorizontal: theme.spacing.md,
  },

  campoEnfocado: {
    borderColor: theme.colors.actionPrimary,
  },

  campoError: {
    borderColor: theme.colors.error,
  },

  campoDeshabilitado: {
    opacity: theme.stateOpacity.disabled,
  },

  entrada: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },

  iconoFinal: {
    marginLeft: theme.spacing.sm,
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
});
