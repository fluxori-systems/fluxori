# Inventory Reports Explained

This guide explains the various inventory reports available in Fluxori, how to use them, and how to interpret the data they provide.

## Available Inventory Reports

Fluxori offers several inventory reports to help you manage your stock effectively:

| Report Name | Description | Typical Use Case |
|-------------|-------------|-----------------|
| Inventory Valuation | Shows the value of your current inventory | Monthly accounting, financial reporting |
| Stock Levels | Current stock levels across all locations | Daily operations, reordering |
| Inventory Movement | Tracks stock changes over time | Auditing, trend analysis |
| Low Stock | Products below minimum threshold | Reordering, purchasing |
| Excess Stock | Products above maximum threshold | Markdown planning, promotions |
| Product Performance | Sales velocity and profitability by product | Product line decisions, discontinuation |
| Warehouse Utilization | Space and capacity usage by warehouse | Resource planning, expansion |
| Inventory Aging | Time products have been in stock | Identifying slow-moving inventory |

## Accessing Reports

To access inventory reports:

1. From your dashboard, go to Inventory > Reports
2. Select the report type you want to view
3. Set any filters or parameters (date range, product categories, warehouses)
4. Click "Generate Report"

## Understanding Key Metrics

### Inventory Valuation Report

The Inventory Valuation report shows the financial value of your inventory. Key metrics include:

* **Cost Value**: Total value based on purchase/manufacturing cost
* **Retail Value**: Total value based on selling price
* **Potential Profit**: Difference between retail and cost values
* **Average Margin**: Percentage difference between retail and cost values

### Stock Levels Report

The Stock Levels report shows current inventory quantities. Key metrics include:

* **On Hand**: Physically available in your warehouses
* **Available**: On hand minus reserved inventory
* **Reserved**: Allocated to orders but not yet shipped
* **On Order**: Ordered from suppliers but not yet received
* **Reorder Point**: Threshold at which to reorder
* **Days of Supply**: Estimated days until stock-out based on sales velocity

### Inventory Movement Report

The Inventory Movement report tracks changes in your inventory over time. Key metrics include:

* **Opening Balance**: Stock at start of period
* **Receipts**: Stock added during period
* **Sales**: Stock sold during period
* **Adjustments**: Manual corrections, damages, write-offs
* **Transfers**: Movement between locations
* **Closing Balance**: Stock at end of period

## Customizing Reports

### Filtering Reports

All reports can be filtered by:

* **Date Range**: Select specific period
* **Product Categories**: Filter by product type
* **Warehouses/Locations**: Filter by storage location
* **Brands/Suppliers**: Filter by manufacturer or vendor
* **Tags**: Filter by custom product tags

### Saving Custom Reports

To save a customized report for future use:

1. Set up the report with your desired filters and parameters
2. Click "Save As" in the report options menu
3. Give your custom report a name
4. Choose who can access this report (just you or your team)

### Scheduling Regular Reports

You can schedule reports to run automatically:

1. Set up the report with your desired settings
2. Click "Schedule" in the report options menu
3. Choose frequency (daily, weekly, monthly)
4. Select delivery method (email, dashboard notification)
5. Add recipients if delivering via email

## Analyzing Inventory Reports

### Identifying Slow-Moving Inventory

Use the Inventory Aging report to identify slow-moving inventory:

1. Generate the Inventory Aging report
2. Sort by "Days in Stock" (descending)
3. Look for items with:
   * High days in stock
   * Low sales velocity
   * High holding cost

Consider clearance sales, bundling, or write-offs for extremely aged inventory.

### Optimizing Reorder Points

Use the Stock Levels report to optimize your reorder points:

1. Generate the Stock Levels report
2. Sort by "Stock Outs Last 90 Days" (descending)
3. For frequently stocked-out items:
   * Increase reorder point
   * Increase safety stock
   * Consider automatic reordering

### Warehouse Space Utilization

Use the Warehouse Utilization report to manage your storage efficiently:

1. Generate the Warehouse Utilization report
2. Identify warehouses with:
   * High utilization (>85%) that need expansion
   * Low utilization (<40%) that are inefficient
3. Consider redistributing stock between locations

## Exporting and Sharing Reports

### Export Options

Reports can be exported in various formats:

* **Excel (.xlsx)**: For detailed analysis and manipulation
* **CSV (.csv)**: For importing into other systems
* **PDF (.pdf)**: For sharing and presentation
* **Print Version**: For physical copies

To export, click the "Export" button and select your preferred format.

### Sharing Reports

To share a report with team members or external stakeholders:

1. Generate the report with your desired settings
2. Click "Share" in the report options menu
3. Enter email addresses of recipients
4. Add an optional message
5. Choose between sending the actual report or a link to view it online

## Troubleshooting Report Issues

### Common Issues and Solutions

**Report Shows Incorrect Stock Levels**
* Verify recent transactions have been processed
* Check for pending stock adjustments
* Ensure all marketplace integrations are synced

**Missing Products in Reports**
* Check if filters are excluding certain products
* Verify product visibility settings
* Ensure products have the required attributes for the report

**Value Discrepancies**
* Confirm cost price settings are up to date
* Check for currency conversion issues
* Verify valuation method settings (FIFO, LIFO, Average Cost)

## Best Practices

### Regular Reporting Schedule

Establish a regular cadence for reviewing key reports:

* **Daily**: Stock Levels, Low Stock
* **Weekly**: Inventory Movement, Product Performance
* **Monthly**: Inventory Valuation, Aging, Warehouse Utilization

### Data-Driven Decisions

Use inventory reports to inform key business decisions:

* Base purchasing decisions on stock levels and sales velocity
* Identify top and bottom performing products for marketing focus
* Optimize warehouse space based on utilization reports
* Time promotions based on excess stock and aging reports

### Report Accuracy

Maintain accurate inventory data for reliable reports:

* Conduct regular cycle counts or stock takes
* Promptly process all inventory movements
* Train staff on proper inventory procedures
* Reconcile discrepancies quickly