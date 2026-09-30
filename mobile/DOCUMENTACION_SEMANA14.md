# DOCUMENTACIÓN TÉCNICA — SEMANA 14

## BioSacha Mobile
### Incorporación de funcionalidades nativas al prototipo

## 1. Objetivo

La Semana 14 amplía el prototipo BioSacha desarrollado durante las semanas anteriores mediante la incorporación de capacidades nativas del dispositivo móvil.

Se implementaron dos capacidades pertinentes al registro botánico:

- Cámara.
- Ubicación.

La solución contempla solicitud contextual de permisos, degradación elegante, principio de mínimo privilegio, persistencia local e integración con el backend.

## 2. Selección y justificación

### Cámara

La cámara permite registrar evidencia visual de la especie vegetal observada. La fotografía es opcional, por lo que una denegación del permiso no impide continuar con el registro.

### Ubicación

La ubicación permite asociar el registro botánico con el lugar donde se realizó la observación mediante latitud, longitud y precisión. También es opcional.

## 3. Plugins verificados

- expo-camera
- expo-location
- expo-image-picker

El selector de fotografías del sistema evita solicitar acceso amplio e innecesario a toda la galería.

## 4. Solicitud de permisos

BioSacha no solicita permisos al iniciar la aplicación.

Los permisos se solicitan únicamente cuando el usuario ejecuta la función correspondiente:

Cámara:
Tomar fotografía → explicación → solicitud del permiso → captura.

Ubicación:
Obtener ubicación → explicación → solicitud del permiso → coordenadas.

## 5. Declaraciones de plataforma

### Android

- android.permission.CAMERA
- android.permission.ACCESS_COARSE_LOCATION
- android.permission.ACCESS_FINE_LOCATION

Se bloquean permisos innecesarios relacionados con almacenamiento, acceso amplio a galería y audio.

### iOS

Se configuraron cadenas de propósito específicas:

- NSCameraUsageDescription
- NSLocationWhenInUseUsageDescription

## 6. Degradación elegante

La aplicación maneja los estados:

- no solicitado;
- concedido;
- denegado;
- denegado permanentemente.

Ante una denegación permanente se informa al usuario, se proporciona acceso a los Ajustes del sistema y se permite continuar sin fotografía o sin ubicación.

## 7. Persistencia local

SQLite fue actualizado al esquema versión 2.

Se añadieron los campos opcionales:

- foto_uri
- latitud
- longitud
- precision_ubicacion

Los datos nativos se vinculan al mismo local_uuid del registro.

## 8. Integración con semanas anteriores

Flujo implementado:

Cámara / Ubicación
↓
Registro botánico
↓
SQLite
↓
Outbox
↓
API BioSacha
↓
PostgreSQL

Se mantienen idempotencia, reintentos, reconciliación y renovación automática del token.

## 9. Pruebas en dispositivo físico

Se ejecutaron cinco escenarios:

1. Inicio sin solicitud prematura de permisos.
2. Cámara con permiso concedido.
3. Ubicación con permiso concedido.
4. Denegación permanente con acceso a Ajustes y continuidad de la aplicación.
5. Persistencia y sincronización mediante SQLite, Outbox y backend.

La prueba final presentó:

- Operaciones pendientes: 0.
- Conectado — datos sincronizados.
- Sincronización: sincronizado.

## 10. Cumplimiento técnico

El proyecto utiliza Expo SDK 57 y fue verificado con:

npx tsc --noEmit

sin errores de TypeScript.

## 11. Conclusión

BioSacha incorpora correctamente cámara y ubicación como capacidades nativas integradas al flujo real de la aplicación. La implementación solicita únicamente los permisos necesarios, gestiona la denegación sin bloquear la funcionalidad principal y conserva la arquitectura de persistencia y sincronización desarrollada previamente.
