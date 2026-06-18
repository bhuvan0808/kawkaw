import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, STAFF_ROLES, UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AssignRiderDto, CancelOrderDto, CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

function riderIdOf(user: AuthenticatedUser): string {
  if (!user.riderId) throw new BadRequestException('No rider profile on this account');
  return user.riderId;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly audit: AuditService,
  ) {}

  // --- Customer ------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Place a Cash-On-Delivery order' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my orders' })
  listMine(@CurrentUser('id') userId: string, @Query() query: OrderQueryDto) {
    return this.orders.listForUser(userId, query);
  }

  // --- Rider ---------------------------------------------------------------

  @Get('rider/queue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] My active delivery queue' })
  queue(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.riderQueue(riderIdOf(user));
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Accept an assigned order' })
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.accept(id, riderIdOf(user), user.id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Reject an assigned order' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.reject(id, riderIdOf(user), user.id, dto.reason);
  }

  @Post(':id/pickup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Confirm pickup' })
  pickup(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.markPickedUp(id, riderIdOf(user), user.id);
  }

  @Post(':id/out-for-delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Mark out for delivery' })
  outForDelivery(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.markOutForDelivery(id, riderIdOf(user), user.id);
  }

  @Post(':id/deliver')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Confirm delivery (COD collected)' })
  deliver(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.markDelivered(id, riderIdOf(user), user.id);
  }

  // --- Admin ---------------------------------------------------------------

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: '[Admin] List all orders' })
  listAll(@Query() query: OrderQueryDto) {
    return this.orders.listAll(query);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign a rider to an order' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRiderDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const result = await this.orders.assignRider(id, dto.riderId);
    await this.audit.record({
      actorId,
      action: 'ORDER_ASSIGNED',
      entityType: 'Order',
      entityId: id,
      after: { riderId: dto.riderId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // --- Shared (must be last: param route) ----------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Get an order (owner, assigned rider, or admin)' })
  async getOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    if (STAFF_ROLES.includes(user.role) || user.role === UserRole.RIDER) {
      return this.orders.getByIdOrThrow(id);
    }
    return this.orders.getForUser(user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (owner before pickup, or admin)' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @Req() req: Request,
  ) {
    const isAdmin = ADMIN_ROLES.includes(user.role);
    const result = await this.orders.cancel(id, dto.reason, user.id, isAdmin);
    if (isAdmin) {
      await this.audit.record({
        actorId: user.id,
        action: 'ORDER_CANCELLED_BY_ADMIN',
        entityType: 'Order',
        entityId: id,
        after: { reason: dto.reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    return result;
  }
}
