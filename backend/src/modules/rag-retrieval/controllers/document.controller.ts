import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ForbiddenException,
} from "@nestjs/common";

import { DocumentStatus, DocumentType } from "../interfaces/types";
import { Document } from "../models/document.schema";
import {
  DocumentService,
  CreateDocumentDto,
  UpdateDocumentDto,
} from "../services/document.service";

/**
 * Controller for Document endpoints
 */
@Controller("api/documents")
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  /**
   * Create a new document
   * @param createDocumentDto Document creation data
   * @returns Created document
   */
  @Post()
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    return this.documentService.createDocument(createDocumentDto);
  }

  /**
   * Get document by ID
   * @param id Document ID
   * @returns Document data
   */
  @Get(":id")
  async findById(@Param("id") id: string): Promise<Document> {
    return this.documentService.findById(id);
  }

  /**
   * Query documents with filters
   * @param organizationId Organization ID
   * @param documentType Document type
   * @param status Document status
   * @param isIndexed Is indexed flag
   * @param isPublic Is public flag
   * @param tags Array of tags
   * @param limit Maximum number to return
   * @param offset Pagination offset
   * @returns Array of documents
   */
  @Get()
  async findWithFilters(
    @Query("organizationId") organizationId: string,
    @Query("documentType") documentType?: DocumentType,
    @Query("status") status?: DocumentStatus,
    @Query("isIndexed") isIndexed?: boolean,
    @Query("isPublic") isPublic?: boolean,
    @Query("tags") tags?: string, // Comma-separated tags
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ): Promise<Document[]> {
    if (!organizationId) {
      throw new ForbiddenException("Organization ID is required");
    }

    // Parse boolean parameters
    const parsedIsIndexed =
      isIndexed !== undefined
        ? String(isIndexed).toLowerCase() === "true"
        : undefined;
    const parsedIsPublic =
      isPublic !== undefined
        ? String(isPublic).toLowerCase() === "true"
        : undefined;

    // Parse tags
    const parsedTags = tags
      ? tags.split(",").map((tag) => tag.trim())
      : undefined;

    // Parse numeric parameters
    const parsedLimit = limit ? parseInt(limit.toString(), 10) : undefined;
    const parsedOffset = offset ? parseInt(offset.toString(), 10) : undefined;

    return this.documentService.findWithFilters({
      organizationId,
      documentType,
      status,
      isIndexed: parsedIsIndexed,
      isPublic: parsedIsPublic,
      tags: parsedTags,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  }

  /**
   * Update a document
   * @param id Document ID
   * @param updateDocumentDto Update data
   * @returns Updated document
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }

  /**
   * Update document status
   * @param id Document ID
   * @param status Status in request body
   * @param error Error message in request body
   * @returns Updated document
   */
  @Put(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: DocumentStatus,
    @Body("error") error?: string,
  ): Promise<Document> {
    if (!status) {
      throw new ForbiddenException("Status is required");
    }

    return this.documentService.updateStatus(id, status, error);
  }

  /**
   * Mark document as indexed
   * @param id Document ID
   * @param chunkCount Chunk count in request body
   * @param tokenCount Token count in request body
   * @returns Updated document
   */
  @Put(":id/indexed")
  async markAsIndexed(
    @Param("id") id: string,
    @Body("chunkCount") chunkCount: number,
    @Body("tokenCount") tokenCount: number,
  ): Promise<Document> {
    if (chunkCount === undefined || tokenCount === undefined) {
      throw new ForbiddenException("Chunk count and token count are required");
    }

    return this.documentService.markAsIndexed(id, chunkCount, tokenCount);
  }

  /**
   * Delete a document
   * @param id Document ID
   * @returns Success indicator
   */
  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ success: boolean }> {
    await this.documentService.deleteDocument(id);
    return { success: true };
  }

  /**
   * Get documents that need indexing
   * @param organizationId Organization ID
   * @param limit Maximum number to return
   * @returns Array of pending documents
   */
  @Get("organization/:organizationId/pending")
  async getPendingIndexing(
    @Param("organizationId") organizationId: string,
    @Query("limit") limit?: number,
  ): Promise<Document[]> {
    const parsedLimit = limit ? parseInt(limit.toString(), 10) : 10;
    return this.documentService.findPendingIndexing(
      organizationId,
      parsedLimit,
    );
  }

  /**
   * Get document counts by status
   * @param organizationId Organization ID
   * @returns Counts by status
   */
  @Get("organization/:organizationId/counts")
  async getDocumentCounts(
    @Param("organizationId") organizationId: string,
  ): Promise<Record<DocumentStatus, number>> {
    return this.documentService.getDocumentCounts(organizationId);
  }
}
