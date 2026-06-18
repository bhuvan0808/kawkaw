import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { NotificationType, UserRole } from '../../common/enums';
import { FirebaseService } from '../../firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EventsGateway } from '../../websocket/events.gateway';

export const FCM_QUEUE = 'queue:notifications:fcm';

interface DispatchInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly firebase: FirebaseService,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Persist (source of truth) → push over WebSocket → enqueue + send FCM.
   * Never throws into the caller: notification delivery is best-effort.
   */
  async dispatch(input: DispatchInput): Promise<void> {
    let notificationId: string | undefined;
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      notificationId = notification.id;
      this.events.emitNotification(input.userId, notification);
    } catch (err) {
      this.logger.error(`Persist/emit notification failed: ${(err as Error).message}`);
    }

    // Enqueue for durability, then attempt immediate FCM send.
    await this.redis
      .enqueue(FCM_QUEUE, { ...input, notificationId })
      .catch((e) => this.logger.warn(`Enqueue FCM failed: ${e.message}`));

    try {
      const user = await this.prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
        select: { fcmToken: true },
      });
      if (user?.fcmToken && this.firebase.isConfigured()) {
        const messageId = await this.firebase.sendPush(
          user.fcmToken,
          { title: input.title, body: input.body },
          input.data,
        );
        if (messageId && notificationId) {
          await this.prisma.notification.update({
            where: { id: notificationId },
            data: { sentViaFcm: true, fcmMessageId: messageId },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`FCM send failed: ${(err as Error).message}`);
    }
  }

  async list(userId: string, query: PaginationQueryDto) {
    const where: Prisma.NotificationWhereInput = { userId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, deletedAt: null, isRead: false },
    });
    return { unread: count };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, deletedAt: null, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async sendToUser(input: DispatchInput) {
    await this.dispatch(input);
    return { success: true };
  }

  async broadcast(type: NotificationType, title: string, body: string, role?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        role: (role as UserRole) ?? UserRole.CUSTOMER,
      },
      select: { id: true },
    });
    for (const user of users) {
      await this.dispatch({ userId: user.id, type, title, body });
    }
    return { sent: users.length };
  }
}
