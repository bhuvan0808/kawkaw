import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { VerifyPrescriptionDto } from './dto/prescription.dto';
import { PrescriptionsService, UploadedFile as UploadedFileModel } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private readonly prescriptions: PrescriptionsService,
    private readonly audit: AuditService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiOperation({ summary: 'Upload a prescription image (JPEG/PNG/WEBP)' })
  upload(@CurrentUser('id') userId: string, @UploadedFile() file: UploadedFileModel) {
    return this.prescriptions.upload(userId, file);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List my prescription uploads' })
  mine(@CurrentUser('id') userId: string) {
    return this.prescriptions.listMine(userId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: '[Admin] List prescriptions awaiting verification' })
  pending() {
    return this.prescriptions.listPending();
  }

  @Get(':fileId/file')
  @ApiOperation({ summary: 'Stream a prescription image (owner or staff only)' })
  async file(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string,
  ): Promise<StreamableFile> {
    const path = await this.prescriptions.getFilePath(user, fileId);
    return new StreamableFile(createReadStream(path));
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: '[Admin] Verify or reject a prescription' })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPrescriptionDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const result = await this.prescriptions.verify(id, adminId, dto);
    await this.audit.record({
      actorId: adminId,
      action: 'PRESCRIPTION_REVIEWED',
      entityType: 'PrescriptionUpload',
      entityId: id,
      after: { status: dto.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }
}
