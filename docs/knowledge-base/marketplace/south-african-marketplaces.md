# South African Marketplaces Guide

This guide covers the specifics of connecting to and optimizing your presence on South African online marketplaces through Fluxori.

## Supported South African Marketplaces

Fluxori currently supports these major South African marketplaces:

| Marketplace | Integration Type | Auto-Sync Interval | Notes                                                   |
| ----------- | ---------------- | ------------------ | ------------------------------------------------------- |
| Takealot    | Full API         | 15 minutes         | Includes Takealot Marketplace and Takealot Direct       |
| Amazon SA   | Full API         | 15 minutes         | Full Amazon South Africa marketplace support            |
| Bob Shop    | Full API         | 30 minutes         | Includes auction management support (formerly Bidorbuy) |
| Makro       | Full API         | 15 minutes         | Includes store pickup integration                       |
| Loot        | Order Import     | Manual/Daily       | Limited to order import only                            |
| OneDayOnly  | Order Import     | Manual/Daily       | Limited to order import only                            |
| Wantitall   | Full API         | 30 minutes         |                                                         |
| Superbalist | Full API         | 30 minutes         |                                                         |
| Raru        | Order Import     | Manual/Daily       | Limited to order import only                            |

## Marketplace Integration Overview

### What's New: Enhanced South African Marketplace Support

As part of our April 2025 update, we've significantly enhanced our South African marketplace integrations:

1. **Expanded Takealot Integration**: Our Takealot connector now includes improved category mapping, enhanced reporting, and faster synchronization.

2. **Full Bob Shop Support**: Our new Bob Shop connector (formerly Bidorbuy) includes comprehensive auction management features, allowing you to:

   - Create and manage auctions directly from Fluxori
   - Set auction parameters including start price, reserve price, and duration
   - Monitor bidding activity and auction status
   - Convert successful auctions to orders automatically

3. **Enhanced Makro Integration**: Our updated Makro connector now includes:

   - Store pickup eligibility checking for each product
   - Multi-store inventory visibility
   - Promotion and discount management
   - Regional stock distribution optimization

4. **New Amazon SA Integration**: Our all-new Amazon South Africa connector provides:

   - Complete ASIN-based product management
   - South African marketplace-specific category mapping
   - Fulfillment by Amazon integration
   - Prime eligibility management
   - Amazon South Africa promotion and deal support

5. **Advanced Marketplace Data Collection**: Our new data collection framework now provides:
   - Competitive price monitoring across all major South African marketplaces
   - Search position tracking for key products and keywords
   - Bestseller list monitoring and trend detection
   - Historical price and availability tracking
   - Competitor product monitoring

All South African marketplace integrations now include improved resilience for load shedding conditions and network-aware behaviors for variable connectivity conditions.

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

### Connecting to Amazon SA

1. From your Fluxori dashboard, go to Marketplaces > Connect New Marketplace
2. Select "Amazon South Africa" from the list
3. Click "Connect"
4. Enter your Amazon Seller Central credentials:
   - Seller ID
   - MWS Auth Token
5. Specify your Amazon South Africa marketplace settings
6. Click "Save and Connect"
7. Fluxori will verify your credentials and establish the connection

### Connecting to Bob Shop

1. From your Fluxori dashboard, go to Marketplaces > Connect New Marketplace
2. Select "Bob Shop" from the list
3. Click "Connect"
4. Enter your Bob Shop API credentials:
   - API Username (found in your Bob Shop seller account)
   - API Key (generated in your Bob Shop seller account)
5. Click "Save and Connect"
6. Fluxori will verify your credentials and establish the connection

### For Other Marketplaces

The connection process is similar for other marketplaces, though authentication methods may vary. See the marketplace-specific guides for detailed instructions.

## Common Connection Issues

### Takealot Connection Issues

- **Authentication Errors**: Ensure you're using the correct Takealot seller account credentials
- **Permission Denied**: Make sure your Takealot account has API access enabled (contact Takealot Seller Support if needed)
- **API Rate Limits**: If you hit rate limits, try spacing out your operations or contact us to upgrade your plan

### Amazon SA Connection Issues

- **Invalid Credentials**: Ensure you're using the correct Amazon Seller Central credentials
- **Marketplace Access**: Verify your seller account has access to the Amazon South Africa marketplace
- **IP Restrictions**: If your account has IP restrictions, whitelist Fluxori's IP addresses
- **MWS Token Issues**: If your MWS token is invalid, generate a new one in Amazon Seller Central

### Bob Shop Connection Issues

- **Invalid API Key**: Ensure you're using the correct API key. Try regenerating the key in your Bob Shop account
- **Connection Timeout**: Bob Shop's API sometimes experiences high latency. Try again after a few minutes
- **Missing Permissions**: Ensure your Bob Shop account has the correct seller level to access API features

## Marketplace-Specific Features

### Takealot-Specific Features

