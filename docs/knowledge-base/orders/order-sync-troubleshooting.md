# Troubleshooting Order Sync Issues

This guide helps you diagnose and resolve common order synchronization issues between Fluxori and your connected marketplaces or sales channels.

## Common Order Sync Issues

### Orders Not Importing

If orders from your sales channels aren't appearing in Fluxori, check these common causes:

#### Connection Issues

1. **Verify API Connection Status**

   - Go to Marketplaces > [Channel Name] > Connection Status
   - Check if the status shows "Connected" (green) or "Error" (red)
   - If showing an error, click "View Details" for specific error information

2. **Check API Credentials**

   - Go to Marketplaces > [Channel Name] > Settings
   - Verify all API credentials are current and correct
   - Some platforms regularly expire tokens that need refreshing

3. **API Rate Limits**
   - Some marketplaces limit how many API calls you can make in a period
   - Check Marketplaces > [Channel Name] > API Usage
   - If at or near limits, consider spacing out syncs or upgrading your marketplace plan

#### Order Status Filters

1. **Check Import Filters**

   - Go to Marketplaces > [Channel Name] > Import Settings
   - Verify which order statuses are set to import
   - Some channels may be configured to only import certain statuses (e.g., "Paid" but not "Pending")

2. **Incorrect Status Mapping**
   - Go to Settings > Order Settings > Status Mapping
   - Ensure marketplace-specific statuses are correctly mapped to Fluxori statuses

#### Timing Issues

1. **Sync Schedule**

   - Check when the last sync occurred at Marketplaces > [Channel Name] > Sync History
   - Verify your sync schedule is set appropriately
   - Try a manual sync by clicking "Sync Now"

2. **Time Zone Discrepancies**
   - Check if there are time zone differences between Fluxori and the marketplace
   - Orders placed near the end of your day might sync the following day

### Orders Syncing with Missing Information

If orders import but have incomplete information, check these possible causes:

#### Mapping Issues

1. **Field Mapping Configuration**

   - Go to Marketplaces > [Channel Name] > Field Mapping
   - Verify all necessary fields are mapped correctly
   - Common missing fields include shipping address details, customer phone numbers, or custom attributes

2. **Custom Field Configuration**
   - Check if custom fields are properly set up to receive marketplace-specific data
   - Go to Settings > Order Settings > Custom Fields to verify configuration

#### Data Transformation Issues

1. **Check Data Format Differences**

   - Some fields may have format differences between systems (e.g., phone numbers, addresses)
   - Review the field mapping and consider adding transformation rules

2. **Character Encoding Problems**
   - Special characters or non-Latin scripts might not transfer correctly
   - Check Settings > System > Character Encoding settings

### Duplicate Orders

If the same orders appear multiple times in Fluxori, check these issues:

1. **Duplicate Prevention Settings**

   - Go to Settings > Order Settings > Duplicate Prevention
   - Ensure "Check for duplicates" is enabled
   - Verify the fields used for duplicate detection (Order ID, External Reference)

2. **Multiple Sync Triggers**

   - Check if you have multiple ways the same order could be imported
   - For example, both automatic sync and a manual import process

3. **Status Change Reimport**
   - Some systems reimport orders when their status changes
   - Check if your configuration treats these as new orders instead of updates

## Marketplace-Specific Troubleshooting

### Takealot

**Common Takealot Issues:**

1. **Order History Limitation**

   - Takealot only provides access to the last 30 days of orders via API
   - For older orders, use the manual import option with a CSV export from Takealot

2. **Order Status Discrepancies**

   - Takealot has specific statuses like "Customer Received" that may need custom mapping
   - Verify status mapping in Settings > Order Settings > Status Mapping > Takealot

3. **API Timeout Issues**
   - Takealot's API can be slow during high-traffic periods
   - If timeouts occur, try shorter date ranges for manual syncs or off-peak syncing

### Bob Shop

**Common Bob Shop Issues:**

1. **Limited Order Data**

   - Bob Shop (formerly Bidorbuy) doesn't always provide complete customer information
   - Check Marketplaces > Bob Shop > Field Mapping to ensure all available fields are mapped

