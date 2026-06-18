import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Enforces @Roles(...). SUPER_ADMIN implicitly satisfies any ADMIN requirement.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const effectiveRoles = new Set<UserRole>([user.role]);
    if (user.role === UserRole.SUPER_ADMIN) {
      effectiveRoles.add(UserRole.ADMIN);
      effectiveRoles.add(UserRole.SUPPORT);
    }

    const allowed = required.some((role) => effectiveRoles.has(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions for this resource');
    }
    return true;
  }
}
