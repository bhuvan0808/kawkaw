import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrescriptionStatus } from '../../../common/enums';

export class VerifyPrescriptionDto {
  @ApiProperty({ enum: [PrescriptionStatus.VERIFIED, PrescriptionStatus.REJECTED] })
  @IsIn([PrescriptionStatus.VERIFIED, PrescriptionStatus.REJECTED])
  status!: PrescriptionStatus;

  @ApiPropertyOptional({ description: 'Required when rejecting' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
