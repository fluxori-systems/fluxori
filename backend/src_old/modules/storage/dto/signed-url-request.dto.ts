import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Max,
  Min,
  IsEnum,
  IsBoolean,
  IsUUID,
} from "class-validator";

/**
 * Enum for image compression quality
 */
export enum CompressionQuality {
  LOW = "low", // High compression, low quality (smallest file size)
  MEDIUM = "medium", // Medium compression and quality (balanced)
  HIGH = "high", // Low compression, high quality (larger file size)
  ADAPTIVE = "adaptive", // Adapts based on network conditions
}

/**
 * Enum for image resize options
 */
export enum ResizeOption {
  NONE = "none", // No resizing
  THUMBNAIL = "thumbnail", // Small thumbnail (150x150)
  SMALL = "small", // Small image (300x300)
  MEDIUM = "medium", // Medium image (600x600)
  LARGE = "large", // Large image (1200x1200)
  CUSTOM = "custom", // Custom dimensions
}

/**
 * DTO for requesting a signed URL for file upload
 */
export class SignedUrlRequestDto {
  @ApiProperty({
    description: "Name of the file to upload, including path if needed",
    example: "products/main/product-image.jpg",
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: "Content type of the file",
    example: "image/jpeg",
  })
  @IsNotEmpty()
  @IsString()
  contentType: string;

  @ApiPropertyOptional({
    description: "Size of the file in bytes",
    example: 1024000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100 * 1024 * 1024) // 100MB
  fileSize?: number;

  @ApiPropertyOptional({
    description: "Time in minutes until the signed URL expires",
    example: 15,
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60) // Max 1 hour
  expiresInMinutes?: number;

  @ApiPropertyOptional({
    description: "Additional metadata to store with the file",
    example: { productId: "12345", category: "electronics" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

/**
 * DTO for requesting a signed URL for product image upload
 * Extends the base SignedUrlRequestDto with product-specific fields
 */
export class ProductImageSignedUrlRequestDto extends SignedUrlRequestDto {
  @ApiProperty({
    description: "ID of the product this image belongs to",
    example: "12345-abcde-67890",
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: "Type of product image (main, gallery, variant)",
    example: "main",
    default: "gallery",
  })
  @IsOptional()
  @IsString()
  imageType?: string;

  @ApiPropertyOptional({
    description: "Position/order of the image in the product gallery",
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    description: "Compression quality to apply",
    enum: CompressionQuality,
    default: CompressionQuality.ADAPTIVE,
  })
  @IsOptional()
  @IsEnum(CompressionQuality)
  compressionQuality?: CompressionQuality;

  @ApiPropertyOptional({
    description: "Whether to generate thumbnails automatically",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  generateThumbnails?: boolean;

  @ApiPropertyOptional({
    description: "Resize option to apply",
    enum: ResizeOption,
    default: ResizeOption.NONE,
  })
  @IsOptional()
  @IsEnum(ResizeOption)
  resizeOption?: ResizeOption;

  @ApiPropertyOptional({
    description: "Width in pixels if using custom resize option",
    example: 800,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  customWidth?: number;

  @ApiPropertyOptional({
    description: "Height in pixels if using custom resize option",
    example: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  customHeight?: number;

  @ApiPropertyOptional({
    description:
      "Whether this image should be optimized for low-bandwidth conditions",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  optimizeForLowBandwidth?: boolean;
}
