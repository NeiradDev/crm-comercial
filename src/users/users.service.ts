import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * =========================================================
   * Mapper resumido
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
   * Mapper completo
   * =========================================================
   */
  private mapUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      email: user.email,
      role: user.role,
      activo: user.activo,
      jefe: this.mapUserSummary(user.jefe),
      vendedores: Array.isArray(user.vendedores)
        ? user.vendedores.map((vendor) => this.mapUserSummary(vendor)!)
        : [],
      createdAt: user.createdAt,
    };
  }

  /**
   * =========================================================
   * CREATE
   * =========================================================
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { jefeId, password, ...datos } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    Object.assign(user, datos);
    user.password = hashedPassword;

    /**
     * Si no mandan activo, la entidad usa true por defecto.
     */
    if (typeof createUserDto.activo === 'boolean') {
      user.activo = createUserDto.activo;
    }

    if (jefeId) {
      const jefe = await this.userRepository.findOneBy({ id: jefeId });

      if (!jefe) {
        throw new NotFoundException('Jefe no existe');
      }

      user.jefe = jefe;
    }

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  /**
   * =========================================================
   * SEED ADMIN
   * =========================================================
   */
  
  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const exists = await this.userRepository.findOne({
      where: { email: 'admin@test.com' },
    });

    if (exists) {
      console.log('Admin ya existe');
      return;
    }

    const hashedPassword = await bcrypt.hash('123', 10);

    const admin = this.userRepository.create({
      email: 'admin@test.com',
      password: hashedPassword,
      nombre: 'Admin',
      apellido: 'Root',
      cedula: '0000000000',
      role: UserRole.ADMIN,
      activo: true,
    });

    await this.userRepository.save(admin);

    console.log('Admin creado correctamente');
  }

  /**
   * =========================================================
   * READ ALL
   * =========================================================
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      relations: ['jefe', 'vendedores'],
    });

    return users.map((user) => this.mapUserResponse(user));
  }

  /**
   * =========================================================
   * READ ONE
   * =========================================================
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['jefe', 'vendedores'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    return this.mapUserResponse(user);
  }

  /**
   * =========================================================
   * UPDATE
   * =========================================================
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['jefe'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    const { jefeId, password, ...datos } = updateUserDto;
    Object.assign(user, datos);

    if (typeof password === 'string' && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    if (typeof updateUserDto.activo === 'boolean') {
      user.activo = updateUserDto.activo;
    }

    if (jefeId) {
      const jefe = await this.userRepository.findOneBy({ id: jefeId });

      if (!jefe) {
        throw new NotFoundException('Jefe no existe');
      }

      user.jefe = jefe;
    }

    await this.userRepository.save(user);

    return this.findOne(id);
  }

  /**
   * =========================================================
   * DESACTIVAR EN LUGAR DE ELIMINAR
   * ---------------------------------------------------------
   * No se borra físicamente el usuario.
   * =========================================================
   */
  async remove(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    user.activo = false;
    await this.userRepository.save(user);

    return {
      deactivated: true,
      id: user.id,
    };
  }

  /**
   * =========================================================
   * JEFE → obtener sus vendedores
   * =========================================================
   */
  async getMyVendors(jefeId: number): Promise<UserResponseDto[]> {
    const vendors = await this.userRepository.find({
      where: {
        jefe: { id: jefeId },
        role: UserRole.VENDEDOR,
      },
      relations: ['jefe', 'vendedores'],
    });

    return vendors.map((user) => this.mapUserResponse(user));
  }
  
}