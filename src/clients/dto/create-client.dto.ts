export class CreateClientDto {
  nombres: string;
  apellidos: string;
  dni?: string;
  numeroCliente?: string;
  metodoPago?: string;
  metodoSeguimiento?: string;
  simulacion?: boolean;
  tipoCliente?: string;
  resolucion?: string;
  documentacionCompleta?: boolean;
  referencias?: string;
  verificacionIdentidad?: string;
  facturado?: boolean;
  despachado?: boolean;
  observaciones?: string;

  // relaciones (por ahora como id)
  creadoPor: number;
  vendedorAsignado: number;
}