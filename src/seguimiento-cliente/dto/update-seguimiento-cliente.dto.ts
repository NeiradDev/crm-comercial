import { PartialType } from '@nestjs/mapped-types';
import { CreateSeguimientoClienteDto } from './create-seguimiento-cliente.dto';

export class UpdateSeguimientoClienteDto extends PartialType(CreateSeguimientoClienteDto) {}