2. **Status Update Delays**

   - Status updates to Bob Shop can experience delays
   - Allow 15-30 minutes for status changes to reflect on Bob Shop

3. **Authentication Errors**
   - Bob Shop API tokens expire frequently
   - If experiencing auth errors, try refreshing your credentials

### WooCommerce

**Common WooCommerce Issues:**

1. **Webhook Configuration**

   - Verify webhooks are properly configured in your WooCommerce admin
   - Required webhooks: order.created, order.updated, order.deleted

2. **REST API Access**

   - Check if the REST API is enabled in WooCommerce
   - Verify consumer key and secret have proper permissions

3. **Plugin Conflicts**
   - Some WooCommerce plugins can interfere with the API
   - Temporarily disable other plugins to identify conflicts

## Advanced Troubleshooting

### Checking API Logs

For deeper investigation:

1. Go to System > Logs > API Logs
2. Filter by the marketplace in question
3. Look for error codes, failed requests, or unusual patterns
4. Common error codes:
   - 401/403: Authentication issues
   - 429: Rate limit exceeded
   - 5xx: Server-side errors on the marketplace

### Testing API Connectivity

To directly test API connectivity:

1. Go to Marketplaces > [Channel Name] > Advanced > API Test
2. Click "Test Connection" to verify basic connectivity
3. Try "Test Order Fetch" to verify order retrieval specifically
4. Check response times and error messages

### Checking for Data Transformation Errors

If data is being improperly transformed:

1. Go to System > Logs > Sync Errors
2. Look for transformation-related errors
3. Common issues include:
   - Date format mismatches
   - Address format incompatibilities
   - Currency conversion problems

## Resolving Sync Issues

### Quick Fixes

1. **Manual Resync**

   - Go to Marketplaces > [Channel Name] > Sync Now
   - Set a date range that includes the missing orders
   - Choose "Force full resync" to ignore previous sync state

2. **Refresh API Connection**

   - Go to Marketplaces > [Channel Name] > Settings
   - Click "Disconnect" and then reauthorize the connection
   - This often resolves token expiration issues

3. **Clear Sync Cache**
   - Go to System > Maintenance > Clear Caches
   - Select "Sync Cache" and click "Clear Selected"
   - This removes potentially corrupted sync data

### Configuration Adjustments

1. **Adjust Sync Frequency**

   - For channels with many orders, increase sync frequency
   - Go to Marketplaces > [Channel Name] > Settings > Sync Schedule
   - Consider changing from hourly to every 15-30 minutes

2. **Modify Order Filters**

   - Expand which orders are imported by adjusting status filters
   - Include pending/processing orders if currently excluded

3. **Update Field Mappings**
   - Review and update field mappings to ensure all data transfers correctly
   - Add custom fields if needed for marketplace-specific data

### When to Contact Support

Contact Fluxori support if:

1. You've tried the solutions above without success
2. You see persistent API errors with error codes not covered here
3. Orders import but with systematic data problems
4. You experience significant sync delays (>2 hours) on critical channels

When contacting support, please provide:

- The specific marketplace/channel with issues
- Error messages from the API logs
- Timeline of when the problem started
- Examples of affected order numbers
- Screenshots of relevant error messages or logs

## Preventative Measures

### Regular Maintenance

1. **Schedule Regular Connection Tests**

   - Test all marketplace connections weekly
   - Address any warnings before they become failures

2. **Monitor API Usage**

   - Keep track of API quota usage for each marketplace
   - Set up alerts for when you approach limits

3. **Review Error Logs**
   - Check System > Logs > API Errors regularly
   - Look for patterns that might indicate developing problems

### Configuration Best Practices

1. **Stagger Sync Times**

   - Set different marketplaces to sync at different times
   - This prevents system overload and API rate limit issues

2. **Implement Redundancy**

   - For critical marketplaces, set up both scheduled and webhook-based syncing
   - This provides a backup if one method fails

3. **Document Custom Configurations**
   - Keep records of any custom field mappings or status configurations
   - This helps troubleshoot future changes or issues
