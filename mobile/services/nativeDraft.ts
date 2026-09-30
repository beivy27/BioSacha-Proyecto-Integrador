export type MetadatosNativosRegistro = {
  foto_uri: string | null;
  latitud: number | null;
  longitud: number | null;
  precision_ubicacion: number | null;
};

let metadatos: MetadatosNativosRegistro = {
  foto_uri: null,
  latitud: null,
  longitud: null,
  precision_ubicacion: null,
};

export function actualizarFotoNativa(
  uri: string | null
): void {
  metadatos = {
    ...metadatos,
    foto_uri: uri,
  };
}

export function actualizarUbicacionNativa(
  latitud: number | null,
  longitud: number | null,
  precision: number | null
): void {
  metadatos = {
    ...metadatos,
    latitud,
    longitud,
    precision_ubicacion: precision,
  };
}

export function obtenerMetadatosNativos():
  MetadatosNativosRegistro {
  return { ...metadatos };
}
