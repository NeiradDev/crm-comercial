import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * =========================================================
   * Correo válido
   * =========================================================
   */
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  /**
   * =========================================================
   * Contraseña mínima
   * =========================================================
   */
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password: string;
}