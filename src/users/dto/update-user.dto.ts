import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * =========================================================
   * Si mandan password en update, debe ser válida
   * =========================================================
   */
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password?: string;
}