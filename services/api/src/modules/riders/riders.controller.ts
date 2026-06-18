import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  RegisterRiderDto,
  RiderListQueryDto,
  UpdateLocationDto,
  UpdateRiderStatusDto,
  VerifyRiderDto,
} from './dto/rider.dto';
import { RidersService } from './riders.service';

function riderIdOf(user: AuthenticatedUser): string {
  if (!user.riderId) {
    throw new BadRequestException('No rider profile on this account; re-login after registering');
  }
  return user.riderId;
}

@ApiTags('riders')
@ApiBearerAuth()
@Controller('riders')
export class RidersController {
  constructor(private readonly riders: RidersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register the current account as a rider (verification pending)' })
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterRiderDto) {
    return this.riders.register(userId, dto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get my rider profile' })
  me(@CurrentUser('id') userId: string) {
    return this.riders.getByUserId(userId);
  }

  @Patch('me/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Go online / offline' })
  setStatus(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateRiderStatusDto) {
    return this.riders.setStatus(riderIdOf(user), dto);
  }

  @Post('me/location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Push my current location' })
  updateLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateLocationDto) {
    return this.riders.updateLocation(riderIdOf(user), dto);
  }

  @Get('me/earnings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'My lifetime earnings totals' })
  earnings(@CurrentUser() user: AuthenticatedUser) {
    return this.riders.earnings(riderIdOf(user));
  }

  @Get('me/earnings/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'My earnings broken down by today / week / month / lifetime' })
  earningsSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.riders.earningsSummary(riderIdOf(user));
  }

  // --- Admin ---------------------------------------------------------------

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List riders' })
  list(@Query() query: RiderListQueryDto) {
    return this.riders.list(query, query.status);
  }

  @Get(':id/location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Get a rider live location' })
  location(@Param('id', ParseUUIDPipe) id: string) {
    return this.riders.getCachedLocation(id);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Verify / unverify a rider' })
  verify(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyRiderDto) {
    return this.riders.verify(id, dto);
  }
}
