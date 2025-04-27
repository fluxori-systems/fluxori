/**
 * Import/Export Service
 *
 * Service for importing and exporting product data to/from different formats
 * with South African optimization support.
 */

import { Readable } from 'stream';

import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import * as csv from 'csv-parser';
import * as Papa from 'papaparse';

import { CategoryService } from './category.service';
import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { MarketContextService } from './market-context.service';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import { ProductVariantService } from './product-variant.service';
import { ProductService } from './product.service';
import {
  PriceInfo,
  ProductAttribute,
  CategoryReference,
  NetworkQualityInfo,
} from '../interfaces/types';
import { Product, ProductStatus, ProductType } from '../models/product.model';

/**
 * Supported export formats
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  XLSX = 'xlsx',
}

/**
 * Import options
 */
export interface ImportOptions {
  /**
   * File format
   */
  format: 'csv' | 'json' | 'xml' | 'xlsx';

  /**
   * Whether to update existing products
   */
  updateExisting?: boolean;

  /**
   * Whether to ignore errors and continue with valid products
   */
  continueOnError?: boolean;

  /**
   * Field mappings from import file columns to product fields
   */
  fieldMappings?: Record<string, string>;

  /**
   * Default values to apply when fields are missing
   */
  defaultValues?: Record<string, any>;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Operator ID
   */
  operatorId?: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  /**
   * File format to export
   */
  format: ExportFormat;

  /**
   * Filter products by specific criteria
   */
  filters?: Record<string, any>;

  /**
   * Include category data
   */
  includeCategories?: boolean;

  /**
   * Include variants
   */
  includeVariants?: boolean;

  /**
   * Specific fields to include in export (if empty, include all fields)
   */
  includedFields?: string[];

  /**
   * Fields to exclude from export
   */
  excludedFields?: string[];

  /**
   * Network quality information for adaptive exports
   */
  networkInfo?: NetworkQualityInfo;

  /**
   * Tenant ID
   */
  tenantId: string;
}

/**
 * Import result
 */
export interface ImportResult {
  /**
   * Number of successfully imported products
   */
  successCount: number;

  /**
   * Number of failures
   */
  failureCount: number;

  /**
   * List of successfully imported product IDs
   */
  successIds: string[];

  /**
   * Error details for failed imports
   */
  errors: Array<{
    /**
     * Row or record index
     */
    row: number;

    /**
     * Error message
     */
    message: string;

    /**
     * Original data that caused the error
     */
    data?: any;
  }>;

  /**
   * Warning messages
   */
  warnings: string[];

  /**
   * Whether the import completed successfully
   */
  completed: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /**
   * Name of the exported file
   */
  fileName: string;

  /**
   * Content type of the exported file
   */
  contentType: string;

  /**
   * Raw data of the exported file
   */
  data: string | Buffer;

  /**
   * URL to download the file (if stored)
   */
  downloadUrl?: string;

  /**
   * Number of products exported
   */
  productCount: number;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Whether the export was optimized for network conditions
   */
  optimizedForNetwork?: boolean;

  /**
   * Compression details (if compressed)
   */
  compression?: {
    /**
     * Original file size
     */
    originalSize: number;

    /**
     * Compression ratio
     */
    compressionRatio: number;

    /**
     * Compression type used
     */
    compressionType: string;
  };
}

/**
 * Service for product import and export with South African optimizations
 */
