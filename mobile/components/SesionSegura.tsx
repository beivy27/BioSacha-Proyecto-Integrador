import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BotonPrimario } from "./BotonPrimario";
import {
  cerrarSesion,
  iniciarSesion,
  restaurarSesion,
  UsuarioSesion,
} from "../services/authService";
import { theme } from "../theme";

export default function SesionSegura() {
  const [correo, setCorreo] = useState("comunitario@biosacha.local");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  const [comprobando, setComprobando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(
    "Comprobando sesión almacenada..."
  );

  useEffect(() => {
    async function cargarSesion() {
      try {
        const sesion = await restaurarSesion();

        if (sesion) {
          setUsuario(sesion);
          setMensaje(
            "Sesión restaurada desde almacenamiento cifrado."
          );
        } else {
          setMensaje("No existe una sesión almacenada.");
        }
      } catch {
        setMensaje(
          "No fue posible verificar la sesión almacenada."
        );
      } finally {
        setComprobando(false);
      }
    }

    cargarSesion();
  }, []);

  async function manejarLogin() {
    if (!correo.trim() || !password) {
      setMensaje("Ingrese correo y contraseña.");
      return;
    }

    try {
      setProcesando(true);
      setMensaje("Validando credenciales...");

      const sesion = await iniciarSesion(
        correo.trim(),
        password
      );

      setUsuario(sesion);

      // La contraseña desaparece de memoria visual
      // inmediatamente después del login.
      setPassword("");

      setMensaje(
        "Sesión iniciada. Tokens protegidos con SecureStore."
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function manejarCerrarSesion() {
    try {
      setProcesando(true);

      await cerrarSesion();

      setUsuario(null);
      setPassword("");

      setMensaje(
        "Sesión cerrada. Tokens eliminados de SecureStore."
      );
    } finally {
      setProcesando(false);
    }
  }

  if (comprobando) {
    return (
      <View
        style={styles.panel}
        accessible
        accessibilityLabel="Comprobando sesión segura"
      >
        <ActivityIndicator size="small" />
        <Text style={styles.estado}>
          Comprobando sesión segura...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.titulo}>
        Sesión segura
      </Text>

      {usuario ? (
        <>
          <Text style={styles.estadoCorrecto}>
            Sesión autenticada
          </Text>

          <Text style={styles.texto}>
            Usuario: {usuario.nombre}
          </Text>

          <Text style={styles.texto}>
            Rol: {usuario.rol}
          </Text>

          <Text style={styles.texto}>
            Credenciales: almacenamiento cifrado
          </Text>

          <Text style={styles.mensaje}>
            {mensaje}
          </Text>

          <BotonPrimario
            texto="Cerrar sesión"
            onPress={manejarCerrarSesion}
            cargando={procesando}
            accessibilityLabel="Cerrar sesión segura"
          />
        </>
      ) : (
        <>
          <Text style={styles.etiqueta}>
            Correo
          </Text>

          <TextInput
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Correo electrónico"
            style={styles.campo}
          />

          <Text style={styles.etiqueta}>
            Contraseña
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Contraseña"
            style={styles.campo}
          />

          <Text style={styles.mensaje}>
            {mensaje}
          </Text>

          <BotonPrimario
            texto="Iniciar sesión"
            onPress={manejarLogin}
            cargando={procesando}
            accessibilityLabel="Iniciar sesión segura"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },

  titulo: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },

  etiqueta: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },

  campo: {
    minHeight: theme.sizes.touchTarget,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
  },

  texto: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },

  mensaje: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },

  estado: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },

  estadoCorrecto: {
    ...theme.typography.body,
    color: theme.colors.actionPrimary,
    fontWeight: "700",
  },
});
