import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { RiderStatus } from '../../../common/enums';

export class RiderListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RiderStatus })
  @IsOptional()
  @IsEnum(RiderStatus)
  status?: RiderStatus;
}

export class RegisterRiderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

export class UpdateRiderStatusDto {
  @ApiProperty({ enum: RiderStatus })
  @IsEnum(RiderStatus)
  status!: RiderStatus;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 17.6688 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 80.8936 })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speed?: number;
}

export class VerifyRiderDto {
  @ApiProperty()
  @IsBoolean()
  isVerified!: boolean;
}
