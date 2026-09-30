import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  EstadoCacheLocal,
  sincronizarRegistrosLocales,
} from "../services/cacheRegistros";

export function EstadoPersistenciaLocal() {
  const [estado, setEstado] =
    useState<EstadoCacheLocal | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function preparar() {
      try {
        const resultado =
          await sincronizarRegistrosLocales();

        setEstado(resultado);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Error inicializando SQLite."
        );
      }
    }

    preparar();
  }, []);

  if (error) {
    return (
      <View style={styles.panel}>
        <Text style={styles.titulo}>
          Persistencia local
        </Text>

        <Text style={styles.error}>
          {error}
        </Text>
      </View>
    );
  }

  if (!estado) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator />

        <Text>
          Inicializando almacenamiento local...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.panel}
      accessible
      accessibilityLabel="Estado de persistencia local"
    >
      <Text style={styles.titulo}>
        Persistencia local
      </Text>

      <Text style={styles.correcto}>
        SQLite activa
      </Text>

      <Text>
        Esquema: versión {estado.version}
      </Text>

      <Text>
        Registros locales: {estado.registros}
      </Text>

      <Text>
        Operaciones pendientes: {estado.pendientes}
      </Text>

      <Text>
        Origen:{" "}
        {estado.origen === "servidor"
          ? "API → SQLite"
          : "SQLite local"}
      </Text>

      <Text>
        Última sincronización:{" "}
        {estado.ultimaSincronizacion
          ? new Date(
              estado.ultimaSincronizacion
            ).toLocaleString()
          : "Sin sincronización"}
      </Text>
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
    gap: 8,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#172033",
  },

  correcto: {
    fontSize: 18,
    fontWeight: "700",
    color: "#086b46",
  },

  error: {
    color: "#9b1c1c",
  },
});
