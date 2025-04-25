/**
 * Connectors Module
 *
 * This module provides a standardized way to connect to various marketplace APIs
 * and other external services. It registers and manages connector instances
 * through the connector factory service.
 */

import { Module } from '@nestjs/common';

// Re-enabled WooCommerce connector with TypeScript compliance
// import { WooCommerceController } from './controllers/woocommerce.controller';
import { AmazonSpConnector } from './adapters/amazon-sp/amazon-sp-connector';
import { BobShopConnector } from './adapters/bob-shop-connector';
import { MakroConnector } from './adapters/makro-connector';
import { ShopifyConnector } from './adapters/shopify/shopify-connector';
import { SuperbalistConnector } from './adapters/superbalist-connector';
import { TakealotConnector } from './adapters/takealot-connector';
import { WantitallConnector } from './adapters/wantitall-connector';
import { WooCommerceConnector } from './adapters/woocommerce-connector';
import { XeroConnector } from './adapters/xero/xero-connector';
import { XeroModule } from './adapters/xero/xero.module';
import { ConnectorController } from './controllers/connector.controller';
import { XeroController } from './controllers/xero.controller';
import { ConnectorCredentialsRepository } from './repositories/connector-credentials.repository';
import { ConnectorFactoryService } from './services/connector-factory.service';
import { WebhookHandlerService } from './services/webhook-handler.service';

@Module({
  imports: [XeroModule],
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
    BobShopConnector,
    MakroConnector,
    ShopifyConnector,
    AmazonSpConnector,
    SuperbalistConnector, // Added Superbalist connector
    WantitallConnector, // Added Wantitall connector
    XeroConnector, // Re-enabled Xero connector
    {
      provide: 'CONNECTOR_FACTORY',
      useExisting: ConnectorFactoryService,
    },
  ],
  exports: [
    ConnectorFactoryService,
    ConnectorCredentialsRepository,
    WebhookHandlerService,
    XeroModule,
  ],
})
export class ConnectorsModule {
  constructor(private readonly connectorFactory: ConnectorFactoryService) {
    // Register marketplace connectors
    this.connectorFactory.registerConnector(
      'woocommerce',
      WooCommerceConnector,
    );
    this.connectorFactory.registerConnector('takealot', TakealotConnector);
    this.connectorFactory.registerConnector('bob-shop', BobShopConnector);
    this.connectorFactory.registerConnector('makro', MakroConnector);
    this.connectorFactory.registerConnector('shopify', ShopifyConnector);
    this.connectorFactory.registerConnector('amazon-sp', AmazonSpConnector);
    this.connectorFactory.registerConnector(
      'superbalist',
      SuperbalistConnector,
    );
    this.connectorFactory.registerConnector('wantitall', WantitallConnector);

    // Register accounting/ERP connectors
    this.connectorFactory.registerConnector('xero', XeroConnector);
  }
}
