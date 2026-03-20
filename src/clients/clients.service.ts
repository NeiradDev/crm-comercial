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
   * =========================================================
   * CAMPOS PERMITIDOS POR ROL
   * ---------------------------------------------------------
   * ADMIN: puede modificar todo
   * JEFE: puede modificar casi todo y reasignar vendedor
   * VENDEDOR: solo campos operativos limitados
   * =========================================================
   */
  private allowedFieldsByRole(role: UserRole): string[] | 'ALL' {
    if (role === UserRole.ADMIN) return 'ALL';

    if (role === UserRole.JEFE) {
      return [
        'nombres',
        'apellidos',
        'dni',
        'numeroCliente',
        'metodoPago',
        'metodoSeguimiento',
        'simulacion',
        'tipoCliente',
        'resolucion',
        'documentacionCompleta',
        'referencias',
        'verificacionIdentidad',
        'facturado',
        'despachado',
        'observaciones',
        'vendedorAsignadoId',
      ];
    }

    if (role === UserRole.VENDEDOR) {
      return [
        'metodoSeguimiento',
        'observaciones',
        'simulacion',
        'documentacionCompleta',
        'referencias',
      ];
    }

    return [];
  }

  /**
   * =========================================================
   * VALIDA QUE EL DTO NO TRAIGA CAMPOS PROHIBIDOS POR ROL
   * ---------------------------------------------------------
   * Antes el sistema los ignoraba silenciosamente.
   * Ahora los rechazamos con error claro.
   * =========================================================
   */
  private validateRoleAllowedFields(dto: Record<string, any>, role: UserRole): void {
    const allowed = this.allowedFieldsByRole(role);

    if (allowed === 'ALL') {
      return;
    }

    const invalidFields = Object.keys(dto).filter((key) => !allowed.includes(key));

    if (invalidFields.length > 0) {
      throw new ForbiddenException(
        `No puedes modificar estos campos: ${invalidFields.join(', ')}`,
      );
    }
  }

  /**
   * =========================================================
   * Obtiene usuario por id
   * =========================================================
   */
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

  /**
   * =========================================================
   * Obtiene vendedores gestionados por un jefe
   * =========================================================
   */
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

  /**
   * =========================================================
   * Verifica acceso a un cliente por rol
   * =========================================================
   */
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

  /**
   * =========================================================
   * Resuelve el vendedor asignado según rol
   * ---------------------------------------------------------
   * VENDEDOR: siempre queda autoasignado a sí mismo
   * JEFE: solo puede asignar a sus vendedores
   * ADMIN: puede asignar a cualquier vendedor
   * =========================================================
   */
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

  /**
   * =========================================================
   * CREATE
   * =========================================================
   */
  async create(dto: CreateClientDto, currentUser: CurrentUser) {
    const creador = await this.getUserOrFail(currentUser.userId);
    const vendedor = await this.resolveAssignedVendor(dto.vendedorAsignadoId, currentUser);

    const client = new Client();

    const { vendedorAsignadoId, ...data } = dto;
    Object.assign(client, data);

    client.creadoPor = creador;
    client.vendedorAsignado = vendedor;

    return this.clientRepository.save(client);
  }

  /**
   * =========================================================
   * READ ALL
   * =========================================================
   */
  async findAll(currentUser: CurrentUser) {
    if (currentUser.role === UserRole.ADMIN) {
      return this.clientRepository.find({
        relations: ['creadoPor', 'vendedorAsignado'],
      });
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      return this.clientRepository.find({
        where: [
          { creadoPor: { id: currentUser.userId } },
          { vendedorAsignado: { id: currentUser.userId } },
        ],
        relations: ['creadoPor', 'vendedorAsignado'],
      });
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      if (managedVendorIds.length === 0) {
        return this.clientRepository.find({
          where: [{ creadoPor: { id: currentUser.userId } }],
          relations: ['creadoPor', 'vendedorAsignado'],
        });
      }

      return this.clientRepository.find({
        where: [
          { creadoPor: { id: currentUser.userId } },
          { creadoPor: { id: In(managedVendorIds) as any } },
          { vendedorAsignado: { id: In(managedVendorIds) as any } },
        ],
        relations: ['creadoPor', 'vendedorAsignado'],
      });
    }

    return [];
  }

  /**
   * =========================================================
   * READ ONE
   * =========================================================
   */
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

    return client;
  }

  /**
   * =========================================================
   * UPDATE
   * ---------------------------------------------------------
   * Ahora ya no se ignoran silenciosamente campos prohibidos.
   * Si el rol manda uno no permitido, se rechaza.
   * =========================================================
   */
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

    this.validateRoleAllowedFields(dto, currentUser.role);

    const { vendedorAsignadoId, ...data } = dto as any;
    Object.assign(client, data);

    if (
      (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.JEFE) &&
      vendedorAsignadoId
    ) {
      client.vendedorAsignado = await this.resolveAssignedVendor(vendedorAsignadoId, currentUser);
    }

    return this.clientRepository.save(client);
  }

  /**
   * =========================================================
   * DELETE
   * =========================================================
   */
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