- **Lead Time Management**: Manage lead times for different products
- **Offer Management**: Create and manage offers directly from Fluxori
- **RMA Processing**: Handle returns and refunds from within Fluxori
- **Performance Metrics**: Track Takealot-specific seller metrics
- **Daily Deals Management**: Apply for and manage Daily Deals
- **Competitive Monitoring**: Track competitor prices and visibility

### Amazon SA-Specific Features

- **ASIN Management**: Manage Amazon Standard Identification Numbers
- **A+ Content**: Create and manage enhanced product descriptions
- **FBA Management**: Handle Fulfillment by Amazon inventory
- **Amazon Advertising**: Manage sponsored products and brands
- **Prime Eligibility**: Monitor and maintain Prime eligibility
- **Bestseller Rank Tracking**: Monitor your products' bestseller rankings
- **Review Management**: Track and respond to product reviews

### Bob Shop-Specific Features

- **Listing Enhancements**: Optimize your Bob Shop listings with templates
- **Auction Management**: Schedule and manage auctions
- **Featured Listings**: Manage and schedule featured listings
- **Category Optimization**: Get suggestions for optimal category placement

## Marketplace Data Collection and Competitive Intelligence

### New Features: Advanced Marketplace Intelligence Suite

The April 2025 update brings significant enhancements to our competitive intelligence capabilities, powered by our new marketplace data collection framework with specialized Amazon templates and advanced South African market adaptations:

#### Key Enhancements:

- **95.4% Template Success Rate**: Our new template-based extraction achieves industry-leading accuracy
- **Historical Data Analysis**: Track trends with up to 12 months of historical data
- **South African Market Focus**: Specialized features for the unique South African e-commerce landscape
- **Load Shedding Resilience**: Continuous monitoring even during power outages
- **Competitive Analysis Engine**: AI-powered insights for optimal market positioning

### Price Monitoring with Historical Analysis

Fluxori now includes comprehensive price monitoring across all major South African marketplaces:

1. Go to Competitive Intelligence > Price Monitoring
2. View current prices across all marketplaces for your products
3. Track historical price changes with interactive charts and trend analysis
4. Set up smart price alerts with customizable thresholds
5. Identify pricing patterns and seasonal trends with our new analytics engine
6. Compare your pricing against market averages by category

**New Feature**: Price Volatility Analysis helps you identify which competitors frequently change prices, allowing you to optimize your repricing strategy.

### Search Position Intelligence

Track and optimize your products' search rankings for important keywords:

1. Go to Competitive Intelligence > Search Rankings
2. Add keywords to track (up to 200 per marketplace)
3. View position changes over time with our new timeline visualization
4. Track sponsored vs. organic positions separately
5. Compare rankings across marketplaces with side-by-side analysis
6. Get AI-powered recommendations for improving search visibility

**New Feature**: Search Velocity Reports show how quickly your products are gaining or losing position over time, helping you identify emerging trends.

### Bestseller Rank Tracking

Monitor bestseller lists and trending products with enhanced analytics:

1. Go to Competitive Intelligence > Bestsellers
2. View bestseller rankings by category with real-time updates
3. Track your products' positions in bestseller lists with historical trends
4. Identify trending products with our predictive algorithm
5. Get alerts when your products enter or fall off bestseller lists
6. Analyze category momentum to identify growing market segments

**New Feature**: Category Opportunity Analysis identifies categories with low competition but high growth potential.

### Competitive Product Intelligence

Our enhanced competitive product monitoring provides deeper insights:

1. Go to Competitive Intelligence > Competitor Products
2. Add competitor products to monitor with our bulk import tool
3. Track price changes, promotions, and stock availability
4. Monitor review sentiment and rating distribution
5. Analyze competitor product visibility and search performance
6. Compare specification differences with side-by-side analysis

**New Feature**: Competitor Matching automatically identifies similar products across marketplaces, even when listings differ significantly.

### Advanced Analytics Dashboard

Our new competitive intelligence dashboard provides at-a-glance market insights:

1. Go to Competitive Intelligence > Dashboard
2. View your overall market position score across all marketplaces
3. See price competitiveness metrics with dynamic charts
4. Monitor search visibility trends for your key products
5. Track review sentiment changes over time
6. View marketplace-specific performance metrics
7. Get personalized recommendations for improving your position

### South African Market Pulse

Get insights specifically tailored to the South African e-commerce landscape:

1. Go to Competitive Intelligence > SA Market Pulse
2. View top trending products across South African marketplaces
3. Monitor promotion patterns during key South African shopping events
4. Track pricing trends during load shedding periods
5. Analyze seasonal buying patterns unique to South Africa
6. Monitor exchange rate impacts on cross-border sellers

### Comprehensive Data Collection Settings

Configure your marketplace intelligence system in detail:

1. Go to Settings > Competitive Intelligence
2. Set monitoring frequency for each marketplace and product category
3. Configure alert thresholds with advanced conditions
4. Adjust data retention settings with our new tiered storage system
5. Manage monitored products, competitors, and keywords
6. Set up custom dashboards and reports with our flexible configuration tool
7. Configure load shedding awareness settings for continuous monitoring

