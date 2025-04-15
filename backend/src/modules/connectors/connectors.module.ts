/**
 * Connectors Module
 * 
 * This module provides a standardized way to connect to various marketplace APIs
 * and other external services. It registers and manages connector instances
 * through the connector factory service.
 */

import { Module } from '@nestjs/common';
import { ConnectorFactoryService } from './services/connector-factory.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { ConnectorCredentialsRepository } from './repositories/connector-credentials.repository';
import { ConnectorController } from './controllers/connector.controller';
import { XeroController } from './controllers/xero.controller';
// Re-enabled WooCommerce connector with TypeScript compliance
// import { WooCommerceController } from './controllers/woocommerce.controller';
import { WooCommerceConnector } from './adapters/woocommerce-connector';
import { TakealotConnector } from './adapters/takealot-connector';
import { BidorbuyConnector } from './adapters/bidorbuy-connector';
import { MakroConnector } from './adapters/makro-connector';
import { ShopifyConnector } from './adapters/shopify/shopify-connector';
import { AmazonSpConnector } from './adapters/amazon-sp/amazon-sp-connector';
import { SuperbalistConnector } from './adapters/superbalist-connector';
import { WantitallConnector } from './adapters/wantitall-connector';
import { XeroModule } from './adapters/xero/xero.module';
import { XeroConnector } from './adapters/xero/xero-connector';

@Module({
  imports: [
    XeroModule,
  ],
  controllers: [
    ConnectorController,
    XeroController,
    // WooCommerceController
  ],
  providers: [
    ConnectorCredentialsRepository,
    ConnectorFactoryService,
    WebhookHandlerService,
    WooCommerceConnector, // Re-enabled WooCommerce connector
    TakealotConnector,
    BidorbuyConnector,
    MakroConnector,
    ShopifyConnector,
    AmazonSpConnector,
    SuperbalistConnector, // Added Superbalist connector
    WantitallConnector, // Added Wantitall connector
    XeroConnector, // Re-enabled Xero connector
    {
      provide: 'CONNECTOR_FACTORY',
      useExisting: ConnectorFactoryService
    }
  ],
  exports: [
    ConnectorFactoryService,
    ConnectorCredentialsRepository,
    WebhookHandlerService,
    XeroModule,
  ]
})
export class ConnectorsModule {
  constructor(
    private readonly connectorFactory: ConnectorFactoryService
  ) {
    // Register marketplace connectors
    this.connectorFactory.registerConnector('woocommerce', WooCommerceConnector);
    this.connectorFactory.registerConnector('takealot', TakealotConnector);
    this.connectorFactory.registerConnector('bidorbuy', BidorbuyConnector);
    this.connectorFactory.registerConnector('makro', MakroConnector);
    this.connectorFactory.registerConnector('shopify', ShopifyConnector);
    this.connectorFactory.registerConnector('amazon-sp', AmazonSpConnector);
    this.connectorFactory.registerConnector('superbalist', SuperbalistConnector);
    this.connectorFactory.registerConnector('wantitall', WantitallConnector);
    
    // Register accounting/ERP connectors
    this.connectorFactory.registerConnector('xero', XeroConnector);
  }
}