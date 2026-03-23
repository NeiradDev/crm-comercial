import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { SeguimientoClienteService } from './seguimiento-cliente.service';
import { CreateSeguimientoClienteDto } from './dto/create-seguimiento-cliente.dto';
import { UpdateSeguimientoClienteDto } from './dto/update-seguimiento-cliente.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('seguimiento-cliente')
export class SeguimientoClienteController {
  constructor(
    private readonly seguimientoClienteService: SeguimientoClienteService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Post()
  create(@Body() dto: CreateSeguimientoClienteDto, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.seguimientoClienteService.create(dto, currentUser);
  }

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.seguimientoClienteService.findByClient(+clientId, currentUser);
  }

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.seguimientoClienteService.findOne(+id, currentUser);
  }

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSeguimientoClienteDto,
    @Req() req: any,
  ) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.seguimientoClienteService.update(+id, dto, currentUser);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.seguimientoClienteService.remove(+id, currentUser);
  }
}