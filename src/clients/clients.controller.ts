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

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Post()
  create(@Body() dto: CreateClientDto, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.create(dto, currentUser);
  }

  @Get()
  findAll(@Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.findOne(+id, currentUser);
  }

  @Roles(UserRole.ADMIN, UserRole.JEFE, UserRole.VENDEDOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.update(+id, dto, currentUser);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.clientsService.remove(+id, currentUser);
  }
}