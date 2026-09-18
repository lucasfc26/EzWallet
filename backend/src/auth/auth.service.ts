import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from './types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const BCRYPT_ROUNDS = 12;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(name: string, email: string, password: string): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.users.create({ name, email, passwordHash });
    const authUser: AuthenticatedUser = { id: user.id, email: user.email, name: user.name };
    const tokens = await this.issueTokens(authUser);
    return { user: authUser, tokens };
  }

  async login(email: string, password: string): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    const authUser: AuthenticatedUser = { id: user.id, email: user.email, name: user.name };
    const tokens = await this.issueTokens(authUser);
    return { user: authUser, tokens };
  }

  /** Verifies the refresh cookie, rotates it (revoke old, issue new) and returns a fresh pair. */
  async refresh(rawRefreshToken: string): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(rawRefreshToken, {
        secret: this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Sessão expirada, faça login novamente.');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.forUser(userId, (tx) =>
      tx.refreshToken.findFirst({ where: { userId, tokenHash, revokedAt: null } }),
    );
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessão expirada, faça login novamente.');
    }

    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    await this.prisma.forUser(userId, (tx) =>
      tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
    );

    const authUser: AuthenticatedUser = { id: user.id, email: user.email, name: user.name };
    const tokens = await this.issueTokens(authUser);
    return { user: authUser, tokens };
  }

  async logout(userId: string, rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.forUser(userId, (tx) =>
      tx.refreshToken.updateMany({ where: { userId, tokenHash, revokedAt: null }, data: { revokedAt: new Date() } }),
    );
  }

  private async issueTokens(user: AuthenticatedUser): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, name: user.name },
      {
        secret: this.config.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get<string>('ACCESS_TOKEN_TTL', '15m') as StringValue,
      },
    );

    const ttlDays = Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS', '7'));
    const refreshTokenExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: randomUUID() },
      { secret: this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'), expiresIn: `${ttlDays}d` as StringValue },
    );

    await this.prisma.forUser(user.id, (tx) =>
      tx.refreshToken.create({
        data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshTokenExpiresAt },
      }),
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}
