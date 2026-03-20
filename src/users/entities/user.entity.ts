import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  JEFE = 'JEFE',
  VENDEDOR = 'VENDEDOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  /**
   * =========================================================
   * IMPORTANTE:
   * ---------------------------------------------------------
   * select: false hace que TypeORM NO devuelva esta columna
   * en consultas normales.
   *
   * Eso protege endpoints como:
   * - GET /users
   * - GET /users/:id
   *
   * y también ayuda a que relaciones como jefe/vendedores
   * no expongan el hash de contraseña.
   *
   * Cuando sí necesitemos esta columna (por ejemplo login),
   * la vamos a pedir manualmente en AuthService.
   * =========================================================
   */
  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  /**
   * =========================================================
   * Relación jerárquica:
   * - un usuario puede tener un jefe
   * - un jefe puede tener muchos vendedores
   * =========================================================
   */
  @ManyToOne(() => User, (user) => user.vendedores, { nullable: true })
  jefe: User;

  @OneToMany(() => User, (user) => user.jefe)
  vendedores: User[];

  @CreateDateColumn()
  createdAt: Date;
}