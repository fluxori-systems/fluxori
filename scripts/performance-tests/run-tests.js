/**
 * Performance Test Runner for Fluxori
 * 
 * This script runs performance tests against the Fluxori API
 * using k6 (https://k6.io/) as the testing framework.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');

// CLI arguments
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || config.defaultEnvironment;
const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];
const duration = args.find(arg => arg.startsWith('--duration='))?.split('=')[1] || 'default';
const concurrency = args.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] || 'default';
const rate = args.find(arg => arg.startsWith('--rate='))?.split('=')[1] || 'default';
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

// Ensure the environment is valid
if (!config.environments[env]) {
  console.error(`Error: Environment "${env}" not found in config.`);
  console.error(`Available environments: ${Object.keys(config.environments).join(', ')}`);
  process.exit(1);
}

// Get the environment configuration
const envConfig = config.environments[env];

// Determine which scenarios to run
let scenariosToRun = [];
if (scenario) {
  if (!config.scenarios[scenario]) {
    console.error(`Error: Scenario "${scenario}" not found in config.`);
    console.error(`Available scenarios: ${Object.keys(config.scenarios).join(', ')}`);
    process.exit(1);
  }
  scenariosToRun = [scenario];
} else {
  scenariosToRun = Object.keys(config.scenarios);
}

// Create temporary directory for k6 scripts
const tempDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Create results directory
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Get test parameters
const durationSeconds = config.duration[duration] || config.duration.default;
const vus = config.concurrency[concurrency] || config.concurrency.default;
const requestRate = config.rate[rate] || config.rate.default;

console.log(`=== Fluxori Performance Test Runner ===`);
console.log(`Environment: ${env} (${envConfig.apiBaseUrl})`);
console.log(`Scenarios: ${scenariosToRun.join(', ')}`);
console.log(`Duration: ${durationSeconds} seconds`);
console.log(`Concurrency: ${vus} virtual users`);
console.log(`Rate: ${requestRate} requests per second`);
console.log('=======================================\n');

// Run tests for each scenario
const testResults = {};

for (const scenarioName of scenariosToRun) {
  const scenarioConfig = config.scenarios[scenarioName];
  console.log(`\nRunning scenario: ${scenarioName}`);
  
  // Create k6 script for this scenario
  const scriptPath = path.join(tempDir, `${scenarioName}.js`);
  
  let k6Script = `
  import http from 'k6/http';
  import { check, sleep } from 'k6';
  import { Rate, Trend } from 'k6/metrics';
  import { SharedArray } from 'k6/data';
  
  // Define custom metrics
  const errorRate = new Rate('error_rate');
  const scenarioTrend = new Trend('${scenarioName}_response_time');
  
  // Configuration
  export const options = {
    scenarios: {
      ${scenarioName}: {
        executor: 'constant-arrival-rate',
        rate: ${requestRate},
        timeUnit: '1s',
        duration: '${durationSeconds}s',
        preAllocatedVUs: ${vus},
        maxVUs: ${vus * 2},
      },
    },
    thresholds: {
      'error_rate': ['rate<${config.thresholds.errorRate.max}'],
      'http_req_duration': [
        'p(50)<${config.thresholds.responseTime.p50}',
        'p(90)<${config.thresholds.responseTime.p90}',
        'p(95)<${config.thresholds.responseTime.p95}',
        'p(99)<${config.thresholds.responseTime.p99}',
      ],
    },
  };
  
  // Test setup - login and get token
  const baseUrl = '${envConfig.apiBaseUrl}';
  let authToken = null;
  
  export function setup() {
    const loginResponse = http.post(`${baseUrl}/api/auth/login`, {
      email: '${config.testUsers.standard.email}',
      password: '${config.testUsers.standard.password}',
    });
    
    if (loginResponse.status === 200) {
      const body = JSON.parse(loginResponse.body);
      return { token: body.accessToken };
    } else {
      console.error('Login failed: ' + loginResponse.status);
      return { token: null };
    }
  }
  
  // Main test function
  export default function(data) {
    const token = data.token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? \`Bearer \${token}\` : '',
    };
    
    // Select a random endpoint from the scenario based on weights
    const endpoints = ${JSON.stringify(scenarioConfig)};
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedEndpoint = null;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        selectedEndpoint = endpoint;
        break;
      }
    }
    
    if (!selectedEndpoint) {
      selectedEndpoint = endpoints[0];
    }
    
    let url = \`\${baseUrl}\${selectedEndpoint.endpoint}\`;
    
    // Replace :id parameters with actual IDs
    if (url.includes(':id')) {
      // In a real test, you would use actual IDs from setup or data files
      // For this example, we'll just use a random ID
      url = url.replace(':id', Math.floor(Math.random() * 1000) + 1);
    }
    
    // Make the request
    let response;
    const method = (selectedEndpoint.method || 'GET').toUpperCase();
    const requestBody = selectedEndpoint.requestBody ? JSON.stringify(selectedEndpoint.requestBody) : null;
    
    switch (method) {
      case 'GET':
        response = http.get(url, { headers });
        break;
      case 'POST':
        response = http.post(url, requestBody, { headers });
        break;
      case 'PUT':
        response = http.put(url, requestBody, { headers });
        break;
      case 'DELETE':
        response = http.del(url, null, { headers });
        break;
      default:
        response = http.get(url, { headers });
    }
    
    // Record metrics
    const success = response.status >= 200 && response.status < 300;
    errorRate.add(!success);
    scenarioTrend.add(response.timings.duration);
    
    // Validate response
    check(response, {
      'status is OK': (r) => r.status >= 200 && r.status < 300,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    // Wait between requests (if needed)
    sleep(Math.random() * 1);
  }
  `;
  
  // Write script to file
  fs.writeFileSync(scriptPath, k6Script);
  
  // Run k6 test
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = outputFile || path.join(resultsDir, `${scenarioName}_${env}_${timestamp}.json`);
  
  try {
    console.log(`Executing test for ${scenarioName}...`);
    execSync(`k6 run --out json=${resultFile} ${scriptPath}`, { stdio: 'inherit' });
    console.log(`Test completed. Results saved to ${resultFile}`);
    
    // Parse results
    const rawResults = fs.readFileSync(resultFile);
    const results = JSON.parse(rawResults);
    testResults[scenarioName] = results;
    
  } catch (error) {
    console.error(`Error executing test for ${scenarioName}:`, error.message);
  }
}

// Clean up temporary files
fs.readdirSync(tempDir).forEach(file => {
  fs.unlinkSync(path.join(tempDir, file));
});
fs.rmdirSync(tempDir);

// Generate summary report
const summaryPath = path.join(resultsDir, `summary_${env}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(summaryPath, JSON.stringify(testResults, null, 2));

console.log(`\n=== Performance Test Summary ===`);
console.log(`All tests completed.`);
console.log(`Summary report saved to: ${summaryPath}`);
console.log(`===============================`);