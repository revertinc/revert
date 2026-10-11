import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Provider } from '../../common/enums/provider.enum';

@Entity('connections')
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: Provider })
  provider: Provider;

  // Encrypted access token (for OAuth or API key)
  @Column({ type: 'text' })
  accessToken: string;

  // Encrypted refresh token (for OAuth, null for API key)
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  // Expiration date for access token (for OAuth, null or distant future for API key)
  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  scope: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // e.g., Workable subdomain, user info

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
