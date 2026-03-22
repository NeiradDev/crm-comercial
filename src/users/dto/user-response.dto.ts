import { UserSummaryDto } from './user-summary.dto';

export class UserResponseDto {
  id: number;
  email: string;
  role: string;
  jefe: UserSummaryDto | null;
  vendedores: UserSummaryDto[];
  createdAt: Date;
}