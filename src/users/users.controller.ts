import {
  Controller, Get, Post, Body, Patch, Param, Delete, Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * =========================================================
   * Solo ADMIN crea usuarios
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * =========================================================
   * Solo ADMIN lista todos los usuarios
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * =========================================================
   * JEFE → ver sus vendedores
   * =========================================================
   */
  @Roles(UserRole.JEFE)
  @Get('my-vendors')
  myVendors(@Req() req: any) {
    const currentUser = req.user as { userId: number; role: UserRole };
    return this.usersService.getMyVendors(currentUser.userId);
  }

  /**
   * =========================================================
   * Solo ADMIN ve un usuario puntual
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  /**
   * =========================================================
   * Solo ADMIN actualiza usuarios
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  /**
   * =========================================================
   * Solo ADMIN desactiva usuarios
   * ---------------------------------------------------------
   * No se elimina físicamente.
   * =========================================================
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}