import { v4 as uuidv4 } from 'uuid';

export interface CreateUserProps {
  email: string;
  passwordHash: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  refresh_token_hash: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User domain entity — pure TypeScript, no NestJS decorators.
 * The refresh token is stored HASHED (bcrypt) — if the token DB is compromised,
 * tokens cannot be replayed because the attacker only has the hash.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly refreshTokenHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User(uuidv4(), props.email.toLowerCase().trim(), props.passwordHash, null, now, now);
  }

  static reconstitute(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.password_hash,
      row.refresh_token_hash,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  withRefreshTokenHash(hash: string | null): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      hash,
      this.createdAt,
      new Date(),
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