@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly variantService: ProductVariantService,
    private readonly networkAwareStorage: NetworkAwareStorageService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly marketContextService: MarketContextService,
    @Inject('PIM_MODULE_OPTIONS') private readonly options: any,
  ) {}

  /**
   * Import products from a file
   *
   * @param fileBuffer - Buffer containing file data
   * @param fileName - Original file name
   * @param options - Import options
   * @returns Import result
   */
  async importProducts(
    fileBuffer: Buffer,
    fileName: string,
    options: ImportOptions,
  ): Promise<ImportResult> {
    this.logger.log(`Starting product import: ${fileName}`);

    // Determine file format based on file extension if not specified
    if (!options.format) {
      options.format = this.detectFileFormat(fileName);
    }

    // Process file based on format
    try {
      // Use load shedding resilience for the import operation
      return await this.loadSheddingService.executeWithResilience(
        () => this.processImportFile(fileBuffer, options),
        'product-import',
        { priority: 'medium' },
      );
    } catch (error) {
      this.logger.error(
        `Error during product import: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }

  /**
   * Export products to a file
   *
   * @param options - Export options
   * @returns Export result
   */
  async exportProducts(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Starting product export in ${options.format} format`);

    try {
      // Check for network quality and use network-aware storage
      let networkInfo = options.networkInfo;

      if (!networkInfo) {
        networkInfo = await this.networkAwareStorage.getNetworkQuality();
      }

      // Use load shedding resilience for the export operation
      return await this.loadSheddingService.executeWithResilience(
        () => this.processExportRequest(options, networkInfo),
        'product-export',
        { priority: 'medium' },
      );
    } catch (error) {
      this.logger.error(
        `Error during product export: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Export failed: ${error.message}`);
    }
  }

  /**
   * Generate export template based on the product schema
   *
   * @param format - Export format
   * @param tenantId - Tenant ID
   * @returns Export template
   */
  async generateExportTemplate(
    format: ExportFormat,
    tenantId: string,
  ): Promise<ExportResult> {
    this.logger.log(`Generating ${format} export template`);

    // Create sample data with headers only
    const headers = this.getProductHeaders();

    switch (format) {
      case ExportFormat.CSV:
        const csvData = Papa.unparse({
          fields: headers,
          data: [],
        });

        return {
          fileName: `product_template.csv`,
          contentType: 'text/csv',
          data: csvData,
          productCount: 0,
          fileSize: Buffer.from(csvData).length,
        };

      case ExportFormat.JSON:
        const jsonTemplate = {};
        headers.forEach((header) => {
          jsonTemplate[header] = '';
        });

        const jsonData = JSON.stringify([jsonTemplate], null, 2);

        return {
          fileName: `product_template.json`,
          contentType: 'application/json',
          data: jsonData,
          productCount: 0,
          fileSize: Buffer.from(jsonData).length,
        };

      case ExportFormat.XML:
        const xmlData = this.generateXmlTemplate(headers);

        return {
          fileName: `product_template.xml`,
          contentType: 'application/xml',
          data: xmlData,
          productCount: 0,
          fileSize: Buffer.from(xmlData).length,
        };

      case ExportFormat.XLSX:
        // For XLSX we'd use a library like exceljs
        // This is a simplified version
        const xlsxData = headers.join('\t');

        return {
          fileName: `product_template.xlsx`,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          data: xlsxData,
          productCount: 0,
          fileSize: Buffer.from(xlsxData).length,
        };

      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * Process import file based on format
   */
  private async processImportFile(
    fileBuffer: Buffer,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      failureCount: 0,
      successIds: [],
      errors: [],
      warnings: [],
      completed: false,
    };

    switch (options.format) {
      case 'csv':
        return this.importFromCsv(fileBuffer, options, result);
      case 'json':
        return this.importFromJson(fileBuffer, options, result);
      case 'xml':
        return this.importFromXml(fileBuffer, options, result);
      case 'xlsx':
        return this.importFromXlsx(fileBuffer, options, result);
      default:
        throw new BadRequestException(
          `Unsupported import format: ${options.format}`,
        );
    }
  }

  /**
   * Import products from CSV format
   */
  private async importFromCsv(
    fileBuffer: Buffer,
    options: ImportOptions,
    result: ImportResult,
  ): Promise<ImportResult> {
    const products: Array<Partial<Product>> = [];
    const errors: Array<{ row: number; message: string; data?: any }> = [];

    // Create readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);

    // Parse CSV
    return new Promise((resolve, reject) => {
      let rowIndex = 0;

      readableStream
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;

          try {
            // Map CSV row to product data
            const product = this.mapRowToProduct(
              row,
              options.fieldMappings,
              options.defaultValues,
            );
            products.push(product);
          } catch (error) {
            errors.push({
              row: rowIndex,
              message: error.message,
              data: row,
            });

            if (!options.continueOnError) {
              reject(new Error(`Error at row ${rowIndex}: ${error.message}`));
            }
          }
        })
        .on('end', async () => {
          // Process parsed products
          for (const product of products) {
            try {
              // Check if product exists (by SKU)
              const existingProduct = product.sku
                ? await this.productService.findBySku(
                    product.sku,
                    options.tenantId,
                  )
                : null;

              if (existingProduct && options.updateExisting) {
                // Update existing product
                const updated = await this.productService.update(
                  existingProduct.id,
                  product as any,
                  options.tenantId,
                );

                result.successCount++;
                result.successIds.push(updated.id);
              } else if (!existingProduct) {
                // Create new product
                const created = await this.productService.create(
                  product as any,
                  options.tenantId,
                );

                result.successCount++;
                result.successIds.push(created.id);
              } else {
                // Product exists but updateExisting is false
                result.warnings.push(
                  `Skipped product with SKU ${product.sku} as it already exists`,
                );
              }
            } catch (error) {
              result.failureCount++;
              result.errors.push({
                row: 0, // We don't have the original row number here
                message: error.message,
                data: product,
              });

              if (!options.continueOnError) {
                reject(error);
                return;
              }
            }
          }

          // Add any parsing errors to the result
          result.errors.push(...errors);
          result.failureCount += errors.length;
          result.completed = true;

          resolve(result);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Import products from JSON format
   */
  private async importFromJson(
    fileBuffer: Buffer,
    options: ImportOptions,
    result: ImportResult,
  ): Promise<ImportResult> {
    try {
      // Parse JSON data
      const jsonData = JSON.parse(fileBuffer.toString());

      if (!Array.isArray(jsonData)) {
        throw new BadRequestException(
          'JSON import must be an array of products',
        );
      }

      // Process each product
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const productData = jsonData[i];

          // Map JSON to product
          const product = this.mapJsonToProduct(
            productData,
            options.fieldMappings,
            options.defaultValues,
          );

          // Check if product exists (by SKU)
          const existingProduct = product.sku
            ? await this.productService.findBySku(product.sku, options.tenantId)
            : null;

          if (existingProduct && options.updateExisting) {
            // Update existing product
            const updated = await this.productService.update(
              existingProduct.id,
              product as any,
              options.tenantId,
            );

            result.successCount++;
            result.successIds.push(updated.id);
          } else if (!existingProduct) {
            // Create new product
            const created = await this.productService.create(
              product as any,
              options.tenantId,
            );

            result.successCount++;
            result.successIds.push(created.id);
          } else {
            // Product exists but updateExisting is false
            result.warnings.push(
              `Skipped product with SKU ${product.sku} as it already exists`,
            );
          }
        } catch (error) {
          result.failureCount++;
          result.errors.push({
            row: i + 1,
            message: error.message,
            data: jsonData[i],
          });

          if (!options.continueOnError) {
            throw error;
          }
        }
      }

      result.completed = true;
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Import products from XML format
   */
  private async importFromXml(
    fileBuffer: Buffer,
    options: ImportOptions,
    result: ImportResult,
  ): Promise<ImportResult> {
    // For a real implementation, you would use an XML parsing library like xml2js
    // This is a placeholder
    result.warnings.push('XML import is not fully implemented yet');
    result.completed = true;
    return result;
  }

  /**
   * Import products from XLSX format
   */
  private async importFromXlsx(
    fileBuffer: Buffer,
    options: ImportOptions,
    result: ImportResult,
  ): Promise<ImportResult> {
    // For a real implementation, you would use a library like exceljs
    // This is a placeholder
    result.warnings.push('XLSX import is not fully implemented yet');
    result.completed = true;
    return result;
  }

  /**
   * Process export request based on format
   */
  private async processExportRequest(
    options: ExportOptions,
    networkInfo: NetworkQualityInfo,
  ): Promise<ExportResult> {
    // Fetch products based on filters
    const products = await this.getProductsForExport(options);

    // Include variants if requested
    if (options.includeVariants) {
      await this.includeVariantsForProducts(products, options.tenantId);
    }

    // Include category details if requested
    if (options.includeCategories) {
      await this.includeCategoryDetailsForProducts(products, options.tenantId);
    }

    // Filter product fields based on included/excluded fields
    const filteredProducts = this.filterProductFields(
      products,
      options.includedFields,
      options.excludedFields,
    );

    // Generate export based on format
    const exportResult = await this.generateExport(
      filteredProducts,
      options.format,
      networkInfo,
    );

    return exportResult;
  }

  /**
   * Generate export based on format
   */
  private async generateExport(
    products: any[],
    format: ExportFormat,
    networkInfo: NetworkQualityInfo,
  ): Promise<ExportResult> {
    // Track whether we needed to optimize for network conditions
    let optimizedForNetwork = false;
    let originalSize = 0;
    let compressedSize = 0;
    let compressionType = '';

    // Basic export result
    const result: ExportResult = {
      fileName: `products_export_${new Date().toISOString().slice(0, 10)}`,
      contentType: '',
      data: '',
      productCount: products.length,
      fileSize: 0,
      optimizedForNetwork: false,
    };

    switch (format) {
      case ExportFormat.CSV:
        result.fileName += '.csv';
        result.contentType = 'text/csv';
        result.data = Papa.unparse(products);
        break;

      case ExportFormat.JSON:
        result.fileName += '.json';
        result.contentType = 'application/json';
        result.data = JSON.stringify(products, null, 2);
        break;

      case ExportFormat.XML:
        result.fileName += '.xml';
        result.contentType = 'application/xml';
        result.data = this.convertProductsToXml(products);
        break;

      case ExportFormat.XLSX:
        result.fileName += '.xlsx';
        result.contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        // This would use a library like exceljs in a real implementation
        result.data = 'XLSX export not fully implemented';
        break;

      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }

    // Calculate file size
    originalSize =
      typeof result.data === 'string'
        ? Buffer.from(result.data).length
        : result.data.length;

    result.fileSize = originalSize;

    // Check if we need to optimize for network conditions
    if (networkInfo.connectionQuality !== 'high' && originalSize > 50000) {
      // 50KB threshold
      optimizedForNetwork = true;

      // Optimize based on connection quality
      if (networkInfo.connectionQuality === 'low') {
        // For low quality connections, compress or optimize more aggressively
        // Here we'd implement compression, e.g., with gzip

        // Simulation of compression
        compressionType = 'gzip';
        compressedSize = Math.floor(originalSize * 0.3); // Assume 70% compression

        result.fileSize = compressedSize;
        result.optimizedForNetwork = true;
        result.compression = {
          originalSize,
          compressionRatio: compressedSize / originalSize,
          compressionType,
        };
      } else if (networkInfo.connectionQuality === 'medium') {
        // For medium quality, do less aggressive optimization
        compressionType = 'basic';
        compressedSize = Math.floor(originalSize * 0.6); // Assume 40% compression

        result.fileSize = compressedSize;
        result.optimizedForNetwork = true;
        result.compression = {
          originalSize,
          compressionRatio: compressedSize / originalSize,
          compressionType,
        };
      }
    }

    return result;
  }

  /**
   * Get products for export based on filters
   */
  private async getProductsForExport(
    options: ExportOptions,
  ): Promise<Product[]> {
    const { filters, tenantId } = options;

    // Convert filters to a format understood by the product service
    const productFilters = filters || {};

    // Call product service with filters
    const products = await this.productService.findAll(
      productFilters,
      tenantId,
    );

    return products;
  }

  /**
   * Include variant data for products
   */
  private async includeVariantsForProducts(
    products: Product[],
    tenantId: string,
  ): Promise<void> {
    for (const product of products) {
      if (product.type === ProductType.SIMPLE) {
        const variants = await this.variantService.findByParentId(
          product.id,
          tenantId,
        );

        if (variants && variants.length > 0) {
          (product as any).variants = variants;
        }
      }
    }
  }

  /**
   * Include detailed category information for products
   */
  private async includeCategoryDetailsForProducts(
    products: Product[],
    tenantId: string,
  ): Promise<void> {
    // Collect all category IDs from products
    const categoryIds = new Set<string>();

    for (const product of products) {
      for (const category of product.categories) {
        categoryIds.add(category.id);
      }
    }

    // Fetch all categories in a single call
    const categories = await this.categoryService.findByIds(
      Array.from(categoryIds),
      tenantId,
    );

    // Create a lookup map
    const categoryMap = new Map();
    categories.forEach((category) => {
      categoryMap.set(category.id, category);
    });

    // Enhance products with full category data
    for (const product of products) {
      const enhancedCategories = product.categories.map((catRef) => {
        const fullCategory = categoryMap.get(catRef.id);
        return {
          ...catRef,
          path: fullCategory?.path || '',
          parentId: fullCategory?.parentId || null,
          level: fullCategory?.level || 0,
        };
      });

      (product as any).categoriesDetail = enhancedCategories;
    }
  }

  /**
   * Filter product fields based on included/excluded fields
   */
  private filterProductFields(
    products: any[],
    includedFields?: string[],
    excludedFields?: string[],
  ): any[] {
    if (!includedFields?.length && !excludedFields?.length) {
      return products;
    }

    return products.map((product) => {
      const filteredProduct = {};

      if (includedFields?.length) {
        // Only include specified fields
        includedFields.forEach((field) => {
          if (product[field] !== undefined) {
            filteredProduct[field] = product[field];
          }
        });

        return filteredProduct;
      } else if (excludedFields?.length) {
        // Include all except excluded fields
        Object.keys(product).forEach((key) => {
          if (!excludedFields.includes(key)) {
            filteredProduct[key] = product[key];
          }
        });

        return filteredProduct;
      }

      return product;
    });
  }

  /**
   * Map a CSV row to a product object
   */
  private mapRowToProduct(
    row: Record<string, string>,
    fieldMappings?: Record<string, string>,
    defaultValues?: Record<string, any>,
  ): Partial<Product> {
    const product: Partial<Product> = {
      ...defaultValues,
      attributes: [],
    };

    // Apply field mappings if provided, otherwise use direct mapping
    const mappings = fieldMappings || {};

    // Process each column in the row
    Object.entries(row).forEach(([columnName, value]) => {
      // Get the target field name using mappings or original column name
      const fieldName = mappings[columnName] || columnName;

      // Handle nested fields (e.g., 'pricing.basePrice')
      if (fieldName.includes('.')) {
        const [parentField, childField] = fieldName.split('.');

        // Initialize parent object if needed
        product[parentField] = product[parentField] || {};

        // Set the value in the nested field
        product[parentField][childField] = this.parseFieldValue(
          value,
          childField,
        );
      }
      // Special handling for categories
      else if (fieldName === 'categories') {
        if (value) {
          product.categories = this.parseCategoryList(value);
        }
      }
      // Special handling for attributes
      else if (fieldName.startsWith('attribute_')) {
        const attrCode = fieldName.replace('attribute_', '');

        if (value) {
          product.attributes.push({
            code: attrCode,
            label: attrCode.replace('_', ' '), // Basic label generation
            type: 'text', // Default type
            value: value,
          });
        }
      }
      // Direct field mapping
      else {
        product[fieldName] = this.parseFieldValue(value, fieldName);
      }
    });

    // Apply default values for missing required fields
    this.applyDefaultValues(product, defaultValues);

    // Validate required fields
    this.validateRequiredFields(product);

    return product;
  }

  /**
   * Map a JSON object to a product
   */
  private mapJsonToProduct(
    data: Record<string, any>,
    fieldMappings?: Record<string, string>,
    defaultValues?: Record<string, any>,
  ): Partial<Product> {
    // Start with default values
    const product: Partial<Product> = {
      ...defaultValues,
    };

    // Apply field mappings if provided, otherwise use direct mapping
    const mappings = fieldMappings || {};

    // Process each field in the data
    Object.entries(data).forEach(([fieldName, value]) => {
      // Get the target field name using mappings or original field name
      const targetField = mappings[fieldName] || fieldName;

      // Set the value in the product
      product[targetField] = value;
    });

    // Apply default values for missing required fields
    this.applyDefaultValues(product, defaultValues);

    // Validate required fields
    this.validateRequiredFields(product);

    return product;
  }

  /**
   * Parse a field value based on expected type
   */
  private parseFieldValue(value: string, fieldName: string): any {
    if (!value || value.trim() === '') {
      return null;
    }

    // Parse numbers
    if (
      fieldName === 'basePrice' ||
      fieldName === 'specialPrice' ||
      fieldName === 'costPrice' ||
      fieldName === 'rrp' ||
      fieldName === 'weight' ||
      fieldName.includes('price')
    ) {
      return parseFloat(value);
    }

    // Parse booleans
    if (
      fieldName === 'featured' ||
      fieldName === 'inStock' ||
      fieldName === 'manageStock' ||
      fieldName === 'vatIncluded' ||
      fieldName.includes('Approved') ||
      fieldName.includes('Compliant')
    ) {
      return (
        value.toLowerCase() === 'true' ||
        value === '1' ||
        value.toLowerCase() === 'yes'
      );
    }

    // Parse dates
    if (fieldName.includes('Date') || fieldName.includes('At')) {
      try {
        return new Date(value);
      } catch (e) {
        return null;
      }
    }

    // Parse dimensions array
    if (fieldName === 'dimensions') {
      try {
        return value.split('x').map(Number);
      } catch (e) {
        return null;
      }
    }

    // Return string value
    return value;
  }

  /**
   * Parse a comma-separated category list into category references
   */
  private parseCategoryList(categoriesString: string): CategoryReference[] {
    return categoriesString.split(',').map((cat, index) => {
      const parts = cat.trim().split(':');

      return {
        id: parts[0],
        name: parts[1] || parts[0],
        isPrimary: index === 0,
      };
    });
  }

  /**
   * Apply default values for missing fields
   */
  private applyDefaultValues(
    product: Partial<Product>,
    defaultValues?: Record<string, any>,
  ): void {
    if (!defaultValues) return;

    // Apply default values only for fields that are undefined
    Object.entries(defaultValues).forEach(([key, value]) => {
      if (product[key] === undefined) {
        product[key] = value;
      }
    });
  }

  /**
   * Validate required fields in a product
   */
  private validateRequiredFields(product: Partial<Product>): void {
    if (!product.sku) {
      throw new Error('SKU is required');
    }

    if (!product.name) {
      throw new Error('Product name is required');
    }

    // Validate product status
    if (
      product.status &&
      !Object.values(ProductStatus).includes(product.status)
    ) {
      throw new Error(`Invalid product status: ${product.status}`);
    }

    // Validate product type
    if (product.type && !Object.values(ProductType).includes(product.type)) {
      throw new Error(`Invalid product type: ${product.type}`);
    }
  }

  /**
   * Detect file format from file name
   */
  private detectFileFormat(fileName: string): 'csv' | 'json' | 'xml' | 'xlsx' {
    const extension = fileName.split('.').pop().toLowerCase();

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
        throw new BadRequestException(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * Convert products to XML format
   */
  private convertProductsToXml(products: any[]): string {
    // Simple XML conversion (in a real implementation, you would use a library)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n';

    for (const product of products) {
      xml += '  <product>\n';

      // Convert each product field to XML
      Object.entries(product).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (typeof value === 'object' && !Array.isArray(value)) {
          // Handle nested objects
          xml += `    <${key}>\n`;
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            xml += `      <${nestedKey}>${nestedValue}</${nestedKey}>\n`;
          });
          xml += `    </${key}>\n`;
        } else if (Array.isArray(value)) {
          // Handle arrays
          xml += `    <${key}>\n`;
          value.forEach((item) => {
            if (typeof item === 'object') {
              xml += '      <item>\n';
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                xml += `        <${itemKey}>${itemValue}</${itemKey}>\n`;
              });
              xml += '      </item>\n';
            } else {
              xml += `      <item>${item}</item>\n`;
            }
          });
          xml += `    </${key}>\n`;
        } else {
          // Handle simple values
          xml += `    <${key}>${value}</${key}>\n`;
        }
      });

      xml += '  </product>\n';
    }

    xml += '</products>';
    return xml;
  }

  /**
   * Generate XML template for export
   */
  private generateXmlTemplate(headers: string[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n';
    xml += '  <product>\n';

    for (const header of headers) {
      xml += `    <${header}></${header}>\n`;
    }

    xml += '  </product>\n</products>';
    return xml;
  }

  /**
   * Get standard product headers for exports
   */
  private getProductHeaders(): string[] {
    return [
      'sku',
      'name',
      'description',
      'shortDescription',
      'status',
      'type',
      'pricing.basePrice',
      'pricing.vatIncluded',
      'pricing.currency',
      'pricing.specialPrice',
      'pricing.costPrice',
      'pricing.rrp',
      'weight',
      'dimensions',
      'categories',
      'stock.inStock',
      'stock.quantity',
      'stock.manageStock',
      'featured',
      'attribute_color',
      'attribute_size',
      'attribute_brand',
      'attribute_material',
      'regional.southAfrica.icasaApproved',
      'regional.southAfrica.sabsApproved',
      'regional.southAfrica.nrcsApproved',
    ];
  }
}
