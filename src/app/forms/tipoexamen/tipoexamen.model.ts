// ===============================
//  Modelo: TipoExamen
// ===============================
export interface TipoExamen {
  id: number;
  nombre: string;
  descripcion?: string;
  precio?: number;

  //  Relación con Categoría
  idCategoriaTipoExamen?: number | null;
  categoria?: CategoriaTipoExamen | null;

  //  Parámetros asociados
  parametros?: Parametro[];
  parametrosTipo?: ParametroTipoExamen[];

  //  Perfiles en los que aparece
  perfiles?: PerfilExamen[];
}

// ===============================
//  Modelo: Categoría de Tipo de Examen
// ===============================
export interface CategoriaTipoExamen {
  id: number;
  nombre: string;
  descripcion?: string;
  tiposExamen?: TipoExamen[];
}

// ===============================
//  Modelo: Parámetro Base (ya existía)
// ===============================
export interface Parametro {
  id: number;
  idTipoExamen: number;
  nombre: string;
  unidad: string;
  valorReferencia: string;
}

// ===============================
//  Modelo: Parámetro de Plantilla
// ===============================
export interface ParametroTipoExamen {
  id: number;
  idTipoExamen: number;
  nombre: string;
  unidad?: string;
  rangoReferencia?: string;
}

// ===============================
//  Modelo: Perfil de Examen
// ===============================
export interface PerfilExamen {
  id: number;
  nombre: string;
  descripcion?: string;
  parametros?: PerfilParametro[];
}

// ===============================
//  Modelo: Perfil-Parametro
// ===============================
export interface PerfilParametro {
  id: number;
  idPerfilExamen: number;
  idTipoExamen: number;
  tipoExamen?: TipoExamen;
}
