import type { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  /** Update only the refresh token hash (rotation on every login) */
  updateRefreshToken(userId: string, hash: string | null): Promise<void>;
}
