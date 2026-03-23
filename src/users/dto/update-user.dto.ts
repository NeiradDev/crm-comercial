import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  Length,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * =========================================================
   * Password opcional en update
   * =========================================================
   */
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password?: string;

  /**
   * =========================================================
   * Refuerzo de tipos
   * =========================================================
   */
  @IsOptional()
  @IsString({ message: 'nombre debe ser texto' })
  @MinLength(2, { message: 'nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'apellido debe ser texto' })
  @MinLength(2, { message: 'apellido debe tener al menos 2 caracteres' })
  apellido?: string;

  @IsOptional()
  @IsString({ message: 'cedula debe ser texto' })
  @Length(5, 20, { message: 'cedula debe tener entre 5 y 20 caracteres' })
  cedula?: string;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser true o false' })
  activo?: boolean;
}