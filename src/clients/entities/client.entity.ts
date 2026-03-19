import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  // ----- Datos personales -----
  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ nullable: true })
  dni: string;

  @Column({ nullable: true })
  numeroCliente: string;

  // ----- Datos comerciales -----
  @Column({ nullable: true })
  metodoPago: string; // Cuotas / Contado

  @Column({ nullable: true })
  metodoSeguimiento: string; // Llamada / Mensaje

  @Column({ default: false })
  simulacion: boolean;

  @Column({ nullable: true })
  tipoCliente: string; // A / B / C2

  @Column({ nullable: true })
  resolucion: string;

  // ----- Estados -----
  @Column({ default: false })
  documentacionCompleta: boolean;

  @Column({ nullable: true })
  referencias: string;

  @Column({ nullable: true })
  verificacionIdentidad: string;

  @Column({ default: false })
  facturado: boolean;

  @Column({ default: false })
  despachado: boolean;

  // ----- Observaciones -----
  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // ----- Relaciones -----
  @ManyToOne(() => User, { nullable: false })
  creadoPor: User;

  @ManyToOne(() => User, { nullable: false })
  vendedorAsignado: User;

  @CreateDateColumn()
  fechaCreacion: Date;
}