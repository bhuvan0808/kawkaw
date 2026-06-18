import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class SetStockDto {
  @ApiProperty({ description: 'Absolute quantity to set' })
  @IsInt()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseLocation?: string;
}

export class AdjustStockDto {
  @ApiProperty({ description: 'Signed delta to apply (e.g. +50 restock, -2 manual correction)' })
  @IsInt()
  delta!: number;
}
