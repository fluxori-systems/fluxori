import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SecurityService } from '../services/security.service';
import { VpcServiceControlsService } from '../services/vpc-service-controls.service';
import { CloudArmorService } from '../services/cloud-armor.service';
import { SecurityMetricsService } from '../services/security-metrics.service';
import { SecurityHealthIndicator } from '../health/security-health.indicator';
import { ObservabilityService } from '../../../common/observability';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';

/**
 * Controller for security-related endpoints
 */
@ApiTags('security')
@Controller('security')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly securityService: SecurityService,
    private readonly vpcServiceControls: VpcServiceControlsService,
    private readonly cloudArmor: CloudArmorService,
    private readonly securityMetrics: SecurityMetricsService,
    private readonly securityHealth: SecurityHealthIndicator,
    private readonly observability: ObservabilityService,
  ) {}
  
  /**
   * Get security health status
   */
  @Get('health')
  @ApiOperation({ summary: 'Get security health status' })
  @ApiResponse({ status: 200, description: 'Security health status' })
  async getSecurityHealth(): Promise<any> {
    return this.securityHealth.checkSecurityComponents();
  }
  
  /**
   * Get security metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get security metrics' })
  @ApiResponse({ status: 200, description: 'Security metrics' })
  async getSecurityMetrics(): Promise<any> {
    return this.securityMetrics.collectSecurityMetrics();
  }
  
  /**
   * Emergency block an IP address
   */
  @Post('block-ip')
  @ApiOperation({ summary: 'Emergency block an IP address' })
  @ApiResponse({ status: 200, description: 'IP address blocked' })
  async emergencyBlockIp(
    @Body() body: { ipAddress: string; reason: string; durationHours?: number }
  ): Promise<{ success: boolean; message: string }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException('Only administrators can block IP addresses');
    }
    
    await this.cloudArmor.emergencyBlockIp(
      body.ipAddress,
      body.reason,
      body.durationHours
    );
    
    return {
      success: true,
      message: `IP address ${body.ipAddress} blocked for ${body.durationHours || 24} hours`,
    };
  }
  
  /**
   * Grant emergency access to VPC Service Controls
   */
  @Post('emergency-access')
  @ApiOperation({ summary: 'Grant emergency access to VPC Service Controls' })
  @ApiResponse({ status: 200, description: 'Emergency access granted' })
  async grantEmergencyAccess(
    @Body() body: { email: string; reason: string; durationHours: number }
  ): Promise<{ success: boolean; message: string }> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException('Only administrators can grant emergency access');
    }
    
    await this.vpcServiceControls.grantEmergencyAccess(
      body.email,
      body.durationHours,
      body.reason
    );
    
    return {
      success: true,
      message: `Emergency access granted to ${body.email} for ${body.durationHours} hours`,
    };
  }
  
  /**
   * Get VPC Service Controls status
   */
  @Get('vpc-service-controls/status')
  @ApiOperation({ summary: 'Get VPC Service Controls status' })
  @ApiResponse({ status: 200, description: 'VPC Service Controls status' })
  async getVpcServiceControlsStatus(): Promise<any> {
    return this.vpcServiceControls.getServiceControlsStatus();
  }
  
  /**
   * Test VPC Service Controls configuration
   */
  @Get('vpc-service-controls/test')
  @ApiOperation({ summary: 'Test VPC Service Controls configuration' })
  @ApiResponse({ status: 200, description: 'VPC Service Controls test results' })
  async testVpcServiceControls(): Promise<any> {
    return this.vpcServiceControls.testServiceControls();
  }
  
  /**
   * Get Cloud Armor security policy metrics
   */
  @Get('cloud-armor/metrics')
  @ApiOperation({ summary: 'Get Cloud Armor security policy metrics' })
  @ApiResponse({ status: 200, description: 'Cloud Armor security policy metrics' })
  async getCloudArmorMetrics(): Promise<any> {
    return this.cloudArmor.getSecurityPolicyMetrics();
  }
  
  /**
   * Get Cloud Armor security policy rules
   */
  @Get('cloud-armor/rules')
  @ApiOperation({ summary: 'Get Cloud Armor security policy rules' })
  @ApiResponse({ status: 200, description: 'Cloud Armor security policy rules' })
  async getCloudArmorRules(): Promise<any> {
    // Check if the user has admin role
    const request = this.getRequest();
    if (!request.user || request.user.role !== 'admin') {
      throw new UnauthorizedException('Only administrators can view security policy rules');
    }
    
    return this.cloudArmor.getSecurityPolicyRules();
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