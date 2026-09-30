# BioSacha Mobile — Semana 14

## Taller Práctico Semana 14
### Incorporación de funcionalidades nativas al prototipo BioSacha

Este repositorio corresponde a la entrega de la Semana 14 de la asignatura Aplicaciones Móviles.

## Capacidades implementadas

- Cámara nativa
- Ubicación
- Selección de fotografía mediante el selector del sistema
- Solicitud contextual de permisos
- Degradación elegante
- Acceso a Ajustes ante denegación permanente

## Integración

Las capacidades nativas se integran con la arquitectura desarrollada previamente:

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

## Persistencia local

SQLite utiliza el esquema versión 2 e incorpora:

- foto_uri
- latitud
- longitud
- precision_ubicacion

## Permisos

Android:
- android.permission.CAMERA
- android.permission.ACCESS_COARSE_LOCATION
- android.permission.ACCESS_FINE_LOCATION

iOS:
- NSCameraUsageDescription
- NSLocationWhenInUseUsageDescription

## Plugins

- expo-camera
- expo-location
- expo-image-picker

## Pruebas en dispositivo físico

Se verificaron cinco escenarios:

1. Inicio sin solicitud prematura de permisos.
2. Cámara con permiso concedido.
3. Ubicación con permiso concedido.
4. Denegación permanente y acceso a Ajustes.
5. Integración con SQLite, Outbox y backend.

La prueba final mostró:

- Operaciones pendientes: 0
- Conectado — datos sincronizados
- Sincronización: sincronizado

## Documentación

- DOCUMENTACION_SEMANA14.md
- docs/MATRIZ_PRUEBAS_SEMANA14.md
- docs/GUION_VIDEO_SEMANA14.md
- docs/EVIDENCIA_TECNICA_SEMANA14.txt

## Identificación de la entrega

Proyecto: BioSacha Mobile
Semana: 14
Repositorio: BioSacha-Mobile-Semana14
