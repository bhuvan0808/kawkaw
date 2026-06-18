import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ADMIN_ROLES, STAFF_ROLES, UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssignRiderDto, CancelOrderDto } from '../orders/dto/order.dto';
import { CreateParcelDto } from './dto/parcel.dto';
import { ParcelsService } from './parcels.service';

function riderIdOf(user: AuthenticatedUser): string {
  if (!user.riderId) throw new BadRequestException('No rider profile on this account');
  return user.riderId;
}

@ApiTags('parcels')
@ApiBearerAuth()
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcels: ParcelsService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Get a delivery quote for a parcel' })
  quote(@Body() dto: CreateParcelDto) {
    return this.parcels.quote(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Book a parcel delivery (COD)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateParcelDto) {
    return this.parcels.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my parcels' })
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.parcels.listForUser(userId, query);
  }

  // --- Rider ---------------------------------------------------------------

  @Get('rider/queue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] My parcel queue' })
  queue(@CurrentUser() user: AuthenticatedUser) {
    return this.parcels.riderQueue(riderIdOf(user));
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Accept a parcel' })
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.parcels.accept(id, riderIdOf(user));
  }

  @Post(':id/pickup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Confirm parcel pickup' })
  pickup(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.parcels.markPickedUp(id, riderIdOf(user));
  }

  @Post(':id/out-for-delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Mark parcel in transit' })
  transit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.parcels.markOutForDelivery(id, riderIdOf(user));
  }

  @Post(':id/deliver')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: '[Rider] Confirm parcel delivery' })
  deliver(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.parcels.markDelivered(id, riderIdOf(user));
  }

  // --- Admin ---------------------------------------------------------------

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: '[Admin] List all parcels' })
  listAll(@Query() query: PaginationQueryDto) {
    return this.parcels.listAll(query);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign a rider to a parcel' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRiderDto) {
    return this.parcels.assignRider(id, dto.riderId);
  }

  // --- Shared (param routes last) ------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Get a parcel (owner, assigned rider, or admin)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    if (STAFF_ROLES.includes(user.role) || user.role === UserRole.RIDER) {
      return this.parcels.getById(id);
    }
    return this.parcels.getForUser(user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a parcel (owner before pickup, or admin)' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const isAdmin = ADMIN_ROLES.includes(user.role);
    return this.parcels.cancel(id, dto.reason, user.id, isAdmin);
  }
}
