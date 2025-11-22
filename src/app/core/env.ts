// src/app/core/env.ts
import { BehaviorSubject } from 'rxjs';

export const environment = {
  apiUrl: 'https://labclinic-api-cvbpd3hkcwagdmcc.centralus-01.azurewebsites.net/api'

};

//  Estado global de sucursal seleccionada
export const env = {
  // Valor inicial desde localStorage (default = 1)
  sucursalId: new BehaviorSubject<number>(
    Number(localStorage.getItem('id_sucursal') || 1)
  ),

  // Observable que pueden escuchar componentes/listas para refrescar
  sucursalChanged: new BehaviorSubject<number>(
    Number(localStorage.getItem('id_sucursal') || 1)
  ),

  // Cambiar sucursal en toda la app
  setSucursal(id: number) {
    localStorage.setItem('id_sucursal', id.toString());
    this.sucursalId.next(id);
    this.sucursalChanged.next(id);
  }
};
