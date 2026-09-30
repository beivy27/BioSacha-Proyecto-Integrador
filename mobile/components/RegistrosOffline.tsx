import { procesarOperacionesPendientes } from "../services/outboxService";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  leerRegistrosLocales,
  sincronizarRegistrosLocales,
} from "../services/cacheRegistros";

type RegistroLocal = {
  local_uuid: string;
  id_registro_servidor: number | null;
  nombre_local: string;
  nombre_cientifico: string;
  comunidad: string | null;
  estado_validacion: string;
  estado_sync: string;
  sincronizado_en: string | null;
};

export function RegistrosOffline() {
  const [registros, setRegistros] = useState<RegistroLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [origen, setOrigen] =
    useState<"servidor" | "local">("servidor");
  const [ultimaSync, setUltimaSync] =
    useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);

    try {
      // Primero enviamos la Outbox local al servidor.
      await procesarOperacionesPendientes();

      // Después reconciliamos PostgreSQL -> SQLite.
      const estado = await sincronizarRegistrosLocales();

      const locales = await leerRegistrosLocales();

      setRegistros(locales);
      setOrigen(estado.origen);
      setUltimaSync(estado.ultimaSincronizacion);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator />
        <Text>Comprobando datos locales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.titulo}>
        Disponibilidad sin conexión
      </Text>

      <Text
        style={
          origen === "local"
            ? styles.offline
            : styles.online
        }
      >
        {origen === "local"
          ? "Modo sin conexión — datos locales"
          : "Conectado — datos sincronizados"}
      </Text>

      <Text style={styles.aviso}>
        {origen === "local"
          ? "La API no está disponible. Se muestran datos almacenados previamente en SQLite."
          : "Los datos del servidor fueron guardados en SQLite para uso sin conexión."}
      </Text>

      <Text style={styles.fecha}>
        Última sincronización:{" "}
        {ultimaSync
          ? new Date(ultimaSync).toLocaleString()
          : "No disponible"}
      </Text>

      {origen === "local" && (
        <Text style={styles.antiguedad}>
          Aviso: estos datos pueden estar desactualizados.
        </Text>
      )}

      {registros.map((registro) => (
        <View
          key={registro.local_uuid}
          style={styles.tarjeta}
          accessible
          accessibilityLabel={`Registro local ${registro.nombre_local}`}
        >
          <Text style={styles.nombre}>
            {registro.nombre_local}
          </Text>

          <Text style={styles.cientifico}>
            {registro.nombre_cientifico}
          </Text>

          <Text>
            Comunidad: {registro.comunidad ?? "No registrada"}
          </Text>

          <Text>
            Estado: {registro.estado_validacion}
          </Text>

          <Text>
            Sincronización: {registro.estado_sync}
          </Text>
        </View>
      ))}

      <Pressable
        onPress={cargar}
        accessibilityRole="button"
        accessibilityLabel="Comprobar conexión y actualizar datos"
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>
          Comprobar conexión
        </Text>
      </Pressable>
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

  online: {
    fontSize: 18,
    fontWeight: "700",
    color: "#086b46",
  },

  offline: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9a5b00",
  },

  aviso: {
    fontSize: 16,
    color: "#4b5563",
  },

  fecha: {
    fontSize: 15,
    fontWeight: "600",
  },

  antiguedad: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9a5b00",
  },

  tarjeta: {
    borderWidth: 1,
    borderColor: "#667085",
    borderRadius: 12,
    padding: 16,
    gap: 5,
  },

  nombre: {
    fontSize: 20,
    fontWeight: "700",
  },

  cientifico: {
    fontSize: 17,
    fontStyle: "italic",
  },

  boton: {
    minHeight: 48,
    backgroundColor: "#086b46",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  botonTexto: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
