import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

/**
 * Enum de roles
 */
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

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  /**
   * JEFE del vendedor
   * - null para ADMIN y JEFE
   */
  @ManyToOne(() => User, (user) => user.sellers, {
    nullable: true,
  })
  boss: User;

  /**
   * Vendedores de un JEFE
   */
  @OneToMany(() => User, (user) => user.boss)
  sellers: User[];

  @CreateDateColumn()
  createdAt: Date;
}