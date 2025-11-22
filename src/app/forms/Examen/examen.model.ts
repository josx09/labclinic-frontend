export interface Examen {
  id: number;
  idPersona: number;
  idTipoExamen: number;
  usarPrecioClinica?: boolean;
  resultado?: string;
  estado: number;
  resultados?: ExamenParametro[];
    idClinica?: number | null;
  fechaRegistro?: string;

}

export interface ExamenParametro {
  id: number;
  idExamen: number;
  idParametro: number;
  valor: string;
}

export interface TipoExamen {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

export interface PagedResponse<T> {
  total: number;
  items: T[];
}
