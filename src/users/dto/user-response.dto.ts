import { UserSummaryDto } from './user-summary.dto';

export class UserResponseDto {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  role: string;
  activo: boolean;
  jefe: UserSummaryDto | null;
  vendedores: UserSummaryDto[];
  createdAt: Date;
}