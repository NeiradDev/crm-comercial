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
import { ClientResponseDto } from './dto/client-response.dto';
import { UserSummaryDto } from '../users/dto/user-summary.dto';

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
   * Campos protegidos para no-admin en UPDATE
   * =========================================================
   */
  private readonly protectedFieldsForNonAdminUpdate = [
    'id',
    'fechaCreacion',
    'creadoPor',
    'creadoPorId',
    'listaNegra',
  ];

  /**
   * =========================================================
   * Mapper User -> UserSummaryDto
   * =========================================================
   */
  private mapUserSummary(user: User | null | undefined): UserSummaryDto | null {
    if (!user) return null;

    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      email: user.email,
      role: user.role,
      activo: user.activo,
    };
  }

  /**
   * =========================================================
   * Mapper Client -> ClientResponseDto
   * =========================================================
   */
  private mapClientResponse(client: Client, role: UserRole): ClientResponseDto {
    const dto: ClientResponseDto = {
      id: client.id,
      nombres: client.nombres,
      apellidos: client.apellidos,
      dni: client.dni,
      numeroCliente: client.numeroCliente ?? null,
      metodoPago: client.metodoPago ?? null,
      metodoSeguimiento: client.metodoSeguimiento ?? null,
      simulacion: client.simulacion,
      tipoCliente: client.tipoCliente ?? null,
      resolucion: client.resolucion ?? null,
      documentacionCompleta: client.documentacionCompleta,
      referencias: client.referencias ?? null,
      verificacionIdentidad: client.verificacionIdentidad ?? null,
      facturado: client.facturado,
      despachado: client.despachado,
      observaciones: client.observaciones ?? null,
      fechaCreacion: client.fechaCreacion,
      creadoPor: this.mapUserSummary(client.creadoPor),
      asignadoA: this.mapUserSummary(client.asignadoA),
    };

    if (role === UserRole.ADMIN) {
      dto.listaNegra = client.listaNegra;
    }

    return dto;
  }

  private mapClientsResponse(clients: Client[], role: UserRole): ClientResponseDto[] {
    return clients.map((client) => this.mapClientResponse(client, role));
  }

  /**
   * =========================================================
   * Obtener usuario activo por id
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

    if (!user.activo) {
      throw new BadRequestException('El usuario asignado está inactivo');
    }

    return user;
  }

  /**
   * =========================================================
   * Vendedores activos del jefe
   * =========================================================
   */
  private async getManagedVendors(jefeId: number): Promise<User[]> {
    return this.userRepository.find({
      where: {
        jefe: { id: jefeId },
        role: UserRole.VENDEDOR,
        activo: true,
      },
      relations: ['jefe'],
    });
  }

  private async getManagedVendorIds(jefeId: number): Promise<number[]> {
    const vendors = await this.getManagedVendors(jefeId);
    return vendors.map((vendor) => vendor.id);
  }

  /**
   * =========================================================
   * Destinos asignables según rol
   * ---------------------------------------------------------
   * ADMIN    -> jefes y vendedores activos
   * JEFE     -> él mismo y sus vendedores activos
   * CARGADOR -> jefes activos
   * =========================================================
   */
  async getAssignableTargets(currentUser: CurrentUser) {
    if (currentUser.role === UserRole.ADMIN) {
      const users = await this.userRepository.find({
        where: [
          { role: UserRole.JEFE, activo: true },
          { role: UserRole.VENDEDOR, activo: true },
        ],
      });

      return users.map((user) => this.mapUserSummary(user));
    }

    if (currentUser.role === UserRole.JEFE) {
      const self = await this.userRepository.findOneBy({ id: currentUser.userId });
      const vendors = await this.getManagedVendors(currentUser.userId);

      const result: UserSummaryDto[] = [];

      if (self && self.activo) {
        const selfSummary = this.mapUserSummary(self);
        if (selfSummary) {
          result.push(selfSummary);
        }
      }

      vendors.forEach((vendor) => {
        const vendorSummary = this.mapUserSummary(vendor);
        if (vendorSummary) {
          result.push(vendorSummary);
        }
      });

      return result;
    }

    if (currentUser.role === UserRole.CARGADOR) {
      const jefes = await this.userRepository.find({
        where: { role: UserRole.JEFE, activo: true },
      });

      return jefes.map((user) => this.mapUserSummary(user));
    }

    throw new ForbiddenException('No tienes permisos para consultar destinos asignables');
  }

  /**
   * =========================================================
   * Visibilidad de cliente por rol
   * =========================================================
   */
  private async canAccessClient(client: Client, currentUser: CurrentUser): Promise<boolean> {
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      return client.asignadoA?.id === currentUser.userId;
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      return (
        client.asignadoA?.id === currentUser.userId ||
        managedVendorIds.includes(client.asignadoA?.id)
      );
    }

    if (currentUser.role === UserRole.CARGADOR) {
      return client.creadoPor?.id === currentUser.userId;
    }

    return false;
  }

  /**
   * =========================================================
   * Resolver destino de asignación
   * ---------------------------------------------------------
   * ADMIN    -> JEFE o VENDEDOR
   * JEFE     -> sí mismo o sus vendedores
   * VENDEDOR -> sí mismo
   * CARGADOR -> solo JEFE
   * =========================================================
   */
  private async resolveAssignedTarget(
    asignadoAId: number | undefined,
    currentUser: CurrentUser,
  ): Promise<User> {
    if (currentUser.role === UserRole.VENDEDOR) {
      return this.getUserOrFail(currentUser.userId);
    }

    if (!asignadoAId) {
      throw new BadRequestException('asignadoAId es requerido');
    }

    const target = await this.getUserOrFail(asignadoAId);

    if (currentUser.role === UserRole.ADMIN) {
      if (![UserRole.JEFE, UserRole.VENDEDOR].includes(target.role)) {
        throw new BadRequestException('Solo se puede asignar a JEFE o VENDEDOR');
      }

      return target;
    }

    if (currentUser.role === UserRole.JEFE) {
      if (target.id === currentUser.userId && target.role === UserRole.JEFE) {
        return target;
      }

      if (target.role === UserRole.VENDEDOR && target.jefe?.id === currentUser.userId) {
        return target;
      }

      throw new ForbiddenException('Solo puedes asignar clientes a ti o a tus vendedores');
    }

    if (currentUser.role === UserRole.CARGADOR) {
      if (target.role !== UserRole.JEFE) {
        throw new ForbiddenException('CARGADOR solo puede asignar clientes a jefes');
      }

      return target;
    }

    throw new ForbiddenException('No tienes permisos para asignar clientes');
  }

  /**
   * =========================================================
   * Campos protegidos para no-admin en UPDATE
   * =========================================================
   */
  private validateProtectedFieldsForNonAdminUpdate(dto: Record<string, any>, role: UserRole): void {
    if (role === UserRole.ADMIN) return;

    const invalidFields = Object.keys(dto).filter((key) =>
      this.protectedFieldsForNonAdminUpdate.includes(key),
    );

    if (invalidFields.length > 0) {
      throw new ForbiddenException(
        `No puedes modificar estos campos: ${invalidFields.join(', ')}`,
      );
    }
  }

  /**
   * =========================================================
   * CREATE
   * =========================================================
   */
  async create(dto: CreateClientDto, currentUser: CurrentUser): Promise<ClientResponseDto> {
    /**
     * Solo ADMIN puede tocar lista negra
     */
    if (currentUser.role !== UserRole.ADMIN && typeof dto.listaNegra !== 'undefined') {
      throw new ForbiddenException('No puedes gestionar lista negra');
    }

    const creador = await this.getUserOrFail(currentUser.userId);
    const asignadoA = await this.resolveAssignedTarget(dto.asignadoAId, currentUser);

    const client = new Client();

    const { asignadoAId, ...data } = dto as any;

    if (currentUser.role !== UserRole.ADMIN) {
      delete data.listaNegra;
    }

    Object.assign(client, data);

    client.creadoPor = creador;
    client.asignadoA = asignadoA;

    const saved = await this.clientRepository.save(client);

    const fullSaved = await this.clientRepository.findOne({
      where: { id: saved.id },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Cliente no existe después de guardar');
    }

    return this.mapClientResponse(fullSaved, currentUser.role);
  }

  /**
   * =========================================================
   * READ ALL
   * =========================================================
   */
  async findAll(currentUser: CurrentUser): Promise<ClientResponseDto[]> {
    let clients: Client[] = [];

    if (currentUser.role === UserRole.ADMIN) {
      clients = await this.clientRepository.find({
        relations: ['creadoPor', 'asignadoA'],
      });

      return this.mapClientsResponse(clients, currentUser.role);
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      clients = await this.clientRepository.find({
        where: [{ asignadoA: { id: currentUser.userId } }],
        relations: ['creadoPor', 'asignadoA'],
      });

      return this.mapClientsResponse(clients, currentUser.role);
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      if (managedVendorIds.length === 0) {
        clients = await this.clientRepository.find({
          where: [{ asignadoA: { id: currentUser.userId } }],
          relations: ['creadoPor', 'asignadoA'],
        });

        return this.mapClientsResponse(clients, currentUser.role);
      }

      clients = await this.clientRepository.find({
        where: [
          { asignadoA: { id: currentUser.userId } },
          { asignadoA: { id: In(managedVendorIds) as any } },
        ],
        relations: ['creadoPor', 'asignadoA'],
      });

      return this.mapClientsResponse(clients, currentUser.role);
    }

    if (currentUser.role === UserRole.CARGADOR) {
      clients = await this.clientRepository.find({
        where: [{ creadoPor: { id: currentUser.userId } }],
        relations: ['creadoPor', 'asignadoA'],
      });

      return this.mapClientsResponse(clients, currentUser.role);
    }

    return [];
  }

  /**
   * =========================================================
   * READ ONE
   * =========================================================
   */
  async findOne(id: number, currentUser: CurrentUser): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const allowed = await this.canAccessClient(client, currentUser);
    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para ver este cliente');
    }

    return this.mapClientResponse(client, currentUser.role);
  }

  /**
   * =========================================================
   * UPDATE
   * =========================================================
   */
  async update(
    id: number,
    dto: UpdateClientDto,
    currentUser: CurrentUser,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const allowed = await this.canAccessClient(client, currentUser);
    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para editar este cliente');
    }

    /**
     * CARGADOR no edita clientes asignados
     */
    if (currentUser.role === UserRole.CARGADOR) {
      throw new ForbiddenException('CARGADOR no puede editar clientes asignados');
    }

    this.validateProtectedFieldsForNonAdminUpdate(dto as any, currentUser.role);

    const { asignadoAId, ...data } = dto as any;

    if (currentUser.role !== UserRole.ADMIN) {
      delete data.listaNegra;
    }

    Object.assign(client, data);

    /**
     * ADMIN -> reasigna libremente
     * JEFE  -> reasigna a sí mismo o a sus vendedores
     * VENDEDOR -> no reasigna
     */
    if (typeof asignadoAId !== 'undefined') {
      if (currentUser.role === UserRole.VENDEDOR) {
        throw new ForbiddenException('No puedes reasignar clientes');
      }

      client.asignadoA = await this.resolveAssignedTarget(asignadoAId, currentUser);
    }

    const saved = await this.clientRepository.save(client);

    const fullSaved = await this.clientRepository.findOne({
      where: { id: saved.id },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Cliente no existe después de actualizar');
    }

    return this.mapClientResponse(fullSaved, currentUser.role);
  }

  /**
   * =========================================================
   * DELETE LÓGICO
   * ---------------------------------------------------------
   * "Eliminar" = poner en lista negra
   * =========================================================
   */
  async remove(id: number, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede gestionar lista negra');
    }

    const client = await this.clientRepository.findOneBy({ id });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    client.listaNegra = true;
    await this.clientRepository.save(client);

    return {
      blacklisted: true,
      id: client.id,
    };
  }
}