/**
 * Storage Controller
 *
 * Provides RESTful endpoints for general storage operations
 * Includes optimizations for South African market with network-aware parameters
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  UseInterceptors,
  NotFoundException,
  Inject,
  Logger,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

import { StorageService, STORAGE_SERVICE } from "@common/storage";
import { FirebaseAuthGuard } from "@common/guards";
import { SignedUrlRequestDto } from "../dto/signed-url-request.dto";
import { SignedUrlResponseDto } from "../dto/signed-url-response.dto";
import { GetUser } from "@common/decorators";
import { LoggingInterceptor, TracingInterceptor } from "@common/observability";
import { User } from "../../../types/google-cloud.types";

@ApiTags("storage")
@Controller("storage")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor, TracingInterceptor)
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a signed URL for uploading a file directly to storage
   * Optimized for South African market with network-aware parameters
   */
  @Post("signed-upload-url")
  @ApiOperation({ summary: "Generate a signed URL for direct file upload" })
  @ApiResponse({
    status: 201,
    description: "Signed URL created",
    type: SignedUrlResponseDto,
  })
  async generateSignedUploadUrl(
    @Body() dto: SignedUrlRequestDto,
    @GetUser() user: User,
    @Req() req: any,
  ): Promise<SignedUrlResponseDto> {
    // Validate file size if provided
    const maxSizeBytes =
      this.configService.get<number>("MAX_FILE_SIZE_BYTES") ||
      100 * 1024 * 1024; // 100MB default
    if (dto.fileSize && dto.fileSize > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeBytes / (1024 * 1024)}MB`,
      );
    }

    // Add user and organization metadata
    const metadata: Record<string, string> = {
      ...dto.metadata,
      uploadedBy: user.uid,
      organizationId: user.organizationId || "unknown",
    };

    // Get connection quality from request headers if available
    // This allows client-side optimizations based on network conditions
    const connectionQuality = req.headers["x-connection-quality"] || "unknown";
    const connectionType = req.headers["x-connection-type"] || "unknown";

    // Add these to metadata for analytics
    metadata.connectionQuality = connectionQuality as string;
    metadata.connectionType = connectionType as string;
    metadata.userRegion = (req.headers["x-user-region"] || "unknown") as string;

    try {
      const result = await this.storageService.generateSignedUploadUrl({
        fileName: dto.fileName,
        contentType: dto.contentType,
        expiresInMinutes: dto.expiresInMinutes,
        metadata,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  /**
   * Get a signed URL for downloading a file
   */
  @Get("file/:filePath(*)/download-url")
  @ApiOperation({ summary: "Get a signed URL to download a file" })
  @ApiResponse({ status: 200, description: "Signed URL returned" })
  async getSignedDownloadUrl(
    @Param("filePath") filePath: string,
    @GetUser() user: User,
  ): Promise<{ url: string; expiresAt: Date }> {
    try {
      // Check if file exists
      const bucket =
        this.configService.get<string>("GCS_BUCKET_NAME") || "fluxori-uploads";

      // Generate signed URL with default expiration time
      const url = await this.storageService.getSignedDownloadUrl(filePath);

      // Calculate expiration time (default is usually 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      return { url, expiresAt };
    } catch (error) {
      this.logger.error(
        `Error getting signed download URL: ${error.message}`,
        error.stack,
      );
      throw new NotFoundException(
        `File not found or access denied: ${error.message}`,
      );
    }
  }

  /**
   * Delete a file from storage
   */
  @Post("file/:filePath(*)/delete")
  @ApiOperation({ summary: "Delete a file from storage" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  async deleteFile(
    @Param("filePath") filePath: string,
    @GetUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.storageService.deleteFile(filePath);
      return { success: true, message: "File deleted successfully" };
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}
