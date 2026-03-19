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

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  // Jerarquía
  @ManyToOne(() => User, (user) => user.vendedores, { nullable: true })
  jefe: User;

  @OneToMany(() => User, (user) => user.jefe)
  vendedores: User[];

  @CreateDateColumn()
  createdAt: Date;
}