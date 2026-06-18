import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditService } from '../audit/audit.service';
import { BroadcastNotificationDto, SendNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  list(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.list(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'My unread notification count' })
  unread(@CurrentUser('id') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications read' })
  readAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  read(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(userId, id);
  }

  // --- Admin ---------------------------------------------------------------

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Send a notification to a user' })
  async send(@Body() dto: SendNotificationDto, @CurrentUser('id') actorId: string, @Req() req: Request) {
    const result = await this.notifications.sendToUser(dto);
    await this.audit.record({
      actorId,
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: dto.userId,
      after: { type: dto.type, title: dto.title, body: dto.body, target: dto.userId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Broadcast a notification' })
  async broadcast(@Body() dto: BroadcastNotificationDto, @CurrentUser('id') actorId: string, @Req() req: Request) {
    const result = await this.notifications.broadcast(dto.type, dto.title, dto.body, dto.role);
    await this.audit.record({
      actorId,
      action: 'NOTIFICATION_BROADCAST',
      entityType: 'Notification',
      after: { type: dto.type, title: dto.title, body: dto.body, audience: dto.role ?? 'ALL_CUSTOMERS', result },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }
}
