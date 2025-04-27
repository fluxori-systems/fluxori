/**
 * Import/Export Controller
 *
 * Controller for handling product import and export operations
 * with South African optimizations.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Logger,
  StreamableFile,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Response as ExpressResponse } from 'express';
import * as Multer from 'multer';

import { FirebaseAuthGuard } from '../../auth';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import {
  ImportExportService,
  ExportFormat,
  ImportOptions,
  ExportOptions,
} from '../services/import-export.service';
import { MarketContextService } from '../services/market-context.service';
import { NetworkAwareStorageService } from '../services/network-aware-storage.service';

/**
 * Controller for product import/export operations
 */
@Controller('pim/import-export')
@UseGuards(FirebaseAuthGuard)
export class ImportExportController {
  private readonly logger = new Logger(ImportExportController.name);

  constructor(
    private readonly importExportService: ImportExportService,
    private readonly networkAwareStorage: NetworkAwareStorageService,
    private readonly marketContextService: MarketContextService,
  ) {}

  /**
   * Import products from file
   *
   * @param file - Uploaded file
   * @param updateExisting - Whether to update existing products
   * @param continueOnError - Whether to continue on error
   * @param user - Authenticated user
   * @returns Import result
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(csv|json|xml|xlsx)' }),
        ],
      }),
    )
    file: Multer.File,
    @Query('updateExisting') updateExisting: boolean = false,
    @Query('continueOnError') continueOnError: boolean = false,
    @GetUser() user: any,
  ) {
    this.logger.log(`Importing products from ${file.originalname}`);

    try {
      // Detect file format from extension
      const format = this.getFormatFromFileName(file.originalname);

      // Prepare import options
      const importOptions: ImportOptions = {
        format,
        updateExisting,
        continueOnError,
        tenantId: user.tenantId,
        operatorId: user.uid,
      };

      // Process import
      const result = await this.importExportService.importProducts(
        file.buffer,
        file.originalname,
        importOptions,
      );

      return result;
    } catch (error) {
      this.logger.error(`Import failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Import failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Export products to file
   *
   * @param exportOptions - Export options
   * @param user - Authenticated user
   * @param res - Express response
   * @returns Exported file
   */
  @Post('export')
  async exportProducts(
    @Body() exportOptions: ExportOptions,
    @GetUser() user: any,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    this.logger.log(`Exporting products in ${exportOptions.format} format`);

    try {
      // Ensure tenant ID is set
      exportOptions.tenantId = user.tenantId;

      // Get network quality
      const networkInfo = await this.networkAwareStorage.getNetworkQuality();
      exportOptions.networkInfo = networkInfo;

      // Process export
      const result =
        await this.importExportService.exportProducts(exportOptions);

      // Set response headers
      res.set({
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename=${result.fileName}`,
        'Content-Length': result.fileSize,
      });

      // Return file as streamable response
      return new StreamableFile(
        Buffer.isBuffer(result.data) ? result.data : Buffer.from(result.data),
      );
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Export failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get export template
   *
   * @param format - Export format
   * @param user - Authenticated user
   * @param res - Express response
   * @returns Template file
   */
  @Get('template/:format')
  async getExportTemplate(
    @Param('format') format: ExportFormat,
    @GetUser() user: any,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    this.logger.log(`Generating export template in ${format} format`);

    try {
      // Generate template
      const result = await this.importExportService.generateExportTemplate(
        format,
        user.tenantId,
      );

      // Set response headers
      res.set({
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename=${result.fileName}`,
        'Content-Length': result.fileSize,
      });

      // Return file as streamable response
      return new StreamableFile(
        Buffer.isBuffer(result.data) ? result.data : Buffer.from(result.data),
      );
    } catch (error) {
      this.logger.error(
        `Template generation failed: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Template generation failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get supported export formats
   *
   * @returns List of supported export formats
   */
  @Get('formats')
  getSupportedFormats() {
    return {
      import: ['csv', 'json', 'xml', 'xlsx'],
      export: Object.values(ExportFormat),
    };
  }

  /**
   * Get format from file name
   */
  private getFormatFromFileName(
    fileName: string,
  ): 'csv' | 'json' | 'xml' | 'xlsx' {
    const extension = (fileName.split('.').pop() || '').toLowerCase();

    switch (extension) {
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      default:
        throw new HttpException(
          `Unsupported file format: ${extension}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }
}
