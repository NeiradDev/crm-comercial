import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString({ message: 'nombres debe ser texto' })
  nombres: string;

  @IsString({ message: 'apellidos debe ser texto' })
  apellidos: string;

  @IsString({ message: 'dni debe ser texto' })
  @Length(5, 20, { message: 'dni debe tener entre 5 y 20 caracteres' })
  dni: string;

  @IsOptional()
  @IsString({ message: 'numeroCliente debe ser texto' })
  numeroCliente?: string;

  @IsOptional()
  @IsString({ message: 'metodoPago debe ser texto' })
  metodoPago?: string;

  @IsOptional()
  @IsString({ message: 'metodoSeguimiento debe ser texto' })
  metodoSeguimiento?: string;

  @IsOptional()
  @IsBoolean({ message: 'simulacion debe ser true o false' })
  simulacion?: boolean;

  @IsOptional()
  @IsString({ message: 'tipoCliente debe ser texto' })
  tipoCliente?: string;

  @IsOptional()
  @IsString({ message: 'resolucion debe ser texto' })
  resolucion?: string;

  @IsOptional()
  @IsBoolean({ message: 'documentacionCompleta debe ser true o false' })
  documentacionCompleta?: boolean;

  @IsOptional()
  @IsString({ message: 'referencias debe ser texto' })
  referencias?: string;

  @IsOptional()
  @IsString({ message: 'verificacionIdentidad debe ser texto' })
  verificacionIdentidad?: string;

  @IsOptional()
  @IsBoolean({ message: 'facturado debe ser true o false' })
  facturado?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'despachado debe ser true o false' })
  despachado?: boolean;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser texto' })
  observaciones?: string;

  /**
   * =========================================================
   * Usuario asignado
   * ---------------------------------------------------------
   * Puede ser JEFE o VENDEDOR según reglas del rol que crea.
   * =========================================================
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'asignadoAId debe ser un número entero' })
  asignadoAId?: number;

  /**
   * =========================================================
   * Solo ADMIN lo puede usar realmente.
   * =========================================================
   */
  @IsOptional()
  @IsBoolean({ message: 'listaNegra debe ser true o false' })
  listaNegra?: boolean;
}