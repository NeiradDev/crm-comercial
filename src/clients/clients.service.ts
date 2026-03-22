import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Client } from './entities/client.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

type CurrentUser = { userId: number; role: UserRole };

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Campos que JEFE y VENDEDOR no pueden tocar
   */
  private readonly protectedFieldsForNonAdmin = [
    'id',
    'fechaCreacion',
    'creadoPor',
    'creadoPorId',
    'vendedorAsignado',
    'vendedorAsignadoId',
    'listaNegra',
  ];

  private sanitizeClientForRole(client: Client, role: UserRole) {
    const plain = {
      ...client,
      creadoPor: client.creadoPor
        ? {
            id: client.creadoPor.id,
            email: client.creadoPor.email,
            role: client.creadoPor.role,
          }
        : null,
      vendedorAsignado: client.vendedorAsignado
        ? {
            id: client.vendedorAsignado.id,
            email: client.vendedorAsignado.email,
            role: client.vendedorAsignado.role,
          }
        : null,
    };

    if (role !== UserRole.ADMIN) {
      delete (plain as any).listaNegra;
    }

    return plain;
  }

  private sanitizeClientsForRole(clients: Client[], role: UserRole) {
    return clients.map((client) => this.sanitizeClientForRole(client, role));
  }

  private validateProtectedFieldsForNonAdmin(dto: Record<string, any>, role: UserRole): void {
    if (role === UserRole.ADMIN) return;

    const invalidFields = Object.keys(dto).filter((key) =>
      this.protectedFieldsForNonAdmin.includes(key),
    );

    if (invalidFields.length > 0) {
      throw new ForbiddenException(
        `No puedes modificar estos campos: ${invalidFields.join(', ')}`,
      );
    }
  }

  private async getUserOrFail(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['jefe'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    return user;
  }

  private async getManagedVendorIds(jefeId: number): Promise<number[]> {
    const vendors = await this.userRepository.find({
      where: {
        jefe: { id: jefeId },
        role: UserRole.VENDEDOR,
      },
      relations: ['jefe'],
    });

    return vendors.map((vendor) => vendor.id);
  }

  private async canAccessClient(client: Client, currentUser: CurrentUser): Promise<boolean> {
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      return (
        client.creadoPor?.id === currentUser.userId ||
        client.vendedorAsignado?.id === currentUser.userId
      );
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      return (
        client.creadoPor?.id === currentUser.userId ||
        managedVendorIds.includes(client.vendedorAsignado?.id) ||
        managedVendorIds.includes(client.creadoPor?.id)
      );
    }

    return false;
  }

  private async resolveAssignedVendor(
    vendedorAsignadoId: number | undefined,
    currentUser: CurrentUser,
  ): Promise<User> {
    if (currentUser.role === UserRole.VENDEDOR) {
      return this.getUserOrFail(currentUser.userId);
    }

    if (!vendedorAsignadoId) {
      throw new BadRequestException('vendedorAsignadoId es requerido');
    }

    const vendedor = await this.getUserOrFail(vendedorAsignadoId);

    if (vendedor.role !== UserRole.VENDEDOR) {
      throw new BadRequestException('El usuario asignado debe tener rol VENDEDOR');
    }

    if (currentUser.role === UserRole.JEFE) {
      if (!vendedor.jefe || vendedor.jefe.id !== currentUser.userId) {
        throw new ForbiddenException('Solo puedes asignar clientes a tus vendedores');
      }
    }

    return vendedor;
  }

  async create(dto: CreateClientDto, currentUser: CurrentUser) {
    this.validateProtectedFieldsForNonAdmin(dto as any, currentUser.role);

    const creador = await this.getUserOrFail(currentUser.userId);
    const vendedor = await this.resolveAssignedVendor(dto.vendedorAsignadoId, currentUser);

    const client = new Client();

    const { vendedorAsignadoId, ...data } = dto as any;

    if (currentUser.role !== UserRole.ADMIN) {
      delete data.listaNegra;
    }

    Object.assign(client, data);

    client.creadoPor = creador;
    client.vendedorAsignado = vendedor;

    const saved = await this.clientRepository.save(client);

    const fullSaved = await this.clientRepository.findOne({
      where: { id: saved.id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Cliente no existe después de guardar');
    }

    return this.sanitizeClientForRole(fullSaved, currentUser.role);
  }

  async findAll(currentUser: CurrentUser) {
    let clients: Client[] = [];

    if (currentUser.role === UserRole.ADMIN) {
      clients = await this.clientRepository.find({
        relations: ['creadoPor', 'vendedorAsignado'],
      });
      return this.sanitizeClientsForRole(clients, currentUser.role);
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      clients = await this.clientRepository.find({
        where: [
          { creadoPor: { id: currentUser.userId } },
          { vendedorAsignado: { id: currentUser.userId } },
        ],
        relations: ['creadoPor', 'vendedorAsignado'],
      });
      return this.sanitizeClientsForRole(clients, currentUser.role);
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      if (managedVendorIds.length === 0) {
        clients = await this.clientRepository.find({
          where: [{ creadoPor: { id: currentUser.userId } }],
          relations: ['creadoPor', 'vendedorAsignado'],
        });
        return this.sanitizeClientsForRole(clients, currentUser.role);
      }

      clients = await this.clientRepository.find({
        where: [
          { creadoPor: { id: currentUser.userId } },
          { creadoPor: { id: In(managedVendorIds) as any } },
          { vendedorAsignado: { id: In(managedVendorIds) as any } },
        ],
        relations: ['creadoPor', 'vendedorAsignado'],
      });
      return this.sanitizeClientsForRole(clients, currentUser.role);
    }

    return [];
  }

  async findOne(id: number, currentUser: CurrentUser) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const allowed = await this.canAccessClient(client, currentUser);
    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para ver este cliente');
    }

    return this.sanitizeClientForRole(client, currentUser.role);
  }

  async update(id: number, dto: UpdateClientDto, currentUser: CurrentUser) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const allowed = await this.canAccessClient(client, currentUser);
    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para editar este cliente');
    }

    this.validateProtectedFieldsForNonAdmin(dto as any, currentUser.role);

    const { vendedorAsignadoId, ...data } = dto as any;

    if (currentUser.role !== UserRole.ADMIN) {
      delete data.listaNegra;
    }

    Object.assign(client, data);

    if (currentUser.role === UserRole.ADMIN && vendedorAsignadoId) {
      client.vendedorAsignado = await this.resolveAssignedVendor(vendedorAsignadoId, currentUser);
    }

    const saved = await this.clientRepository.save(client);

    const fullSaved = await this.clientRepository.findOne({
      where: { id: saved.id },
      relations: ['creadoPor', 'vendedorAsignado'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Cliente no existe después de actualizar');
    }

    return this.sanitizeClientForRole(fullSaved, currentUser.role);
  }

  async remove(id: number, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede borrar clientes');
    }

    const client = await this.clientRepository.findOneBy({ id });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    await this.clientRepository.delete(id);

    return { deleted: true };
  }
}