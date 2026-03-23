import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SeguimientoCliente } from './entities/seguimiento-cliente.entity';
import { CreateSeguimientoClienteDto } from './dto/create-seguimiento-cliente.dto';
import { UpdateSeguimientoClienteDto } from './dto/update-seguimiento-cliente.dto';
import { SeguimientoClienteResponseDto } from './dto/seguimiento-cliente-response.dto';
import { Client } from '../clients/entities/client.entity';
import { User, UserRole } from '../users/entities/user.entity';

type CurrentUser = {
  userId: number;
  role: UserRole;
};

@Injectable()
export class SeguimientoClienteService {
  constructor(
    @InjectRepository(SeguimientoCliente)
    private readonly seguimientoRepository: Repository<SeguimientoCliente>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private mapResponse(item: SeguimientoCliente): SeguimientoClienteResponseDto {
    return {
      id: item.id,
      fecha: item.fecha,
      numeroCliente: item.numeroCliente ?? null,
      origen: item.origen,
      metodoPago: item.metodoPago,
      insistencia: item.insistencia,
      simulacion: item.simulacion,
      tipoCliente: item.tipoCliente,
      resolucion: item.resolucion,
      documentacion: item.documentacion,
      referencias: item.referencias,
      verificacionIdentidad: item.verificacionIdentidad,
      facturado: item.facturado,
      despachado: item.despachado,
      observaciones: item.observaciones ?? null,
      client: item.client
        ? {
            id: item.client.id,
            nombres: item.client.nombres,
            apellidos: item.client.apellidos,
            dni: item.client.dni,
          }
        : null,
      registradoPor: item.registradoPor
        ? {
            id: item.registradoPor.id,
            email: item.registradoPor.email,
            role: item.registradoPor.role,
          }
        : null,
      createdAt: item.createdAt,
    };
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
        client.asignadoA?.id === currentUser.userId
      );
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      return (
        client.creadoPor?.id === currentUser.userId ||
        managedVendorIds.includes(client.creadoPor?.id) ||
        managedVendorIds.includes(client.asignadoA?.id)
      );
    }

    return false;
  }

  private async canModifyFollowUp(
    followUp: SeguimientoCliente,
    currentUser: CurrentUser,
  ): Promise<boolean> {
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    if (currentUser.role === UserRole.JEFE) {
      const managedVendorIds = await this.getManagedVendorIds(currentUser.userId);

      return (
        followUp.registradoPor?.id === currentUser.userId ||
        managedVendorIds.includes(followUp.registradoPor?.id)
      );
    }

    if (currentUser.role === UserRole.VENDEDOR) {
      return followUp.registradoPor?.id === currentUser.userId;
    }

    return false;
  }

  async create(
    dto: CreateSeguimientoClienteDto,
    currentUser: CurrentUser,
  ): Promise<SeguimientoClienteResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id: dto.clientId },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const canAccess = await this.canAccessClient(client, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('No puedes registrar seguimiento para este cliente');
    }

    const user = await this.userRepository.findOneBy({ id: currentUser.userId });
    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    const followUp = new SeguimientoCliente();
    followUp.client = client;
    followUp.registradoPor = user;
    followUp.fecha = dto.fecha;
    followUp.numeroCliente = dto.numeroCliente;
    followUp.origen = dto.origen;
    followUp.metodoPago = dto.metodoPago;
    followUp.insistencia = dto.insistencia;
    followUp.simulacion = dto.simulacion;
    followUp.tipoCliente = dto.tipoCliente;
    followUp.resolucion = dto.resolucion;
    followUp.documentacion = dto.documentacion;
    followUp.referencias = dto.referencias;
    followUp.verificacionIdentidad = dto.verificacionIdentidad;
    followUp.facturado = dto.facturado;
    followUp.despachado = dto.despachado;
    followUp.observaciones = dto.observaciones;

    const saved = await this.seguimientoRepository.save(followUp);

    const fullSaved = await this.seguimientoRepository.findOne({
      where: { id: saved.id },
      relations: ['client', 'registradoPor'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Seguimiento no existe después de guardar');
    }

    return this.mapResponse(fullSaved);
  }

  async findByClient(
    clientId: number,
    currentUser: CurrentUser,
  ): Promise<SeguimientoClienteResponseDto[]> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['creadoPor', 'asignadoA'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no existe');
    }

    const canAccess = await this.canAccessClient(client, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('No puedes ver seguimientos de este cliente');
    }

    const items = await this.seguimientoRepository.find({
      where: { client: { id: clientId } },
      relations: ['client', 'registradoPor'],
      order: { createdAt: 'DESC' },
    });

    return items.map((item) => this.mapResponse(item));
  }

  async findOne(
    id: number,
    currentUser: CurrentUser,
  ): Promise<SeguimientoClienteResponseDto> {
    const item = await this.seguimientoRepository.findOne({
      where: { id },
      relations: ['client', 'registradoPor', 'client.creadoPor', 'client.asignadoA'],
    });

    if (!item) {
      throw new NotFoundException('Seguimiento no existe');
    }

    const canAccess = await this.canAccessClient(item.client, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('No puedes ver este seguimiento');
    }

    return this.mapResponse(item);
  }

  async update(
    id: number,
    dto: UpdateSeguimientoClienteDto,
    currentUser: CurrentUser,
  ): Promise<SeguimientoClienteResponseDto> {
    const item = await this.seguimientoRepository.findOne({
      where: { id },
      relations: ['client', 'registradoPor', 'client.creadoPor', 'client.asignadoA'],
    });

    if (!item) {
      throw new NotFoundException('Seguimiento no existe');
    }

    const canModify = await this.canModifyFollowUp(item, currentUser);
    if (!canModify) {
      throw new ForbiddenException('No puedes editar este seguimiento');
    }

    // No permitimos mover el seguimiento a otro cliente en update
    const { clientId, ...data } = dto as any;
    Object.assign(item, data);

    const saved = await this.seguimientoRepository.save(item);

    const fullSaved = await this.seguimientoRepository.findOne({
      where: { id: saved.id },
      relations: ['client', 'registradoPor'],
    });

    if (!fullSaved) {
      throw new NotFoundException('Seguimiento no existe después de actualizar');
    }

    return this.mapResponse(fullSaved);
  }

  async remove(id: number, currentUser: CurrentUser) {
    const item = await this.seguimientoRepository.findOne({
      where: { id },
      relations: ['registradoPor'],
    });

    if (!item) {
      throw new NotFoundException('Seguimiento no existe');
    }

    // más conservador: solo ADMIN borra
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede borrar seguimientos');
    }

    await this.seguimientoRepository.delete(id);

    return { deleted: true };
  }
}