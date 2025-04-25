import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for signed URL response
 */
export class SignedUrlResponseDto {
  @ApiProperty({
    description: 'Signed URL for direct upload',
    example:
      'https://storage.googleapis.com/bucket/file.jpg?X-Goog-Algorithm=...',
  })
  url: string;

  @ApiProperty({
    description: 'Additional fields required for the upload',
    example: { 'Content-Type': 'image/jpeg' },
  })
  fields: Record<string, string>;
}

/**
 * Extended response for product image uploads with optimizations for South African market
 */
export class ProductImageSignedUrlResponseDto extends SignedUrlResponseDto {
  @ApiProperty({
    description: 'Unique identifier for tracking this upload',
    example: '12345-abcde-67890',
  })
  uploadId: string;

  @ApiProperty({
    description: 'Public URL where the file will be accessible after upload',
    example:
      'https://storage.googleapis.com/fluxori-uploads/products/12345/main.jpg',
  })
  publicUrl: string;

  @ApiProperty({
    description: 'CDN-optimized URL that will be available after processing',
    example: 'https://cdn.fluxori.com/products/12345/main.jpg',
  })
  cdnUrl: string;

  @ApiPropertyOptional({
    description: 'URLs for different image sizes that will be generated',
    example: {
      thumbnail: 'https://cdn.fluxori.com/products/12345/main_thumbnail.jpg',
      small: 'https://cdn.fluxori.com/products/12345/main_small.jpg',
      medium: 'https://cdn.fluxori.com/products/12345/main_medium.jpg',
      large: 'https://cdn.fluxori.com/products/12345/main_large.jpg',
    },
  })
  thumbnailUrls?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Time when the signed URL expires',
    example: '2023-04-01T12:00:00Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Network-aware optimization information',
    example: {
      adaptiveCompression: true,
      lowBandwidthOptimized: true,
      estimatedSizeBytes: 102400,
      recommendedConnectionType: '3G or better',
    },
  })
  networkOptimization?: {
    adaptiveCompression: boolean;
    lowBandwidthOptimized: boolean;
    estimatedSizeBytes?: number;
    recommendedConnectionType?: string;
  };

  @ApiPropertyOptional({
    description: 'Webhook URL to notify when processing is complete',
    example: 'https://api.fluxori.com/webhooks/image-processed/12345',
  })
  processingWebhookUrl?: string;
}
