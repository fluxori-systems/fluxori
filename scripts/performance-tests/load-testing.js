#!/usr/bin/env node

/**
 * Fluxori Load Testing Script
 * 
 * This script performs load testing on the Fluxori API and frontend to ensure
 * the system can handle the expected production load for South African e-commerce customers.
 * 
 * Features:
 * - Realistic load patterns based on actual e-commerce traffic
 * - Virtual user simulation with realistic behavior
 * - Gradual ramp-up to identify breaking points
 * - South Africa-specific latency simulation
 * - Detailed reporting with charts and metrics
 * 
 * Usage:
 *   node load-testing.js --target=api --users=500 --duration=10m --scenario=peak
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { GoogleAuth } = require('google-auth-library');
const { Chart } = require('chart.js');
const { createCanvas } = require('canvas');
const { format } = require('date-fns');

// Configure command line interface
program
  .version('1.0.0')
  .requiredOption('--target <target>', 'Target to test: api, frontend, all', 'all')
  .option('--users <users>', 'Max number of concurrent users', parseInt, 100)
  .option('--duration <duration>', 'Test duration (e.g., 5m, 30s)', '5m')
  .option('--scenario <scenario>', 'Test scenario: normal, peak, stress', 'normal')
  .option('--region <region>', 'Simulate traffic from region: za (South Africa), eu (Europe), all', 'za')
  .option('--output <output>', 'Output directory for reports', './results')
  .option('--api-url <apiUrl>', 'API URL to test', 'https://api.fluxori.com')
  .option('--frontend-url <frontendUrl>', 'Frontend URL to test', 'https://app.fluxori.com')
  .option('--verbose', 'Enable verbose output')
  .parse(process.argv);

const options = program.opts();

// Parse duration string (e.g., "5m", "30s") to milliseconds
function parseDuration(durationStr) {
  const match = durationStr.match(/^(\d+)([ms])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${durationStr}. Use format like 5m or 30s`);
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  return unit === 'm' ? value * 60 * 1000 : value * 1000;
}

// Configuration for different test scenarios
const scenarios = {
  normal: {
    connections: options.users,
    duration: parseDuration(options.duration),
    timeout: 10000,
    pipelining: 1,
    connectionRate: Math.ceil(options.users / 60) // Ramp up over 60 seconds
  },
  peak: {
    connections: options.users,
    duration: parseDuration(options.duration),
    timeout: 5000,
    pipelining: 2,
    connectionRate: Math.ceil(options.users / 30) // Faster ramp up for peak testing
  },
  stress: {
    connections: options.users * 2, // Double the user count for stress test
    duration: parseDuration(options.duration),
    timeout: 3000,
    pipelining: 4,
    connectionRate: Math.ceil(options.users / 10) // Very fast ramp up for stress testing
  }
};

// Region-specific latency simulation
const regions = {
  za: {
    minLatency: 50,   // South Africa min latency (ms)
    maxLatency: 120    // South Africa max latency (ms)
  },
  eu: {
    minLatency: 150,  // Europe min latency (ms)
    maxLatency: 300   // Europe max latency (ms)
  }
};

// Endpoints to test for API load testing
const apiEndpoints = [
  { 
    path: '/health', 
    method: 'GET',
    weight: 5,
    public: true
  },
  { 
    path: '/api/products', 
    method: 'GET', 
    weight: 30,
    public: false
  },
  { 
    path: '/api/products?category=electronics', 
    method: 'GET',
    weight: 10,
    public: false
  },
  { 
    path: '/api/orders', 
    method: 'GET',
    weight: 20,
    public: false
  },
  { 
    path: '/api/marketplace/status', 
    method: 'GET',
    weight: 15,
    public: false
  },
  { 
    path: '/api/insights/summary', 
    method: 'GET',
    weight: 5,
    public: false
  },
  { 
    path: '/api/users/profile', 
    method: 'GET',
    weight: 10,
    public: false
  },
  { 
    path: '/api/products', 
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Product',
      price: 9999,
      sku: `TEST-${Date.now()}`,
      description: 'Test product for load testing'
    }),
    weight: 2,
    public: false
  },
  { 
    path: '/api/orders', 
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: 'SAMPLE-001', quantity: 1 }],
      shippingAddress: {
        street: '123 Test St',
        city: 'Johannesburg',
        country: 'South Africa',
        postalCode: '2000'
      }
    }),
    weight: 3,
    public: false
  }
];

// Create output directory if it doesn't exist
const outputDir = path.resolve(options.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get authentication token for API calls
async function getAuthToken() {
  try {
    // For local testing with service account
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.warn('Failed to get GCP auth token, using test token');
    return 'test-token-for-load-testing';
  }
}

// Create a weighted selection of endpoints based on their traffic weight
function createEndpointDistribution(endpoints) {
  const distribution = [];
  
  for (const endpoint of endpoints) {
    // Add this endpoint to the distribution array based on its weight
    for (let i = 0; i < endpoint.weight; i++) {
      distribution.push(endpoint);
    }
  }
  
  return distribution;
}

// Run a complete test for a specific endpoint
async function runEndpointTest(baseUrl, endpoint, authToken, region) {
  console.log(`Testing ${endpoint.method} ${baseUrl}${endpoint.path}`);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication token for authenticated endpoints
  if (!endpoint.public && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Configure latency based on selected region
  const latencyRange = regions[region] || regions.za;
  
  // Create autocannon instance
  const instance = autocannon({
    url: `${baseUrl}${endpoint.path}`,
    method: endpoint.method,
    body: endpoint.body,
    headers,
    ...scenarios[options.scenario],
    latency: latencyRange,
    title: `${endpoint.method} ${endpoint.path}`,
    setupClient: (client) => {
      // Add artificial latency for South African internet conditions
      const latency = Math.floor(
        Math.random() * (latencyRange.maxLatency - latencyRange.minLatency) + 
        latencyRange.minLatency
      );
      
      if (options.verbose) {
        console.log(`Adding artificial latency: ${latency}ms`);
      }
      
      client.setInitialDelay(latency);
    }
  });
  
  return new Promise((resolve) => {
    autocannon.track(instance, { renderProgressBar: options.verbose });
    
    instance.on('done', (results) => {
      resolve(results);
    });
  });
}

// Generate a results report with charts
function generateReport(results, testDetails) {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const reportDir = path.join(outputDir, `report-${timestamp}`);
  fs.mkdirSync(reportDir, { recursive: true });
  
  // Save raw results as JSON
  fs.writeFileSync(
    path.join(reportDir, 'results.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Create summary report in markdown
  let summaryMd = `# Fluxori Load Test Report\n\n`;
  summaryMd += `**Date:** ${new Date().toISOString()}\n\n`;
  summaryMd += `**Test Configuration:**\n`;
  summaryMd += `- Target: ${testDetails.target}\n`;
  summaryMd += `- Scenario: ${testDetails.scenario}\n`;
  summaryMd += `- Users: ${testDetails.users}\n`;
  summaryMd += `- Duration: ${testDetails.duration}\n`;
  summaryMd += `- Region: ${testDetails.region}\n\n`;
  
  summaryMd += `## Summary\n\n`;
  summaryMd += `| Endpoint | Requests/sec | Latency (avg) | Latency (p95) | Errors |\n`;
  summaryMd += `|----------|--------------|---------------|---------------|--------|\n`;
  
  // Calculate overall stats
  let totalRequests = 0;
  let totalErrors = 0;
  let totalBytes = 0;
  let weightedAvgLatency = 0;
  let totalSamples = 0;
  
  results.forEach(result => {
    const endpoint = result.title || `${result.url}`;
    const rps = result.requests.average;
    const avgLatency = result.latency.average.toFixed(2);
    const p95Latency = result.latency.p95.toFixed(2);
    const errors = result.errors || 0;
    
    summaryMd += `| ${endpoint} | ${rps} | ${avgLatency}ms | ${p95Latency}ms | ${errors} |\n`;
    
    totalRequests += result.requests.total;
    totalErrors += result.errors || 0;
    totalBytes += result.throughput.total;
    weightedAvgLatency += result.latency.average * result.requests.total;
    totalSamples += result.requests.total;
  });
  
  const avgLatency = (weightedAvgLatency / totalSamples).toFixed(2);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);
  const throughput = (totalBytes / 1024 / 1024).toFixed(2);
  
  summaryMd += `\n## Overall Performance\n\n`;
  summaryMd += `- **Total Requests:** ${totalRequests}\n`;
  summaryMd += `- **Average Latency:** ${avgLatency}ms\n`;
  summaryMd += `- **Error Rate:** ${errorRate}%\n`;
  summaryMd += `- **Total Throughput:** ${throughput}MB\n`;
  
  // SLO evaluation
  const sloLatency = 500; // 500ms latency SLO
  const sloErrorRate = 1; // 1% error rate SLO
  const sloRps = 100; // 100 requests per second SLO
  
  const latencySloMet = avgLatency <= sloLatency;
  const errorSloMet = errorRate <= sloErrorRate;
  const rpsSloMet = (totalRequests / (testDetails.duration / 1000)) >= sloRps;
  
  summaryMd += `\n## SLO Evaluation\n\n`;
  summaryMd += `- **Latency SLO (<${sloLatency}ms):** ${latencySloMet ? '✅ PASS' : '❌ FAIL'}\n`;
  summaryMd += `- **Error Rate SLO (<${sloErrorRate}%):** ${errorSloMet ? '✅ PASS' : '❌ FAIL'}\n`;
  summaryMd += `- **Throughput SLO (>${sloRps} req/s):** ${rpsSloMet ? '✅ PASS' : '❌ FAIL'}\n`;
  
  summaryMd += `\n## Recommendations\n\n`;
  
  if (!latencySloMet) {
    summaryMd += `- **High Latency**: The average latency of ${avgLatency}ms exceeds our SLO of ${sloLatency}ms. Consider optimizing database queries, implementing caching, or scaling up resources.\n`;
  }
  
  if (!errorSloMet) {
    summaryMd += `- **High Error Rate**: The error rate of ${errorRate}% exceeds our SLO of ${sloErrorRate}%. Investigate error logs to identify the root cause.\n`;
  }
  
  if (!rpsSloMet) {
    summaryMd += `- **Low Throughput**: The system is not meeting our throughput SLO of ${sloRps} req/s. Consider scaling horizontally or optimizing request handling.\n`;
  }
  
  fs.writeFileSync(path.join(reportDir, 'summary.md'), summaryMd);
  
  // Generate charts using Chart.js and canvas
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Latency chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(r => r.title || r.url.split('/').pop()),
      datasets: [{
        label: 'Average Latency (ms)',
        data: results.map(r => r.latency.average),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'P95 Latency (ms)',
        data: results.map(r => r.latency.p95),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Latency (ms)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Endpoint Latency Comparison'
        }
      }
    }
  });
  
  const latencyChartPath = path.join(reportDir, 'latency-chart.png');
  const latencyOut = fs.createWriteStream(latencyChartPath);
  const latencyStream = canvas.createPNGStream();
  latencyStream.pipe(latencyOut);
  
  // Wait for the stream to finish
  await new Promise((resolve) => {
    latencyOut.on('finish', resolve);
  });
  
  // Throughput chart
  ctx.clearRect(0, 0, width, height);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(r => r.title || r.url.split('/').pop()),
      datasets: [{
        label: 'Requests/sec',
        data: results.map(r => r.requests.average),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Requests/sec'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Endpoint Throughput Comparison'
        }
      }
    }
  });
  
  const throughputChartPath = path.join(reportDir, 'throughput-chart.png');
  const throughputOut = fs.createWriteStream(throughputChartPath);
  const throughputStream = canvas.createPNGStream();
  throughputStream.pipe(throughputOut);
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluxori Load Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .pass {
      color: green;
      font-weight: bold;
    }
    .fail {
      color: red;
      font-weight: bold;
    }
    .chart-container {
      margin: 20px 0;
      text-align: center;
    }
    .chart {
      max-width: 100%;
      height: auto;
    }
    .summary-box {
      background-color: #f0f7ff;
      border: 1px solid #cce3ff;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>Fluxori Load Test Report</h1>
  <p><strong>Date:</strong> ${new Date().toISOString()}</p>
  
  <div class="summary-box">
    <h2>Test Configuration</h2>
    <ul>
      <li><strong>Target:</strong> ${testDetails.target}</li>
      <li><strong>Scenario:</strong> ${testDetails.scenario}</li>
      <li><strong>Users:</strong> ${testDetails.users}</li>
      <li><strong>Duration:</strong> ${testDetails.duration / 1000} seconds</li>
      <li><strong>Region:</strong> ${testDetails.region}</li>
    </ul>
  </div>
  
  <h2>Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Endpoint</th>
        <th>Requests/sec</th>
        <th>Latency (avg)</th>
        <th>Latency (p95)</th>
        <th>Errors</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(result => `
        <tr>
          <td>${result.title || result.url}</td>
          <td>${result.requests.average}</td>
          <td>${result.latency.average.toFixed(2)}ms</td>
          <td>${result.latency.p95.toFixed(2)}ms</td>
          <td>${result.errors || 0}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Overall Performance</h2>
  <ul>
    <li><strong>Total Requests:</strong> ${totalRequests}</li>
    <li><strong>Average Latency:</strong> ${avgLatency}ms</li>
    <li><strong>Error Rate:</strong> ${errorRate}%</li>
    <li><strong>Total Throughput:</strong> ${throughput}MB</li>
  </ul>
  
  <h2>SLO Evaluation</h2>
  <ul>
    <li><strong>Latency SLO (&lt;${sloLatency}ms):</strong> <span class="${latencySloMet ? 'pass' : 'fail'}">${latencySloMet ? 'PASS' : 'FAIL'}</span></li>
    <li><strong>Error Rate SLO (&lt;${sloErrorRate}%):</strong> <span class="${errorSloMet ? 'pass' : 'fail'}">${errorSloMet ? 'PASS' : 'FAIL'}</span></li>
    <li><strong>Throughput SLO (&gt;${sloRps} req/s):</strong> <span class="${rpsSloMet ? 'pass' : 'fail'}">${rpsSloMet ? 'PASS' : 'FAIL'}</span></li>
  </ul>
  
  <h2>Charts</h2>
  
  <div class="chart-container">
    <h3>Endpoint Latency Comparison</h3>
    <img src="latency-chart.png" alt="Latency Chart" class="chart">
  </div>
  
  <div class="chart-container">
    <h3>Endpoint Throughput Comparison</h3>
    <img src="throughput-chart.png" alt="Throughput Chart" class="chart">
  </div>
  
  <h2>Recommendations</h2>
  <ul>
    ${!latencySloMet ? `<li><strong>High Latency</strong>: The average latency of ${avgLatency}ms exceeds our SLO of ${sloLatency}ms. Consider optimizing database queries, implementing caching, or scaling up resources.</li>` : ''}
    ${!errorSloMet ? `<li><strong>High Error Rate</strong>: The error rate of ${errorRate}% exceeds our SLO of ${sloErrorRate}%. Investigate error logs to identify the root cause.</li>` : ''}
    ${!rpsSloMet ? `<li><strong>Low Throughput</strong>: The system is not meeting our throughput SLO of ${sloRps} req/s. Consider scaling horizontally or optimizing request handling.</li>` : ''}
  </ul>
  
  <p><em>Report generated at ${new Date().toISOString()}</em></p>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(reportDir, 'report.html'), htmlReport);
  
  console.log(`\nReport generated in ${reportDir}`);
  console.log(`- Summary: ${path.join(reportDir, 'summary.md')}`);
  console.log(`- HTML Report: ${path.join(reportDir, 'report.html')}`);
  console.log(`- Raw Data: ${path.join(reportDir, 'results.json')}`);
  
  return reportDir;
}

// Main function to run the load test
async function runLoadTest() {
  console.log(`
╔═════════════════════════════════════════════════╗
║       FLUXORI LOAD TESTING - SOUTH AFRICA       ║
╚═════════════════════════════════════════════════╝
  `);
  
  console.log(`Configuration:`);
  console.log(`- Target: ${options.target}`);
  console.log(`- Scenario: ${options.scenario}`);
  console.log(`- Max Users: ${options.users}`);
  console.log(`- Duration: ${options.duration}`);
  console.log(`- Region: ${options.region}`);
  console.log(`- API URL: ${options.apiUrl}`);
  console.log(`- Frontend URL: ${options.frontendUrl}`);
  console.log(`\n`);
  
  // Get authentication token for secured endpoints
  let authToken = null;
  try {
    console.log('Getting authentication token...');
    authToken = await getAuthToken();
    console.log('Authentication token acquired');
  } catch (error) {
    console.error('Failed to get authentication token:', error.message);
    console.log('Continuing with public endpoints only...');
  }
  
  const startTime = Date.now();
  const results = [];
  
  // Test API endpoints
  if (options.target === 'api' || options.target === 'all') {
    console.log('\nTesting API endpoints...');
    
    // Create weighted distribution of endpoints
    const endpointDistribution = createEndpointDistribution(apiEndpoints);
    const selectedEndpoints = [];
    
    // Select random endpoints based on their weight
    const numEndpointsToTest = Math.min(5, apiEndpoints.length);
    for (let i = 0; i < numEndpointsToTest; i++) {
      const randomIndex = Math.floor(Math.random() * endpointDistribution.length);
      const endpoint = endpointDistribution[randomIndex];
      
      // Avoid duplicates
      if (!selectedEndpoints.some(e => e.path === endpoint.path && e.method === endpoint.method)) {
        selectedEndpoints.push(endpoint);
      }
    }
    
    // Run tests for selected endpoints
    for (const endpoint of selectedEndpoints) {
      if (!endpoint.public && !authToken) {
        console.log(`Skipping authenticated endpoint: ${endpoint.method} ${endpoint.path}`);
        continue;
      }
      
      const result = await runEndpointTest(
        options.apiUrl, 
        endpoint, 
        authToken,
        options.region
      );
      
      results.push(result);
    }
  }
  
  // Test frontend
  if (options.target === 'frontend' || options.target === 'all') {
    console.log('\nTesting frontend...');
    
    // Just test the main page for now
    const result = await runEndpointTest(
      options.frontendUrl,
      { path: '/', method: 'GET', public: true },
      null,
      options.region
    );
    
    results.push(result);
  }
  
  const endTime = Date.now();
  const testDuration = endTime - startTime;
  
  console.log(`\nTests completed in ${testDuration / 1000} seconds`);
  
  // Generate report
  generateReport(results, {
    target: options.target,
    scenario: options.scenario,
    users: options.users,
    duration: parseDuration(options.duration),
    region: options.region
  });
}

// Run the load test
runLoadTest().catch(error => {
  console.error('Load test failed:', error);
  process.exit(1);
});