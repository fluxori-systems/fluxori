import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator';

export class SignedUrlRequestDto {
  @ApiProperty({
    description: 'The name of the file to be uploaded',
    example: 'product-image.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'The content type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'The size of the file in bytes',
    example: 102400,
  })
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max file size
  sizeBytes: number;

  @ApiPropertyOptional({
    description: 'The folder to upload the file to',
    example: 'product-images',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata to attach to the file',
    example: { productId: '123', category: 'electronics' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'The expiration time for the signed URL in minutes',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  expiresInMinutes?: number;
}