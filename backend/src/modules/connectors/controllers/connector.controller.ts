/**
 * Connector Controller
 * 
 * This controller provides endpoints for managing API connectors,
 * including testing connections, retrieving connector metadata,
 * and performing connector-specific operations.
 */

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Logger
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';
import { ConnectorFactoryService } from '../services/connector-factory.service';
import { ConnectorCredentials, CredentialType } from '../interfaces/types';

/**
 * Controller for connector-related operations
 */
@Controller('connectors')
@UseGuards(FirebaseAuthGuard)
export class ConnectorController {
  private readonly logger = new Logger(ConnectorController.name);

  constructor(private readonly connectorFactory: ConnectorFactoryService) {}

  /**
   * Get a list of all available connectors
   */
  @Get()
  getAvailableConnectors() {
    return {
      connectors: this.connectorFactory.getAvailableConnectors()
    };
  }

  /**
   * Test a connection to an API
   */
  @Post('test')
  async testConnection(@Body() credentials: ConnectorCredentials) {
    const connector = await this.connectorFactory.createConnector(
      credentials.type.toString(), 
      credentials
    );
    
    if (!connector) {
      this.logger.error(`Connector type ${credentials.type} not found`);
      return { success: false, error: 'Connector type not found' };
    }
    
    try {
      const result = await connector.testConnection();
      return { success: true, status: result };
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        details: error.details || error
      };
    }
  }

  /**
   * Get connector health status
   */
  @Get(':id/health')
  async getConnectorHealth(@Param('id') id: string) {
    const connector = await this.getConnectorById(id);
    return connector.getHealthStatus();
  }

  /**
   * Get connector by ID helper method
   */
  private async getConnectorById(id: string) {
    // In a real implementation, we would get the credentials from storage
    // For now, we'll create a placeholder to avoid TypeScript errors
    const credentials: ConnectorCredentials = {
      organizationId: 'test',
      type: CredentialType.API_KEY
    };
    
    const connector = await this.connectorFactory.createConnector(
      credentials.type.toString(),
      credentials
    );
    
    if (!connector) {
      this.logger.error(`Failed to create connector of type ${credentials.type}`);
      throw new Error(`Failed to create connector of type ${credentials.type}`);
    }
    
    return connector;
  }
}