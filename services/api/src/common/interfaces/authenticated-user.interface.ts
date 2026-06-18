import { UserRole } from '../enums';

/** Shape attached to `request.user` after JWT validation. */
export interface AuthenticatedUser {
  id: string;
  phone: string;
  role: UserRole;
  /** Present when the user is a rider (rider profile id). */
  riderId?: string;
}

/** Claims carried inside the access token. */
export interface JwtAccessPayload {
  sub: string;
  phone: string;
  role: UserRole;
  riderId?: string;
  type: 'access';
}

/** Claims carried inside the refresh token. */
export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}
