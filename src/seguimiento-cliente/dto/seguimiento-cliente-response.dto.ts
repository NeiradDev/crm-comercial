export class SeguimientoClienteResponseDto {
  id: number;
  fecha: string;
  numeroCliente?: string | null;

  origen: string;
  metodoPago: string;
  insistencia: string;
  simulacion: boolean;

  tipoCliente: string;
  resolucion: string;

  documentacion: string;
  referencias: string;
  verificacionIdentidad: string;

  facturado: boolean;
  despachado: boolean;

  observaciones?: string | null;

  client: {
    id: number;
    nombres: string;
    apellidos: string;
    dni: string;
  } | null;

  registradoPor: {
    id: number;
    email: string;
    role: string;
  } | null;

  createdAt: Date;
}