import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export const ORIGEN_OPTIONS = [
  'Facebook',
  'Cuotitas',
  'Contado',
  'Tarjeta de Crédito',
] as const;

export const METODO_PAGO_OPTIONS = [
  'Cuotitas',
  'Contado',
  'Tarjeta de Crédito',
] as const;

export const INSISTENCIA_OPTIONS = [
  'Llamada',
  'Mensaje',
  'Llamada/mensaje',
] as const;

export const TIPO_CLIENTE_OPTIONS = [
  'A',
  'B',
  'C CLA',
  'C1',
  'C2',
  'C3',
  'D',
  'D1',
  'E',
] as const;

export const RESOLUCION_OPTIONS = [
  'Sin E/Sin G',
  'Entrada Alta',
  'Entrada Media',
  'Entrada Mínima',
  'Garante',
  'Garante o Entrada',
  'Con G/Con E',
] as const;

export const DOCUMENTACION_OPTIONS = ['SI', 'NO'] as const;
export const REFERENCIAS_OPTIONS = ['COMPLETAS', 'FALTA'] as const;
export const VERIFICACION_IDENTIDAD_OPTIONS = ['COMPLETAS', 'FALTA'] as const;

export class CreateSeguimientoClienteDto {
  @Type(() => Number)
  @IsInt({ message: 'clientId debe ser un número entero' })
  clientId: number;

  @IsDateString({}, { message: 'fecha debe ser una fecha válida' })
  fecha: string;

  @IsOptional()
  @IsString({ message: 'numeroCliente debe ser texto' })
  @Length(1, 60, { message: 'numeroCliente debe tener entre 1 y 60 caracteres' })
  numeroCliente?: string;

  @IsString({ message: 'origen debe ser texto' })
  @IsIn(ORIGEN_OPTIONS, { message: 'origen no es válido' })
  origen: string;

  @IsString({ message: 'metodoPago debe ser texto' })
  @IsIn(METODO_PAGO_OPTIONS, { message: 'metodoPago no es válido' })
  metodoPago: string;

  @IsString({ message: 'insistencia debe ser texto' })
  @IsIn(INSISTENCIA_OPTIONS, { message: 'insistencia no es válida' })
  insistencia: string;

  @IsBoolean({ message: 'simulacion debe ser true o false' })
  simulacion: boolean;

  @IsString({ message: 'tipoCliente debe ser texto' })
  @IsIn(TIPO_CLIENTE_OPTIONS, { message: 'tipoCliente no es válido' })
  tipoCliente: string;

  @IsString({ message: 'resolucion debe ser texto' })
  @IsIn(RESOLUCION_OPTIONS, { message: 'resolucion no es válida' })
  resolucion: string;

  @IsString({ message: 'documentacion debe ser texto' })
  @IsIn(DOCUMENTACION_OPTIONS, { message: 'documentacion no es válida' })
  documentacion: string;

  @IsString({ message: 'referencias debe ser texto' })
  @IsIn(REFERENCIAS_OPTIONS, { message: 'referencias no es válida' })
  referencias: string;

  @IsString({ message: 'verificacionIdentidad debe ser texto' })
  @IsIn(VERIFICACION_IDENTIDAD_OPTIONS, {
    message: 'verificacionIdentidad no es válida',
  })
  verificacionIdentidad: string;

  @IsBoolean({ message: 'facturado debe ser true o false' })
  facturado: boolean;

  @IsBoolean({ message: 'despachado debe ser true o false' })
  despachado: boolean;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser texto' })
  observaciones?: string;
}