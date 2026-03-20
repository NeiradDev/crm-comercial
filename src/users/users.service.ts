import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * =========================================================
   * CREATE
   * ---------------------------------------------------------
   * Crea usuario, hashea la contraseña y asigna jefe si llega.
   * =========================================================
   */
  async create(createUserDto: CreateUserDto) {
    const { jefeId, password, ...datos } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    Object.assign(user, datos);
    user.password = hashedPassword;

    if (jefeId) {
      const jefe = await this.userRepository.findOneBy({ id: jefeId });

      if (!jefe) {
        throw new NotFoundException('Jefe no existe');
      }

      user.jefe = jefe;
    }

    /**
     * =========================================================
     * Al guardar, TypeORM devuelve la entidad persistida.
     * Como password tiene select: false, normalmente en futuras
     * consultas ya no saldrá. Aquí podría venir en memoria,
     * pero lo seguro es volver a consultar si quieres respuesta
     * limpia. Para mantenerlo simple, guardamos y volvemos
     * a pedirlo sin password.
     * =========================================================
     */
    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  /**
   * =========================================================
   * READ ALL
   * ---------------------------------------------------------
   * Gracias a select: false, password ya no debe salir.
   * =========================================================
   */
  findAll() {
    return this.userRepository.find({
      relations: ['jefe', 'vendedores'],
    });
  }

  /**
   * =========================================================
   * READ ONE
   * ---------------------------------------------------------
   * Busca un usuario por id y lanza error si no existe.
   * =========================================================
   */
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['jefe', 'vendedores'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    return user;
  }

  /**
   * =========================================================
   * UPDATE
   * ---------------------------------------------------------
   * Actualiza datos básicos y permite reasignar jefe.
   * =========================================================
   */
async update(id: number, updateUserDto: UpdateUserDto) {
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
   * DELETE
   * =========================================================
   */
  async remove(id: number) {
    await this.userRepository.delete(id);
    return { deleted: true };
  }
}