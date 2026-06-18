import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { UploadConfig } from '../../common/config/configuration';
import { NotificationType, PrescriptionStatus, STAFF_ROLES } from '../../common/enums';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerifyPrescriptionDto } from './dto/prescription.dto';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

const MAGIC: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF (WEBP checked further)
};

@Injectable()
export class PrescriptionsService {
  private readonly uploadCfg: UploadConfig;
  private readonly storageDir = resolve(process.cwd(), 'uploads', 'prescriptions');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.uploadCfg = this.config.get<UploadConfig>('upload') as UploadConfig;
  }

  /** Validates and securely stores a prescription image, returning the record. */
  async upload(userId: string, file?: UploadedFile) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size > this.uploadCfg.maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.floor(this.uploadCfg.maxBytes / 1024)} KB`,
      );
    }
    if (!this.uploadCfg.allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG or WEBP images are allowed');
    }
    this.assertMagicBytes(file);

    await fs.mkdir(this.storageDir, { recursive: true });
    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const fileId = randomUUID();
    const filename = `${fileId}.${ext}`;
    await fs.writeFile(join(this.storageDir, filename), file.buffer, { mode: 0o600 });

    return this.prisma.prescriptionUpload.create({
      data: {
        userId,
        imageUrl: `/api/v1/prescriptions/${fileId}/file`,
        status: PrescriptionStatus.PENDING,
        fileSize: file.size,
        mimeType: file.mimetype,
        // store the storage filename in notes-free column via imageUrl mapping:
        thumbnailUrl: filename,
      },
    });
  }

  async listMine(userId: string) {
    return this.prisma.prescriptionUpload.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPending() {
    return this.prisma.prescriptionUpload.findMany({
      where: { deletedAt: null, status: PrescriptionStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
  }

  /** Returns the absolute file path after an access check. */
  async getFilePath(user: AuthenticatedUser, idFromUrl: string): Promise<string> {
    // idFromUrl is the fileId embedded in imageUrl; map back to the record.
    const record = await this.prisma.prescriptionUpload.findFirst({
      where: { imageUrl: { contains: `/prescriptions/${idFromUrl}/file` }, deletedAt: null },
    });
    if (!record || !record.thumbnailUrl) throw new NotFoundException('Prescription not found');

    const isStaff = STAFF_ROLES.includes(user.role);
    const isOwner = record.userId === user.id;
    if (!isStaff && !isOwner) {
      throw new ForbiddenException('You cannot access this prescription');
    }
    return join(this.storageDir, record.thumbnailUrl);
  }

  async verify(id: string, adminId: string, dto: VerifyPrescriptionDto) {
    const record = await this.prisma.prescriptionUpload.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) throw new NotFoundException('Prescription not found');
    if (dto.status === PrescriptionStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A rejection reason is required');
    }

    const updated = await this.prisma.prescriptionUpload.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.status === PrescriptionStatus.REJECTED ? dto.rejectionReason : null,
        notes: dto.notes,
        verifiedById: adminId,
        verifiedAt: new Date(),
      },
    });

    await this.notifications.dispatch({
      userId: record.userId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Prescription review',
      body:
        dto.status === PrescriptionStatus.VERIFIED
          ? 'Your prescription has been verified.'
          : `Your prescription was rejected: ${dto.rejectionReason}`,
      data: { prescriptionId: id, status: dto.status },
    });
    return updated;
  }

  private assertMagicBytes(file: UploadedFile): void {
    const expected = MAGIC[file.mimetype];
    if (!expected) throw new BadRequestException('Unsupported image type');
    const head = file.buffer.subarray(0, expected.length);
    const ok = expected.every((byte, i) => head[i] === byte);
    if (!ok) throw new BadRequestException('File content does not match its declared image type');
    if (file.mimetype === 'image/webp') {
      const webp = file.buffer.subarray(8, 12).toString('ascii');
      if (webp !== 'WEBP') throw new BadRequestException('Invalid WEBP file');
    }
  }
}
