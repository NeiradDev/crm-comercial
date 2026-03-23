import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  /**
   * =========================================================
   * Datos personales
   * =========================================================
   */
  @IsString({ message: 'nombre debe ser texto' })
  @MinLength(2, { message: 'nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @IsString({ message: 'apellido debe ser texto' })
  @MinLength(2, { message: 'apellido debe tener al menos 2 caracteres' })
  apellido: string;

  @IsString({ message: 'cedula debe ser texto' })
  @Length(5, 20, { message: 'cedula debe tener entre 5 y 20 caracteres' })
  cedula: string;

  /**
   * =========================================================
   * Acceso
   * =========================================================
   */
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password: string;

  /**
   * =========================================================
   * Rol
   * =========================================================
   */
  @IsEnum(UserRole, { message: 'El rol enviado no es válido' })
  role: UserRole;

  /**
   * =========================================================
   * Estado
   * ---------------------------------------------------------
   * Si no se manda, el backend usará true por defecto
   * desde la entidad.
   * =========================================================
   */
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser true o false' })
  activo?: boolean;

  /**
   * =========================================================
   * jefeId opcional
   * ---------------------------------------------------------
   * Aplica sobre todo para vendedores.
   * =========================================================
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'jefeId debe ser un número entero' })
  jefeId?: number;
}