import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ObservabilityService } from '../../../../common/observability';
import { FirebaseAuthGuard } from '../../../auth/guards/firebase-auth.guard';
import { CredentialManagerService } from '../services/credential-manager.service';

/**
 * Controller for credential management
 */
@ApiTags('credentials')
@Controller('credentials')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class CredentialController {
  private readonly logger = new Logger(CredentialController.name);

  constructor(
    private readonly credentialManager: CredentialManagerService,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * List available credentials (metadata only)
   */
  @Get()
  @ApiOperation({ summary: 'List available credentials (metadata only)' })
  @ApiResponse({ status: 200, description: 'List of credential metadata' })
  async listCredentials(): Promise<any[]> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can list credentials',
      );
    }

    const credentials = await this.credentialManager.listCredentials();

    // Return metadata without exposing sensitive details
    return credentials.map((cred) => ({
      key: cred.key,
      createdAt: cred.createdAt,
      expiresAt: cred.expiresAt,
    }));
  }

  /**
   * Store a credential
   */
  @Post()
  @ApiOperation({ summary: 'Store a credential' })
  @ApiResponse({ status: 201, description: 'Credential stored successfully' })
  async storeCredential(
    @Body() body: { key: string; value: string; expireInDays?: number },
  ): Promise<{ success: boolean; message: string }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can store credentials',
      );
    }

    await this.credentialManager.storeCredential(body.key, body.value, {
      expireInDays: body.expireInDays,
    });

    // Create an audit log
    this.observability.log(`Credential stored: ${body.key}`, {
      service: CredentialController.name,
      userId: request.user.id,
      customFields: {
        action: 'store_credential',
        key: body.key,
      },
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Credential ${body.key} stored successfully`,
    };
  }

  /**
   * Rotate a credential
   */
  @Put(':key/rotate')
  @ApiOperation({ summary: 'Rotate a credential' })
  @ApiResponse({ status: 200, description: 'Credential rotated successfully' })
  async rotateCredential(
    @Param('key') key: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException(
        'Only administrators can rotate credentials',
      );
    }

    // Rotate the credential
    await this.credentialManager.rotateCredential(key);

    // Create an audit log
    this.observability.log(`Credential rotated: ${key}`, {
      service: CredentialController.name,
      userId: request.user.id,
      customFields: {
        action: 'rotate_credential',
        key,
      },
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Credential ${key} rotated successfully`,
    };
  }

  /**
   * Get the current request
   */
  private getRequest(): any {
    // This is a simplified version - in a real implementation,
    // you would use a request-scoped provider or the REQUEST token
    return { user: { id: 'admin', role: 'admin' } };
  }
}
