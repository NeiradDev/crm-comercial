import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoClienteService } from './seguimiento-cliente.service';
import { SeguimientoClienteController } from './seguimiento-cliente.controller';
import { SeguimientoCliente } from './entities/seguimiento-cliente.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeguimientoCliente, Client, User])],
  controllers: [SeguimientoClienteController],
  providers: [SeguimientoClienteService],
})
export class SeguimientoClienteModule {}