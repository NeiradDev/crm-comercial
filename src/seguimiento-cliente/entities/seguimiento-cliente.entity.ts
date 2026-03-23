import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

@Entity('client_follow_ups')
export class SeguimientoCliente {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'registradoPorId' })
  registradoPor: User;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ nullable: true })
  numeroCliente?: string;

  @Column()
  origen: string;

  @Column()
  metodoPago: string;

  @Column()
  insistencia: string;

  @Column({ default: false })
  simulacion: boolean;

  @Column()
  tipoCliente: string;

  @Column()
  resolucion: string;

  @Column()
  documentacion: string;

  @Column()
  referencias: string;

  @Column()
  verificacionIdentidad: string;

  @Column({ default: false })
  facturado: boolean;

  @Column({ default: false })
  despachado: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn()
  createdAt: Date;
}