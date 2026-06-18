import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({ example: 'delivery_fee' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'Any JSON value', example: 20 })
  value!: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 'general' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Expose to client apps via /settings/public',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
