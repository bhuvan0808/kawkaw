import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const PHONE = /^[+]?[0-9]{10,15}$/;

export class CreateParcelDto {
  // Pickup
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  pickupContactName!: string;

  @ApiProperty()
  @Matches(PHONE, { message: 'pickupContactPhone must be a valid phone number' })
  pickupContactPhone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  pickupLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pickupLandmark?: string;

  @ApiProperty({ example: 17.6688 })
  @IsLatitude()
  pickupLatitude!: number;

  @ApiProperty({ example: 80.8936 })
  @IsLongitude()
  pickupLongitude!: number;

  // Drop
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  receiverName!: string;

  @ApiProperty()
  @Matches(PHONE, { message: 'receiverPhone must be a valid phone number' })
  receiverPhone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  dropLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dropLandmark?: string;

  @ApiProperty({ example: 17.672 })
  @IsLatitude()
  dropLatitude!: number;

  @ApiProperty({ example: 80.901 })
  @IsLongitude()
  dropLongitude!: number;

  // Package
  @ApiPropertyOptional({ example: 'Documents' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  packageType?: string;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string;
}
