import {
  Controller, Get, Post, Body, Patch, Param, Delete, Req,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * =========================================================
   * CREATE
   * ---------------------------------------------------------
   * ADMIN, JEFE, VENDEDOR y CARGADOR pueden crear clientes.
   * =========================================================
   */
  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR, UserRole.CARGADOR)
  @Post()
  create(@Body() dto: CreateClientDto, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.create(dto, currentUser);
  }

  /**
   * =========================================================
   * READ ALL
   * ---------------------------------------------------------
   * Cada rol verá solo lo que le corresponde.
   * =========================================================
   */
  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR, UserRole.CARGADOR)
  @Get()
  findAll(@Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.findAll(currentUser);
  }

  /**
   * =========================================================
   * DESTINOS ASIGNABLES
   * ---------------------------------------------------------
   * ADMIN    -> jefes y vendedores activos
   * JEFE     -> él mismo y sus vendedores activos
   * CARGADOR -> jefes activos
   * VENDEDOR -> no permitido
   * =========================================================
   */
  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.CARGADOR)
  @Get('assignable-targets')
  assignableTargets(@Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.getAssignableTargets(currentUser);
  }

  /**
   * =========================================================
   * READ ONE
   * =========================================================
   */
  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR, UserRole.CARGADOR)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.findOne(+id, currentUser);
  }

  /**
   * =========================================================
   * UPDATE
   * ---------------------------------------------------------
   * ADMIN, JEFE y VENDEDOR pueden editar según reglas.
   * CARGADOR no puede editar clientes ya asignados.
   * =========================================================
   */
  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.update(+id, dto, currentUser);
  }

  /**
   * =========================================================
   * DELETE LÓGICO
   * ---------------------------------------------------------
   * "Eliminar" cliente = ponerlo en lista negra.
   * Solo ADMIN.
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.remove(+id, currentUser);
  }
}