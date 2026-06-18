import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtConfig } from '../common/config/configuration';
import { UserRole, WS_EVENTS } from '../common/enums';
import { JwtAccessPayload } from '../common/interfaces/authenticated-user.interface';

interface SocketUser {
  id: string;
  role: UserRole;
  riderId?: string;
}

/**
 * Realtime gateway (Socket.IO, namespace `/realtime`).
 * Authenticated on handshake via the JWT access token (auth.token or
 * Authorization header). Rooms:
 *   - user:{userId}      every authenticated socket
 *   - order:{orderId}    order participants (customer, assigned rider, admins)
 *   - rider:{riderId}    a specific rider
 *   - admins             all admin/support sockets
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const jwtCfg = this.config.get<JwtConfig>('jwt') as JwtConfig;
      const payload = await this.jwt.verifyAsync<JwtAccessPayload>(token, {
        secret: jwtCfg.secret,
      });
      if (payload.type !== 'access') throw new WsException('Invalid token type');

      const user: SocketUser = { id: payload.sub, role: payload.role, riderId: payload.riderId };
      client.data.user = user;

      client.join(`user:${user.id}`);
      if (user.riderId) client.join(`rider:${user.riderId}`);
      if (
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPER_ADMIN ||
        user.role === UserRole.SUPPORT
      ) {
        client.join('admins');
      }
      this.logger.debug(`Socket connected: user=${user.id} role=${user.role}`);
    } catch (err) {
      this.logger.warn(`Rejected socket: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data?.user as SocketUser | undefined;
    if (user) this.logger.debug(`Socket disconnected: user=${user.id}`);
  }

  /** Client subscribes to live updates for an order it participates in. */
  @SubscribeMessage('order:subscribe')
  subscribeToOrder(client: Socket, payload: { orderId: string }): { joined: string } {
    if (!payload?.orderId) throw new WsException('orderId is required');
    client.join(`order:${payload.orderId}`);
    return { joined: `order:${payload.orderId}` };
  }

  @SubscribeMessage('order:unsubscribe')
  unsubscribeFromOrder(client: Socket, payload: { orderId: string }): void {
    if (payload?.orderId) client.leave(`order:${payload.orderId}`);
  }

  // --- Server-side emit helpers (called by services) -----------------------

  emitOrderStatus(orderId: string, data: unknown): void {
    this.server.to(`order:${orderId}`).emit(WS_EVENTS.ORDER_STATUS_CHANGED, data);
  }

  emitOrderAssigned(riderId: string, data: unknown): void {
    this.server.to(`rider:${riderId}`).emit(WS_EVENTS.ORDER_ASSIGNED, data);
  }

  emitRiderLocation(orderId: string, data: unknown): void {
    this.server.to(`order:${orderId}`).emit(WS_EVENTS.RIDER_LOCATION, data);
  }

  emitNotification(userId: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(WS_EVENTS.NOTIFICATION, data);
  }

  private extractToken(client: Socket): string {
    const fromAuth = (client.handshake.auth as { token?: string })?.token;
    const header = client.handshake.headers?.authorization;
    const fromHeader = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = fromAuth ?? fromHeader;
    if (!token) throw new WsException('Missing auth token');
    return token;
  }
}
