import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditService } from '../audit/audit.service';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminsController {
  constructor(
    private readonly admins: AdminsService,
    private readonly audit: AuditService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: '[Admin] Dashboard summary' })
  dashboard() {
    return this.admins.dashboard();
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Orders & revenue analytics' })
  analytics(@Query('days') days?: string) {
    const parsed = days ? Math.min(90, Math.max(1, parseInt(days, 10) || 7)) : 7;
    return this.admins.analytics(parsed);
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Super Admin] List admin accounts' })
  list() {
    return this.admins.listAdmins();
  }

  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Super Admin] Create / elevate an admin account' })
  async create(
    @Body() dto: CreateAdminDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const result = await this.admins.createAdmin(dto);
    await this.audit.record({
      actorId,
      action: 'ADMIN_CREATED',
      entityType: 'Admin',
      entityId: result.id,
      after: { phone: dto.phone, role: dto.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }
}
