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
  CARGADOR = 'CARGADOR',
}

@Entity('users')
export class User {
  /**
   * =========================================================
   * ID principal
   * =========================================================
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * =========================================================
   * Datos personales
   * =========================================================
   */
  @Column()
  nombre: string;

  @Column()
  apellido: string;

  /**
   * =========================================================
   * Cédula única
   * ---------------------------------------------------------
   * Se usa como dato civil único dentro del sistema.
   * =========================================================
   */
  @Column({ unique: true })
  cedula: string;

  /**
   * =========================================================
   * Email único
   * =========================================================
   */
  @Column({ unique: true })
  email: string;

  /**
   * =========================================================
   * Password
   * ---------------------------------------------------------
   * No se selecciona automáticamente para evitar exponerla
   * en respuestas normales.
   * =========================================================
   */
  @Column({ select: false })
  password: string;

  /**
   * =========================================================
   * Estado lógico del usuario
   * ---------------------------------------------------------
   * activo = false:
   * - no puede iniciar sesión
   * - no desaparece del sistema
   * - mantiene historial
   * =========================================================
   */
  @Column({ default: true })
  activo: boolean;

  /**
   * =========================================================
   * Rol del usuario
   * =========================================================
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  /**
   * =========================================================
   * Relación jerárquica
   * ---------------------------------------------------------
   * - Un vendedor pertenece a un jefe
   * - Un jefe puede tener muchos vendedores
   * - Cargador no entra en esta jerarquía comercial
   * =========================================================
   */
  @ManyToOne(() => User, (user) => user.vendedores, { nullable: true })
  jefe: User;

  @OneToMany(() => User, (user) => user.jefe)
  vendedores: User[];

  /**
   * =========================================================
   * Fecha de creación
   * =========================================================
   */
  @CreateDateColumn()
  createdAt: Date;
}