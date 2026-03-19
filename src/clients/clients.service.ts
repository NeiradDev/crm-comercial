import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ✅ CREATE
  async create(createClientDto: CreateClientDto) {
    const { creadoPor, vendedorAsignado, ...datos } = createClientDto;

    const usuarioCreador = await this.userRepository.findOneBy({ id: creadoPor });
    if (!usuarioCreador) {
      throw new NotFoundException('Usuario creador no existe');
    }

    const vendedor = await this.userRepository.findOneBy({
      id: vendedorAsignado,
    });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no existe');
    }

    const client = new Client();
    Object.assign(client, datos);

    client.creadoPor = usuarioCreador;
    client.vendedorAsignado = vendedor;

    return this.clientRepository.save(client);
  }

  findAll() {
    return this.clientRepository.find({
      relations: ['creadoPor', 'vendedorAsignado'],
    });
  }

  findOne(id: number) {
    return this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });
  }

  // ✅ UPDATE
  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const { creadoPor, vendedorAsignado, ...datos } = updateClientDto;

    Object.assign(client, datos);

    if (creadoPor) {
      const usuarioCreador = await this.userRepository.findOneBy({
        id: creadoPor,
      });
      if (!usuarioCreador) {
        throw new NotFoundException('Usuario creador no existe');
      }
      client.creadoPor = usuarioCreador;
    }

    if (vendedorAsignado) {
      const vendedor = await this.userRepository.findOneBy({
        id: vendedorAsignado,
      });
      if (!vendedor) {
        throw new NotFoundException('Vendedor no existe');
      }
      client.vendedorAsignado = vendedor;
    }

    return this.clientRepository.save(client);
  }

  async remove(id: number) {
    await this.clientRepository.delete(id);
    return { deleted: true };
  }
}