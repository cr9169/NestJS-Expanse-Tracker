import { Inject, Injectable } from '@nestjs/common';
import type { Database, Statement } from 'better-sqlite3';

import { DATABASE_TOKEN } from '../../../database/tokens';
import { User, type UserRow } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class SqliteUserRepository implements IUserRepository {
  private readonly stmtFindById: Statement;
  private readonly stmtFindByEmail: Statement;
  private readonly stmtInsert: Statement;
  private readonly stmtUpdateRefreshToken: Statement;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {
    this.stmtFindById = db.prepare('SELECT * FROM users WHERE id = ?');
    this.stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');

    this.stmtInsert = db.prepare(`
      INSERT INTO users (id, email, password_hash, refresh_token_hash, created_at, updated_at)
      VALUES (@id, @email, @password_hash, @refresh_token_hash, @created_at, @updated_at)
    `);

    this.stmtUpdateRefreshToken = db.prepare(`
      UPDATE users SET refresh_token_hash = @hash, updated_at = @updated_at WHERE id = @id
    `);
  }

  async findById(id: string): Promise<User | null> {
    const row = this.stmtFindById.get(id) as UserRow | undefined;
    return Promise.resolve(row ? User.reconstitute(row) : null);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.stmtFindByEmail.get(email.toLowerCase()) as UserRow | undefined;
    return Promise.resolve(row ? User.reconstitute(row) : null);
  }

  async save(user: User): Promise<User> {
    this.stmtInsert.run({
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      refresh_token_hash: user.refreshTokenHash,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    });
    return Promise.resolve(user);
  }

  async updateRefreshToken(userId: string, hash: string | null): Promise<void> {
    this.stmtUpdateRefreshToken.run({
      id: userId,
      hash,
      updated_at: new Date().toISOString(),
    });
    return Promise.resolve();
  }
}
