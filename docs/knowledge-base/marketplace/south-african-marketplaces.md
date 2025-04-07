# South African Marketplaces Guide

This guide covers the specifics of connecting to and optimizing your presence on South African online marketplaces through Fluxori.

## Supported South African Marketplaces

Fluxori currently supports these major South African marketplaces:

| Marketplace | Integration Type | Auto-Sync Interval | Notes |
|-------------|-----------------|-------------------|-------|
| Takealot | Full API | 15 minutes | Includes Takealot Marketplace and Takealot Direct |
| Bidorbuy | Full API | 30 minutes | |
| Loot | Order Import | Manual/Daily | Limited to order import only |
| OneDayOnly | Order Import | Manual/Daily | Limited to order import only |
| Makro | Full API | 15 minutes | |
| Wantitall | Full API | 30 minutes | |
| Superbalist | Full API | 30 minutes | |
| Raru | Order Import | Manual/Daily | Limited to order import only |

## Connection Process

### Connecting to Takealot

1. From your Fluxori dashboard, go to Marketplaces > Connect New Marketplace
2. Select "Takealot" from the list
3. Select your account type (Marketplace Seller or Takealot Direct)
4. Click "Connect"
5. You'll be redirected to Takealot to authorize the connection
6. Log in to your Takealot seller account when prompted
7. Approve the permissions requested
8. You'll be redirected back to Fluxori to complete setup

### Connecting to Bidorbuy

1. From your Fluxori dashboard, go to Marketplaces > Connect New Marketplace
2. Select "Bidorbuy" from the list
3. Click "Connect"
4. Enter your Bidorbuy API credentials:
   - API Username (found in your Bidorbuy seller account)
   - API Key (generated in your Bidorbuy seller account)
5. Click "Save and Connect"
6. Fluxori will verify your credentials and establish the connection

### For Other Marketplaces

The connection process is similar for other marketplaces, though authentication methods may vary. See the marketplace-specific guides for detailed instructions.

## Common Connection Issues

### Takealot Connection Issues

* **Authentication Errors**: Ensure you're using the correct Takealot seller account credentials
* **Permission Denied**: Make sure your Takealot account has API access enabled (contact Takealot Seller Support if needed)
* **API Rate Limits**: If you hit rate limits, try spacing out your operations or contact us to upgrade your plan

### Bidorbuy Connection Issues

* **Invalid API Key**: Ensure you're using the correct API key. Try regenerating the key in your Bidorbuy account
* **Connection Timeout**: Bidorbuy's API sometimes experiences high latency. Try again after a few minutes
* **Missing Permissions**: Ensure your Bidorbuy account has the correct seller level to access API features

## Marketplace-Specific Features

### Takealot-Specific Features

* **Lead Time Management**: Manage lead times for different products
* **Offer Management**: Create and manage offers directly from Fluxori
* **RMA Processing**: Handle returns and refunds from within Fluxori
* **Performance Metrics**: Track Takealot-specific seller metrics

### Bidorbuy-Specific Features

* **Listing Enhancements**: Optimize your Bidorbuy listings with templates
* **Auction Management**: Schedule and manage auctions
* **Featured Listings**: Manage and schedule featured listings
* **Category Optimization**: Get suggestions for optimal category placement

## Order Processing

### Takealot Order Processing

1. Orders from Takealot automatically sync to Fluxori every 15 minutes
2. New orders appear in your Orders dashboard with a "Takealot" source tag
3. Process orders in Fluxori or mark them as shipped directly in Takealot
4. If processed in Fluxori, shipping information syncs back to Takealot automatically

### Bidorbuy Order Processing

1. Orders from Bidorbuy automatically sync to Fluxori every 30 minutes
2. New orders appear in your Orders dashboard with a "Bidorbuy" source tag
3. Process orders in Fluxori
4. Update order status in Fluxori, and it will reflect on Bidorbuy automatically

## Inventory Synchronization

### Inventory Sync Behavior

By default, Fluxori synchronizes your inventory levels across all connected marketplaces. When an item sells on any platform, the stock level is adjusted across all marketplaces to prevent overselling.

### Marketplace-Specific Inventory

If you need different inventory levels for different marketplaces:

1. Go to Inventory > Products
2. Select the product you want to manage
3. Go to the "Marketplace Settings" tab
4. Enable "Marketplace-specific inventory"
5. Set different stock levels for each marketplace

## Pricing Strategies

### Marketplace Fee Consideration

South African marketplaces have different fee structures that affect your profitability:

* **Takealot**: Success fees range from 7-12% depending on category
* **Bidorbuy**: Commission ranges from 4-10% depending on category
* **Other marketplaces**: Variable fee structures

Fluxori's pricing tools can help you set prices that account for these fees to maintain your desired profit margin.

### Automatic Repricing

Fluxori offers automatic repricing specifically optimized for South African marketplaces:

1. Go to Marketplaces > Repricing Rules
2. Create a new rule targeting specific marketplaces
3. Set your pricing strategy (e.g., match competitors, beat by percentage, maintain margin)
4. Set minimum and maximum prices to stay within your acceptable range
5. Enable the rule and set update frequency

## Analytics and Reporting

### Marketplace Performance Comparison

Compare performance across South African marketplaces:

1. Go to Analytics > Marketplace Performance
2. View consolidated metrics or filter by marketplace
3. Compare key metrics like sales, average order value, return rate, and profitability

### South Africa-Specific Insights

Fluxori provides insights specific to the South African e-commerce market:

* Regional sales analysis by province
* Top-performing categories in the South African market
* South African shopping seasonal trends
* Local competitor analysis

## Troubleshooting Common Issues

### Order Sync Delays

If orders aren't syncing from South African marketplaces:

1. Check your API credentials and connection status
2. Verify the marketplace's API status (especially during high-traffic sales events)
3. Try a manual sync from Marketplaces > [Marketplace Name] > Sync Now
4. For persistent issues, contact support with your specific marketplace and seller ID

### Listing Errors

Common listing errors for South African marketplaces:

* **Image Requirements**: Ensure images meet marketplace specifications (especially Takealot's strict requirements)
* **Category Mapping**: Verify proper category mapping for each marketplace
* **Attribute Requirements**: Some categories require specific attributes (especially electronics on Takealot)

## Best Practices

### South African Market Optimization

* **Localized Content**: Use South African English spelling and terminology
* **Shipping Expectations**: Set clear delivery timeframes accounting for South African logistics
* **Payment Methods**: Highlight supported South African payment methods
* **Local Pricing**: Price in Rand without decimal points when possible (e.g., R499 instead of R499.00)
* **Mobile Optimization**: Optimize listings for mobile as most South African shoppers use mobile devices