import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { User } from '../users/entities/user.entity';
import { SeguimientoCliente } from '../seguimiento-cliente/entities/seguimiento-cliente.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Client, User, SeguimientoCliente])],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}