import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class ClientResponseDto {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  numeroCliente?: string | null;
  metodoPago?: string | null;
  metodoSeguimiento?: string | null;
  simulacion: boolean;
  tipoCliente?: string | null;
  resolucion?: string | null;
  documentacionCompleta: boolean;
  referencias?: string | null;
  verificacionIdentidad?: string | null;
  facturado: boolean;
  despachado: boolean;
  observaciones?: string | null;
  fechaCreacion: Date;
  creadoPor: UserSummaryDto | null;
  asignadoA: UserSummaryDto | null;

  /**
   * =========================================================
   * NUEVO CAMPO
   * ---------------------------------------------------------
   * Días transcurridos desde la última gestión registrada
   * del cliente.
   * Si no tiene gestiones, irá null.
   * =========================================================
   */
  diasDesdeUltimaGestion?: number | null;

  /**
   * Solo ADMIN lo ve.
   */
  listaNegra?: boolean;
}