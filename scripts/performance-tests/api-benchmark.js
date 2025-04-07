/**
 * API Performance Benchmark for Fluxori
 * 
 * This script runs benchmarks against the Fluxori API endpoints to measure 
 * performance and help with optimization. It measures response times, 
 * throughput, and error rates for different API operations.
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

// Load configuration
const config = require('./config');
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || config.defaultEnvironment;
const duration = parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1]) || 10; // in seconds
const connections = parseInt(args.find(arg => arg.startsWith('--connections='))?.split('=')[1]) || 10;
const pipelining = parseInt(args.find(arg => arg.startsWith('--pipelining='))?.split('=')[1]) || 1;
const specificEndpoint = args.find(arg => arg.startsWith('--endpoint='))?.split('=')[1];

// Create results directory
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Auth token (will be populated later)
let authToken = null;

/**
 * Performs login to get an auth token
 */
async function login() {
  try {
    const baseUrl = config.environments[env].apiBaseUrl;
    const response = await axios.post(`${baseUrl}/api/auth/login`, {
      email: config.testUsers.standard.email,
      password: config.testUsers.standard.password,
    });

    if (response.status === 200 && response.data.accessToken) {
      authToken = response.data.accessToken;
      console.log(chalk.green('Successfully logged in and obtained auth token'));
      return true;
    } else {
      console.error(chalk.red('Login successful but no token returned'));
      return false;
    }
  } catch (error) {
    console.error(chalk.red('Login failed:'), error.message);
    if (error.response) {
      console.error(chalk.red('Response status:'), error.response.status);
      console.error(chalk.red('Response data:'), error.response.data);
    }
    return false;
  }
}

/**
 * Runs a benchmark for a specific endpoint
 */
async function runBenchmark(endpoint, options = {}) {
  const baseUrl = config.environments[env].apiBaseUrl;
  const url = `${baseUrl}${endpoint}`;
  
  console.log(chalk.cyan(`Running benchmark for ${url}`));
  
  // Default options
  const defaultOptions = {
    url,
    connections,
    pipelining,
    duration,
    method: 'GET',
    headers: {},
  };
  
  // Add auth token if available
  if (authToken) {
    defaultOptions.headers.Authorization = `Bearer ${authToken}`;
  }
  
  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...options,
  };

  // Print benchmark configuration
  console.log(chalk.blue('Benchmark configuration:'));
  console.log(chalk.blue(`- URL: ${finalOptions.url}`));
  console.log(chalk.blue(`- Method: ${finalOptions.method}`));
  console.log(chalk.blue(`- Duration: ${finalOptions.duration} seconds`));
  console.log(chalk.blue(`- Connections: ${finalOptions.connections}`));
  console.log(chalk.blue(`- Pipelining: ${finalOptions.pipelining}`));
  
  // Run benchmark
  return new Promise((resolve) => {
    const instance = autocannon(finalOptions, (err, result) => {
      if (err) {
        console.error(chalk.red('Benchmark failed:'), err);
        resolve(null);
        return;
      }
      
      resolve(result);
    });
    
    // Log progress to console
    autocannon.track(instance, { renderProgressBar: true });
  });
}

/**
 * Saves benchmark results to a file
 */
async function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(resultsDir, `api-benchmark-${env}-${timestamp}.json`);
  
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(chalk.green(`Results saved to ${outputFile}`));

  // Also save a human-readable summary
  const summaryFile = path.join(resultsDir, `api-benchmark-summary-${env}-${timestamp}.txt`);
  
  let summaryContent = `Fluxori API Benchmark Summary\n`;
  summaryContent += `===============================\n`;
  summaryContent += `Environment: ${env} (${config.environments[env].apiBaseUrl})\n`;
  summaryContent += `Timestamp: ${new Date().toISOString()}\n`;
  summaryContent += `Duration: ${duration} seconds\n`;
  summaryContent += `Connections: ${connections}\n\n`;
  
  Object.entries(results.endpoints).forEach(([name, result]) => {
    if (!result) return;
    
    summaryContent += `${name}:\n`;
    summaryContent += `  URL: ${result.url}\n`;
    summaryContent += `  Method: ${result.method || 'GET'}\n`;
    summaryContent += `  Requests/sec: ${result.requests.average.toFixed(2)}\n`;
    summaryContent += `  Latency (avg): ${result.latency.average.toFixed(2)}ms\n`;
    summaryContent += `  Latency (p99): ${result.latency.p99.toFixed(2)}ms\n`;
    summaryContent += `  Errors: ${result.errors || 0}\n`;
    summaryContent += `  Status Codes: ${JSON.stringify(result.statusCodeStats)}\n\n`;
  });
  
  fs.writeFileSync(summaryFile, summaryContent);
  console.log(chalk.green(`Summary saved to ${summaryFile}`));
  
  return outputFile;
}

