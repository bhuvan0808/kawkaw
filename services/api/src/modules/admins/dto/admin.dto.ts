import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class CreateAdminDto {
  @ApiProperty({ example: '+919999999999' })
  @Matches(/^[+]?[0-9]{10,15}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPER_ADMIN] })
  @IsIn([UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPER_ADMIN])
  role!: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
