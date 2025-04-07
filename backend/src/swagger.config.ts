import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Swagger configuration options
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Fluxori API')
  .setDescription(`
## Fluxori Inventory & Marketplace Management Platform API

This API provides access to Fluxori's inventory management, marketplace integration, and AI-powered insights.

### Features

- **Inventory Management:** Manage products, stock levels, and warehouses
- **Marketplace Integration:** Connect to Amazon, Shopify, and other marketplaces
- **Order Management:** Track and process orders from multiple channels
- **AI Insights:** Get AI-powered recommendations for pricing, inventory, and more
- **RAG Retrieval:** Semantically search through your documents and knowledge base

### Authentication

All endpoints except for authentication require a valid JWT token obtained from the /auth/login endpoint.
The token should be included in the Authorization header as a Bearer token.

### Rate Limiting

API requests are subject to rate limiting to ensure fair usage.
  `)
  .setVersion('1.0')
  .addTag('Authentication', 'User authentication and authorization')
  .addTag('Users', 'User management operations')
  .addTag('Organizations', 'Organization management')
  .addTag('Inventory', 'Product and stock management')
  .addTag('Marketplaces', 'Marketplace integrations and channel management')
  .addTag('Orders', 'Order processing and management')
  .addTag('BuyBox', 'Price monitoring and repricing rules')
  .addTag('AI Insights', 'AI-powered business insights')
  .addTag('Notifications', 'System and user notifications')
  .addTag('RAG Retrieval', 'Semantic search and knowledge base')
  .addTag('International Trade', 'International shipping and compliance')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();

/**
 * Swagger UI custom options
 */
export const swaggerUiOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true,
  },
  customSiteTitle: 'Fluxori API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 30px 0 }
    .swagger-ui .scheme-container { padding: 15px 0 }
    .swagger-ui .info .title { font-size: 32px }
    .swagger-ui .info__contact { display: flex; padding: 10px 0 }
    .swagger-ui .info__license { display: flex }
  `,
};