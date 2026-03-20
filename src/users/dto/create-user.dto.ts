import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  /**
   * =========================================================
   * Email obligatorio
   * =========================================================
   */
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  /**
   * =========================================================
   * Password obligatorio
   * =========================================================
   */
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password: string;

  /**
   * =========================================================
   * Rol obligatorio
   * =========================================================
   */
  @IsEnum(UserRole, { message: 'El rol enviado no es válido' })
  role: UserRole;

  /**
   * =========================================================
   * jefeId opcional
   * =========================================================
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'jefeId debe ser un número entero' })
  jefeId?: number;
}