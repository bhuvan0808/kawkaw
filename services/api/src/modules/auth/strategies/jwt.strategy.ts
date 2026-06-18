import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from '../../../common/config/configuration';
import { UserRole } from '../../../common/enums';
import {
  AuthenticatedUser,
  JwtAccessPayload,
} from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwt = config.get<JwtConfig>('jwt') as JwtConfig;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.secret,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      select: { id: true, phone: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      riderId: payload.riderId,
    };
  }
}
