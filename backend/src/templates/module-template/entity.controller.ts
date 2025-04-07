import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  Logger,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { EntityService, CreateEntityDto, UpdateEntityDto } from './entity.service';
import { Entity } from './entity.model';

/**
 * Controller for Entity endpoints
 */
@Controller('api/entities')
export class EntityController {
  private readonly logger = new Logger(EntityController.name);
  
  constructor(private readonly entityService: EntityService) {}
  
  /**
   * Create a new entity
   * @param createEntityDto Entity creation data
   * @returns Created entity
   */
  @Post()
  async create(@Body() createEntityDto: CreateEntityDto): Promise<Entity> {
    return this.entityService.create(createEntityDto);
  }
  
  /**
   * Get entity by ID
   * @param id Entity ID
   * @returns Entity object
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Entity> {
    return this.entityService.findById(id);
  }
  
  /**
   * Get entities by organization
   * @param organizationId Organization ID
   * @returns Array of entities
   */
  @Get()
  async findByOrganization(
    @Query('organizationId') organizationId: string
  ): Promise<Entity[]> {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }
    
    return this.entityService.findByOrganization(organizationId);
  }
  
  /**
   * Update an entity
   * @param id Entity ID
   * @param updateEntityDto Update data
   * @returns Updated entity
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto
  ): Promise<Entity> {
    return this.entityService.update(id, updateEntityDto);
  }
  
  /**
   * Delete an entity
   * @param id Entity ID
   * @returns Success message
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.entityService.delete(id);
    return { success: true };
  }
  
  /**
   * Activate an entity
   * @param id Entity ID
   * @returns Updated entity
   */
  @Put(':id/activate')
  async activate(@Param('id') id: string): Promise<Entity> {
    return this.entityService.setStatus(id, 'active');
  }
  
  /**
   * Deactivate an entity
   * @param id Entity ID
   * @returns Updated entity
   */
  @Put(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<Entity> {
    return this.entityService.setStatus(id, 'inactive');
  }
}