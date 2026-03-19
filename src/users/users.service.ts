import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ✅ CREATE
  async create(createUserDto: CreateUserDto) {
    const { jefeId, ...datos } = createUserDto;

    const user = new User();
    Object.assign(user, datos);

    if (jefeId) {
      const jefe = await this.userRepository.findOneBy({ id: jefeId });
      if (!jefe) {
        throw new NotFoundException('Jefe no existe');
      }
      user.jefe = jefe;
    }

    return this.userRepository.save(user);
  }

  // ✅ READ ALL
  findAll() {
    return this.userRepository.find({
      relations: ['jefe', 'vendedores'],
    });
  }

  // ✅ READ ONE
  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['jefe', 'vendedores'],
    });
  }

  // ✅ UPDATE
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['jefe'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no existe');
    }

    const { jefeId, ...datos } = updateUserDto;
    Object.assign(user, datos);

    if (jefeId) {
      const jefe = await this.userRepository.findOneBy({ id: jefeId });
      if (!jefe) {
        throw new NotFoundException('Jefe no existe');
      }
      user.jefe = jefe;
    }

    return this.userRepository.save(user);
  }

  // ✅ DELETE
  async remove(id: number) {
    await this.userRepository.delete(id);
    return { deleted: true };
  }
}
