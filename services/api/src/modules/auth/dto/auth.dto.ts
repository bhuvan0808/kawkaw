import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({
    description: 'Firebase ID token obtained after phone OTP verification on the client',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiPropertyOptional({ description: 'Optional display name to set on first login' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'FCM device token for push notifications' })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ description: 'Optional email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'A valid refresh token' })
  @IsJWT()
  refreshToken!: string;
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access-token lifetime in seconds' })
  expiresIn!: number;
}
