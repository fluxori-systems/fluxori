import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import { AttributeTemplateService } from "../services/attribute-template.service";
import {
  AttributeTemplate,
  CreateAttributeTemplateDto,
  UpdateAttributeTemplateDto,
  AttributeScope,
} from "../models/attribute-template.model";
import { OperationResult } from "../interfaces/types";
import { User } from "../../../types/google-cloud.types";

/**
 * Attribute Template Controller
 *
 * Controller for managing attribute templates in the PIM module
 */
@Controller("pim/attribute-templates")
@UseGuards(FirebaseAuthGuard)
export class AttributeTemplateController {
  constructor(
    private readonly attributeTemplateService: AttributeTemplateService,
  ) {}

  /**
   * Get an attribute template by ID
   *
   * @param id Attribute template ID
   * @param user Authenticated user
   * @returns Attribute template
   */
  @Get(":id")
  async getAttributeTemplateById(
    @Param("id") id: string,
    @GetUser() user: User,
  ): Promise<AttributeTemplate> {
    const organizationId = user.organizationId;
    const attributeTemplate =
      await this.attributeTemplateService.getAttributeTemplateById(
        id,
        organizationId,
      );

    if (!attributeTemplate) {
      throw new HttpException(
        "Attribute template not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return attributeTemplate;
  }

  /**
   * Get all attribute templates for an organization
   *
   * @param page Page number
   * @param limit Items per page
   * @param sortBy Field to sort by
   * @param sortDirection Sort direction
   * @param user Authenticated user
   * @returns Attribute templates with pagination
   */
  @Get()
  async getAllAttributeTemplates(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("sortBy") sortBy: string = "createdAt",
    @Query("sortDirection") sortDirection: "asc" | "desc" = "desc",
    @GetUser() user: User,
  ): Promise<{
    items: AttributeTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = user.organizationId;

    return await this.attributeTemplateService.getAllAttributeTemplates(
      organizationId,
      {
        pagination: {
          page,
          pageSize: limit,
        },
        orderBy: [
          {
            field: sortBy,
            direction: sortDirection,
          },
        ],
      },
    );
  }

  /**
   * Create a new attribute template
   *
   * @param createAttributeTemplateDto Attribute template creation DTO
   * @param user Authenticated user
   * @returns Created attribute template
   */
  @Post()
  async createAttributeTemplate(
    @Body() createAttributeTemplateDto: CreateAttributeTemplateDto,
    @GetUser() user: User,
  ): Promise<AttributeTemplate> {
    // Ensure organizationId is set
    createAttributeTemplateDto.organizationId = user.organizationId;

    return await this.attributeTemplateService.createAttributeTemplate(
      createAttributeTemplateDto,
    );
  }

  /**
   * Update an existing attribute template
   *
   * @param id Attribute template ID
   * @param updateAttributeTemplateDto Attribute template update DTO
   * @param user Authenticated user
   * @returns Updated attribute template
   */
  @Put(":id")
  async updateAttributeTemplate(
    @Param("id") id: string,
    @Body() updateAttributeTemplateDto: UpdateAttributeTemplateDto,
    @GetUser() user: User,
  ): Promise<AttributeTemplate> {
    const organizationId = user.organizationId;

    // Ensure user can only update their organization's attribute templates
    updateAttributeTemplateDto.organizationId = organizationId;

    const attributeTemplate =
      await this.attributeTemplateService.getAttributeTemplateById(
        id,
        organizationId,
      );
    if (!attributeTemplate) {
      throw new HttpException(
        "Attribute template not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.attributeTemplateService.updateAttributeTemplate(
      id,
      updateAttributeTemplateDto,
    );
  }

  /**
   * Delete an attribute template
   *
   * @param id Attribute template ID
   * @param user Authenticated user
   */
  @Delete(":id")
  async deleteAttributeTemplate(
    @Param("id") id: string,
    @GetUser() user: User,
  ): Promise<void> {
    const organizationId = user.organizationId;

    const attributeTemplate =
      await this.attributeTemplateService.getAttributeTemplateById(
        id,
        organizationId,
      );
    if (!attributeTemplate) {
      throw new HttpException(
        "Attribute template not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.attributeTemplateService.deleteAttributeTemplate(id);
  }

  /**
   * Get attribute templates by category
   *
   * @param categoryId Category ID
   * @param user Authenticated user
   * @returns Attribute templates for the category
   */
  @Get("by-category/:categoryId")
  async getAttributeTemplatesByCategory(
    @Param("categoryId") categoryId: string,
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;
    return await this.attributeTemplateService.getAttributeTemplatesByCategory(
      organizationId,
      categoryId,
    );
  }

  /**
   * Get global attribute templates
   *
   * @param user Authenticated user
   * @returns Global attribute templates
   */
  @Get("global")
  async getGlobalAttributeTemplates(
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;
    return await this.attributeTemplateService.getGlobalAttributeTemplates(
      organizationId,
    );
  }

  /**
   * Get attribute templates by region
   *
   * @param region Region (e.g., 'south-africa', 'europe')
   * @param user Authenticated user
   * @returns Regional attribute templates
   */
  @Get("by-region/:region")
  async getAttributeTemplatesByRegion(
    @Param("region") region: string,
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;
    return await this.attributeTemplateService.getAttributeTemplatesByRegion(
      organizationId,
      region,
    );
  }

  /**
   * Get attribute templates by marketplace
   *
   * @param marketplaceId Marketplace ID
   * @param user Authenticated user
   * @returns Marketplace attribute templates
   */
  @Get("by-marketplace/:marketplaceId")
  async getAttributeTemplatesByMarketplace(
    @Param("marketplaceId") marketplaceId: string,
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;
    return await this.attributeTemplateService.getAttributeTemplatesByMarketplace(
      organizationId,
      marketplaceId,
    );
  }

  /**
   * Get attribute templates by scope
   *
   * @param scope Attribute scope
   * @param page Page number
   * @param limit Items per page
   * @param user Authenticated user
   * @returns Attribute templates with the given scope
   */
  @Get("by-scope/:scope")
  async getAttributeTemplatesByScope(
    @Param("scope") scope: AttributeScope,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;

    // Validate scope
    if (!Object.values(AttributeScope).includes(scope)) {
      throw new HttpException("Invalid scope", HttpStatus.BAD_REQUEST);
    }

    return await this.attributeTemplateService.getAttributeTemplatesByScope(
      organizationId,
      scope,
      {
        pagination: {
          page,
          pageSize: limit,
        },
      },
    );
  }

  /**
   * Get applicable attribute templates for a product
   *
   * @param categoryIds Category IDs that the product belongs to
   * @param region Region for regional templates
   * @param marketplaceIds Marketplace IDs for marketplace templates
   * @param user Authenticated user
   * @returns Applicable attribute templates
   */
  @Get("applicable")
  async getApplicableAttributeTemplates(
    @Query("categoryIds") categoryIdsParam: string,
    @Query("region") region: string,
    @Query("marketplaceIds") marketplaceIdsParam: string,
    @GetUser() user: User,
  ): Promise<AttributeTemplate[]> {
    const organizationId = user.organizationId;

    // Parse category IDs and marketplace IDs
    const categoryIds = categoryIdsParam ? categoryIdsParam.split(",") : [];
    const marketplaceIds = marketplaceIdsParam
      ? marketplaceIdsParam.split(",")
      : [];

    return await this.attributeTemplateService.getApplicableAttributeTemplates(
      organizationId,
      categoryIds,
      region,
      marketplaceIds,
    );
  }

  /**
   * Bulk update attribute templates
   *
   * @param operations Array of update operations
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post("bulk-update")
  async bulkUpdateAttributeTemplates(
    @Body()
    operations: Array<{ id: string; updates: UpdateAttributeTemplateDto }>,
    @GetUser() user: User,
  ): Promise<Array<OperationResult<AttributeTemplate>>> {
    const organizationId = user.organizationId;

    // Enforce organization ID for security
    operations = operations.map((op) => ({
      ...op,
      updates: {
        ...op.updates,
        organizationId,
      },
    }));

    return await this.attributeTemplateService.bulkUpdateAttributeTemplates(
      operations,
    );
  }

  /**
   * Bulk delete attribute templates
   *
   * @param templateIds Array of attribute template IDs to delete
   * @param user Authenticated user
   * @returns Operation results
   */
  @Post("bulk-delete")
  async bulkDeleteAttributeTemplates(
    @Body() body: { templateIds: string[] },
    @GetUser() user: User,
  ): Promise<Array<OperationResult>> {
    const organizationId = user.organizationId;
    return await this.attributeTemplateService.bulkDeleteAttributeTemplates(
      organizationId,
      body.templateIds,
    );
  }
}