## Order Processing

### Takealot Order Processing

1. Orders from Takealot automatically sync to Fluxori every 15 minutes
2. New orders appear in your Orders dashboard with a "Takealot" source tag
3. Process orders in Fluxori or mark them as shipped directly in Takealot
4. If processed in Fluxori, shipping information syncs back to Takealot automatically

### Amazon SA Order Processing

1. Orders from Amazon SA automatically sync to Fluxori every 15 minutes
2. New orders appear in your Orders dashboard with an "Amazon SA" source tag
3. FBA and self-fulfilled orders are clearly distinguished
4. For self-fulfilled orders, process in Fluxori and tracking information syncs to Amazon
5. For FBA orders, inventory and fulfillment are handled automatically

### Bob Shop Order Processing

1. Orders from Bob Shop automatically sync to Fluxori every 30 minutes
2. New orders appear in your Orders dashboard with a "Bob Shop" source tag
3. Auction and fixed-price orders are clearly distinguished with appropriate labels
4. Process orders in Fluxori
5. Update order status in Fluxori, and it will reflect on Bob Shop automatically
6. For auction orders, you can view bidding history directly from the order details

### Makro Order Processing

1. Orders from Makro automatically sync to Fluxori every 15 minutes
2. New orders appear in your Orders dashboard with a "Makro" source tag
3. Store pickup orders are flagged with their designated pickup location
4. Process orders in Fluxori and update shipping/pickup status
5. For store pickup orders, prepare inventory at the designated store

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

- **Takealot**: Success fees range from 7-12% depending on category
- **Amazon SA**: Referral fees range from 8-15% depending on category, plus FBA fees if applicable
- **Bob Shop**: Commission ranges from 4-10% depending on category
- **Makro**: Commission ranges from 5-8% depending on category
- **Other marketplaces**: Variable fee structures

Fluxori's pricing tools can help you set prices that account for these fees to maintain your desired profit margin.

### Automatic Repricing

Fluxori offers automatic repricing specifically optimized for South African marketplaces:

1. Go to Marketplaces > Repricing Rules
2. Create a new rule targeting specific marketplaces
3. Set your pricing strategy (e.g., match competitors, beat by percentage, maintain margin)
4. Set minimum and maximum prices to stay within your acceptable range
5. Enable the rule and set update frequency

With our enhanced competitive intelligence, you can now:

- Create rules based on real-time competitor price data
- Set dynamic pricing based on bestseller rank
- Adjust prices based on search visibility
- Implement time-based pricing strategies for peak shopping times

## Analytics and Reporting

### Marketplace Performance Comparison

Compare performance across South African marketplaces:

1. Go to Analytics > Marketplace Performance
2. View consolidated metrics or filter by marketplace
3. Compare key metrics like sales, average order value, return rate, and profitability

### South Africa-Specific Insights

Fluxori provides insights specific to the South African e-commerce market:

- Regional sales analysis by province
- Top-performing categories in the South African market
- South African shopping seasonal trends
- Local competitor analysis
- Load shedding impact analysis
- Marketplace growth comparisons

### Competitive Intelligence Reports

Access advanced competitive intelligence reports:

1. Go to Reports > Competitive Intelligence
2. View comprehensive market position reports
3. Analyze price competitiveness across marketplaces
4. Track search visibility trends
5. Monitor review sentiment and rating comparisons
6. Get recommendations for improving market position

## Troubleshooting Common Issues

### Order Sync Delays

If orders aren't syncing from South African marketplaces:

1. Check your API credentials and connection status
2. Verify the marketplace's API status (especially during high-traffic sales events)
3. Try a manual sync from Marketplaces > [Marketplace Name] > Sync Now
4. For persistent issues, contact support with your specific marketplace and seller ID

### Listing Errors

Common listing errors for South African marketplaces:

- **Image Requirements**: Ensure images meet marketplace specifications (especially Takealot's strict requirements)
- **Category Mapping**: Verify proper category mapping for each marketplace
- **Attribute Requirements**: Some categories require specific attributes (especially electronics on Takealot and Amazon SA)
- **ASIN Issues (Amazon)**: Ensure correct ASIN mapping and product data
- **Description Formatting**: Each marketplace has specific HTML/formatting requirements

## Best Practices

### South African Market Optimization

- **Localized Content**: Use South African English spelling and terminology
- **Shipping Expectations**: Set clear delivery timeframes accounting for South African logistics
- **Payment Methods**: Highlight supported South African payment methods
- **Local Pricing**: Price in Rand without decimal points when possible (e.g., R499 instead of R499.00)
- **Mobile Optimization**: Optimize listings for mobile as most South African shoppers use mobile devices
- **Load Shedding Awareness**: Consider load shedding schedules when planning promotions and customer service hours
- **Competitive Positioning**: Use Fluxori's competitive intelligence to optimize your market position
