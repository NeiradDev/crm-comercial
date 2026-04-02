import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // =========================================================
  // CREAR USUARIO
  // =========================================================
  async create(createUserDto: CreateUserDto) {
    try {
      // -----------------------------------------------------
      // VALIDACIÓN BÁSICA
      // -----------------------------------------------------
      if (
        !createUserDto.nombre?.trim() ||
        !createUserDto.apellido?.trim() ||
        !createUserDto.cedula?.trim() ||
        !createUserDto.email?.trim() ||
        !createUserDto.password?.trim() ||
        !createUserDto.role
      ) {
        throw new BadRequestException(
          'Nombre, apellido, cédula, email, contraseña y rol son obligatorios.',
        );
      }

      const normalizedEmail = createUserDto.email.trim().toLowerCase();
      const normalizedCedula = createUserDto.cedula.trim();

      // -----------------------------------------------------
      // EMAIL DUPLICADO
      // -----------------------------------------------------
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingByEmail) {
        throw new ConflictException(
          `Ya existe un usuario registrado con el correo ${normalizedEmail}.`,
        );
      }

      // -----------------------------------------------------
      // CÉDULA DUPLICADA
      // -----------------------------------------------------
      const existingByCedula = await this.usersRepository.findOne({
        where: { cedula: normalizedCedula },
      });

      if (existingByCedula) {
        throw new ConflictException(
          `Ya existe un usuario registrado con la cédula ${normalizedCedula}.`,
        );
      }

      // -----------------------------------------------------
      // VALIDAR JEFE SI ES VENDEDOR
      // -----------------------------------------------------
      let boss: User | undefined = undefined;

      if (createUserDto.role === UserRole.VENDEDOR) {
        if (!createUserDto.jefeId) {
          throw new BadRequestException(
            'Para crear un vendedor debes seleccionar un jefe.',
          );
        }

        const foundBoss = await this.usersRepository.findOne({
          where: { id: createUserDto.jefeId },
        });

        if (!foundBoss) {
          throw new NotFoundException(
            `No existe el jefe con id ${createUserDto.jefeId}.`,
          );
        }

        if (foundBoss.role !== UserRole.JEFE) {
          throw new BadRequestException(
            'El usuario seleccionado como jefe no tiene rol JEFE.',
          );
        }

        if (!foundBoss.activo) {
          throw new BadRequestException(
            'No puedes asignar un jefe inactivo a un vendedor.',
          );
        }

        boss = foundBoss;
      }

      // -----------------------------------------------------
      // HASH DE PASSWORD
      // -----------------------------------------------------
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // -----------------------------------------------------
      // OJO:
      // NO mandamos jefe: null
      // Porque con tu entidad eso rompe el tipado de create().
      // Solo agregamos jefe si realmente existe.
      // -----------------------------------------------------
      const userToCreate: Partial<User> = {
        nombre: createUserDto.nombre.trim(),
        apellido: createUserDto.apellido.trim(),
        cedula: normalizedCedula,
        email: normalizedEmail,
        password: hashedPassword,
        role: createUserDto.role,
        activo: createUserDto.activo ?? true,
      };

      if (boss) {
        userToCreate.jefe = boss;
      }

      const user = this.usersRepository.create(userToCreate);
      const savedUser = await this.usersRepository.save(user);

      return {
        id: savedUser.id,
        nombre: savedUser.nombre,
        apellido: savedUser.apellido,
        cedula: savedUser.cedula,
        email: savedUser.email,
        role: savedUser.role,
        activo: savedUser.activo,
        createdAt: savedUser.createdAt,
      };
    } catch (error) {
      // -----------------------------------------------------
      // EXCEPCIONES DE NEGOCIO
      // -----------------------------------------------------
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // -----------------------------------------------------
      // ERRORES SQL DE UNIQUE
      // -----------------------------------------------------
      if (error instanceof QueryFailedError) {
        const driverError = (error as any).driverError;
        const code = driverError?.code;
        const detail = String(driverError?.detail || '');

        if (code === '23505') {
          if (detail.includes('(email)=')) {
            throw new ConflictException(
              'El correo ingresado ya está registrado por otro usuario.',
            );
          }

          if (detail.includes('(cedula)=')) {
            throw new ConflictException(
              'La cédula ingresada ya está registrada por otro usuario.',
            );
          }

          throw new ConflictException(
            'Ya existe un usuario con un dato único duplicado.',
          );
        }
      }

      console.error('UsersService.create error no controlado:', error);

      throw new InternalServerErrorException(
        'No se pudo crear el usuario. Intenta nuevamente.',
      );
    }
  }

  // =========================================================
  // LISTAR TODOS
  // =========================================================
  async findAll() {
    return this.usersRepository.find({
      relations: ['jefe'],
      order: { id: 'DESC' },
    });
  }
    // =========================================================
  // BUSCAR UNO POR ID
  // =========================================================
  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['jefe'],
    });

    if (!user) {
      throw new NotFoundException(`No existe el usuario con id ${id}.`);
    }

    return user;
  }

  // =========================================================
  // MIS VENDEDORES
  // =========================================================
  async getMyVendors(supervisorId: number) {
    return this.usersRepository.find({
      where: {
        role: UserRole.VENDEDOR,
        jefe: { id: supervisorId },
      },
      relations: ['jefe'],
      order: { id: 'DESC' },
    });
  }

  // =========================================================
  // DESACTIVAR
  // =========================================================
  async remove(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`No existe el usuario con id ${id}.`);
    }

    user.activo = false;
    await this.usersRepository.save(user);

    return {
      message: 'Usuario desactivado correctamente.',
    };
  }

  // =========================================================
  // ACTUALIZAR
  // =========================================================
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['jefe'],
    });

    if (!user) {
      throw new NotFoundException(`No existe el usuario con id ${id}.`);
    }

    try {
      if (updateUserDto.email && updateUserDto.email.trim().toLowerCase() !== user.email) {
        const existingByEmail = await this.usersRepository.findOne({
          where: { email: updateUserDto.email.trim().toLowerCase() },
        });

        if (existingByEmail && existingByEmail.id !== id) {
          throw new ConflictException(
            `Ya existe un usuario registrado con el correo ${updateUserDto.email.trim().toLowerCase()}.`,
          );
        }

        user.email = updateUserDto.email.trim().toLowerCase();
      }

      if (updateUserDto.cedula && updateUserDto.cedula.trim() !== user.cedula) {
        const existingByCedula = await this.usersRepository.findOne({
          where: { cedula: updateUserDto.cedula.trim() },
        });

        if (existingByCedula && existingByCedula.id !== id) {
          throw new ConflictException(
            `Ya existe un usuario registrado con la cédula ${updateUserDto.cedula.trim()}.`,
          );
        }

        user.cedula = updateUserDto.cedula.trim();
      }

      if (typeof updateUserDto.nombre === 'string') {
        user.nombre = updateUserDto.nombre.trim();
      }

      if (typeof updateUserDto.apellido === 'string') {
        user.apellido = updateUserDto.apellido.trim();
      }

      if (typeof updateUserDto.activo === 'boolean') {
        user.activo = updateUserDto.activo;
      }

      if (updateUserDto.password?.trim()) {
        user.password = await bcrypt.hash(updateUserDto.password.trim(), 10);
      }

      if (updateUserDto.role) {
        user.role = updateUserDto.role;
      }

      const saved = await this.usersRepository.save(user);

      return {
        id: saved.id,
        nombre: saved.nombre,
        apellido: saved.apellido,
        cedula: saved.cedula,
        email: saved.email,
        role: saved.role,
        activo: saved.activo,
        createdAt: saved.createdAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        const driverError = (error as any).driverError;
        const code = driverError?.code;
        const detail = String(driverError?.detail || '');

        if (code === '23505') {
          if (detail.includes('(email)=')) {
            throw new ConflictException(
              'El correo ingresado ya está registrado por otro usuario.',
            );
          }

          if (detail.includes('(cedula)=')) {
            throw new ConflictException(
              'La cédula ingresada ya está registrada por otro usuario.',
            );
          }

          throw new ConflictException(
            'Ya existe un usuario con un dato único duplicado.',
          );
        }
      }

      console.error('UsersService.update error no controlado:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el usuario.',
      );
    }
  }
}