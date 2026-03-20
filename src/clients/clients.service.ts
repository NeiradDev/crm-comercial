import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UserRole } from '../users/entities/user.entity';

type CurrentUser = { userId: number; role: UserRole };

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ---------- Helpers de política ----------
  private allowedFieldsByRole(role: UserRole): string[] | 'ALL' {
    if (role === UserRole.ADMIN) return 'ALL';

    // JEFE: puede reasignar vendedor y tocar datos/estados de cliente
    if (role === UserRole.JEFE) {
      return [
        // personales
        'nombres', 'apellidos', 'dni', 'numeroCliente',
        // comerciales
        'metodoPago', 'metodoSeguimiento', 'simulacion', 'tipoCliente', 'resolucion',
        // estados
        'documentacionCompleta', 'referencias', 'verificacionIdentidad', 'facturado', 'despachado',
        // notas
        'observaciones',
        // relaciones permitidas para JEFE
        'vendedorAsignado',
      ];
    }

    // VENDEDOR: no puede reasignar vendedor; puede actualizar seguimiento/observaciones/estados básicos
    if (role === UserRole.VENDEDOR) {
      return [
        'metodoSeguimiento', 'observaciones', 'simulacion',
        'documentacionCompleta', 'referencias',
      ];
    }

    return [];
  }

  private filterDtoByRole<T extends Record<string, any>>(dto: T, role: UserRole): Partial<T> {
    const allowed = this.allowedFieldsByRole(role);
    if (allowed === 'ALL') return dto;

    const filtered: Partial<T> = {};
    Object.keys(dto).forEach((k) => {
      if (allowed.includes(k)) {
        (filtered as any)[k] = (dto as any)[k];
      }
    });
    return filtered;
  }

  // ---------- CREATE ----------
  async create(dto: CreateClientDto, currentUser: CurrentUser) {
    const { role, userId } = currentUser;

    // Completar creadoPor si no se envía
    if (!dto.creadoPor) {
      dto.creadoPor = userId;
    }

    // Si no envían vendedorAsignado:
    if (!dto.vendedorAsignado) {
      if (role === UserRole.VENDEDOR) {
        // vendedor puede auto-asignarse
        dto.vendedorAsignado = userId;
      } else if (role === UserRole.JEFE) {
        // jefe debe asignar explícitamente a un vendedor
        throw new BadRequestException('vendedorAsignado es requerido para JEFE');
      } else if (role === UserRole.ADMIN) {
        // Admin: puedes decidir forzar o permitir vacío; aquí forzamos requerirlo para consistencia
        throw new BadRequestException('vendedorAsignado es requerido para ADMIN');
      }
    }

    // Cargar entidades
    const usuarioCreador = await this.userRepository.findOneBy({ id: dto.creadoPor });
    if (!usuarioCreador) {
      throw new NotFoundException('Usuario creador no existe');
    }

    const vendedor = await this.userRepository.findOneBy({ id: dto.vendedorAsignado });
    if (!vendedor) {
      throw new NotFoundException('Vendedor asignado no existe');
    }

    const client = new Client();
    // Asignar campos del dto que NO son relaciones
    const {
      creadoPor, vendedorAsignado, ...datos
    } = dto as any;

    Object.assign(client, datos);
    client.creadoPor = usuarioCreador;
    client.vendedorAsignado = vendedor;

    return this.clientRepository.save(client);
  }

  // ---------- READ ----------
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

  // ---------- UPDATE ----------
  async update(id: number, dto: UpdateClientDto, currentUser: CurrentUser) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });
    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const { role } = currentUser;

    // Filtrar campos según rol
    const sanitized = this.filterDtoByRole(dto, role);

    // Primero, asignar campos simples
    const {
      creadoPor, vendedorAsignado, ...datos
    } = sanitized as any;

    Object.assign(client, datos);

    // Relaciones (según rol)
    if (role === UserRole.ADMIN && dto.creadoPor) {
      const usuarioCreador = await this.userRepository.findOneBy({ id: dto.creadoPor });
      if (!usuarioCreador) throw new NotFoundException('Usuario creador no existe');
      client.creadoPor = usuarioCreador;
    }

    if (role === UserRole.ADMIN || role === UserRole.JEFE) {
      if (dto.vendedorAsignado) {
        const vendedor = await this.userRepository.findOneBy({ id: dto.vendedorAsignado });
        if (!vendedor) throw new NotFoundException('Vendedor asignado no existe');
        client.vendedorAsignado = vendedor;
      }
    }
    // Nota: VENDEDOR no puede tocar vendedorAsignado (no está en whitelist)

    return this.clientRepository.save(client);
  }

  // ---------- DELETE ----------
  async remove(id: number, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede borrar clientes');
    }
    await this.clientRepository.delete(id);
    return { deleted: true };
  }
}