/**
 * Runs all endpoint benchmarks
 */
async function runAllBenchmarks() {
  console.log(chalk.bold.green('Starting API Performance Benchmarks'));
  console.log(chalk.bold.green('================================'));
  console.log(chalk.blue(`Environment: ${env} (${config.environments[env].apiBaseUrl})`));
  console.log(chalk.blue(`Duration: ${duration} seconds per endpoint`));
  console.log(chalk.blue(`Connections: ${connections}`));
  console.log(chalk.bold.green('================================\n'));
  
  // Make sure we have an auth token
  const loggedIn = await login();
  if (!loggedIn && !specificEndpoint) {
    console.error(chalk.red('Failed to log in. Only testing public endpoints.'));
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: env,
    duration,
    connections,
    endpoints: {},
  };
  
  // If a specific endpoint is specified, only test that one
  if (specificEndpoint) {
    const [name, endpoint] = specificEndpoint.split(':');
    if (!endpoint) {
      console.error(chalk.red('Invalid endpoint format. Use name:endpoint, e.g., "Health Check:/health"'));
      process.exit(1);
    }
    
    console.log(chalk.magenta(`Testing specific endpoint: ${name} (${endpoint})`));
    const result = await runBenchmark(endpoint);
    if (result) {
      results.endpoints[name] = result;
      results.endpoints[name].url = endpoint;
    }
  } else {
    // Test public endpoints
    const publicEndpoints = [
      { name: 'Health Check', endpoint: '/health' },
      { name: 'API Status', endpoint: '/api/status' },
    ];
    
    // Test authenticated endpoints (if we have a token)
    const authenticatedEndpoints = loggedIn ? [
      { name: 'List Products', endpoint: '/api/inventory/products' },
      { name: 'User Profile', endpoint: '/api/users/profile' },
      { name: 'List Organizations', endpoint: '/api/organizations' },
      { name: 'List Marketplaces', endpoint: '/api/marketplaces' },
    ] : [];
    
    // Run benchmarks for public endpoints
    for (const endpoint of publicEndpoints) {
      console.log(chalk.magenta(`\nTesting ${endpoint.name}...`));
      const result = await runBenchmark(endpoint.endpoint);
      if (result) {
        results.endpoints[endpoint.name] = result;
        results.endpoints[endpoint.name].url = endpoint.endpoint;
        results.endpoints[endpoint.name].method = 'GET';
      }
    }
    
    // Run benchmarks for authenticated endpoints
    for (const endpoint of authenticatedEndpoints) {
      console.log(chalk.magenta(`\nTesting ${endpoint.name}...`));
      const result = await runBenchmark(endpoint.endpoint);
      if (result) {
        results.endpoints[endpoint.name] = result;
        results.endpoints[endpoint.name].url = endpoint.endpoint;
        results.endpoints[endpoint.name].method = 'GET';
        results.endpoints[endpoint.name].authenticated = true;
      }
    }
  }
  
  // Save results
  await saveResults(results);
  
  // Print summary
  console.log(chalk.bold.green('\nBenchmark Summary:'));
  console.log(chalk.bold.green('=================='));
  
  Object.entries(results.endpoints).forEach(([name, result]) => {
    if (!result) return;
    
    console.log(chalk.bold(`${name}:`));
    console.log(chalk.cyan(`  Average Latency: ${result.latency.average.toFixed(2)}ms`));
    console.log(chalk.cyan(`  p99 Latency: ${result.latency.p99.toFixed(2)}ms`));
    console.log(chalk.cyan(`  Requests/sec: ${result.requests.average.toFixed(2)}`));
    console.log(chalk.cyan(`  Errors: ${result.errors || 0}`));
    console.log(chalk.cyan(`  Status Codes: ${JSON.stringify(result.statusCodeStats || {})}`));
    console.log('');
  });
}

// Run all benchmarks
runAllBenchmarks().catch(console.error);