import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class ClientResponseDto {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  numeroCliente?: string;
  metodoPago?: string;
  metodoSeguimiento?: string;
  simulacion: boolean;
  tipoCliente?: string;
  resolucion?: string;
  documentacionCompleta: boolean;
  referencias?: string;
  verificacionIdentidad?: string;
  facturado: boolean;
  despachado: boolean;
  observaciones?: string;
  fechaCreacion: Date;
  creadoPor: UserSummaryDto | null;
  vendedorAsignado: UserSummaryDto | null;
  listaNegra?: boolean;
}