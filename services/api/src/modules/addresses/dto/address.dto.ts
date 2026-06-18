import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AddressType } from '../../../common/enums';

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: AddressType, default: AddressType.HOME })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  landmark?: string;

  @ApiPropertyOptional({ default: 'Bhadrachalam' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ default: 'Telangana' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '507111' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be a 6-digit Indian PIN code' })
  pincode!: string;

  @ApiProperty({ example: 17.6688 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 80.8936 })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  receiverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, { message: 'receiverPhone must be a valid phone number' })
  receiverPhone?: string;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
