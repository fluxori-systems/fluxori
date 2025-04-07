/**
 * Load Balancer Failover Test Script
 * 
 * This script tests the failover capability of the load balancer
 * by simulating failures in Cloud Run services and checking if the
 * load balancer properly routes traffic to healthy instances.
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  project: process.env.GCP_PROJECT_ID || '',
  region: process.env.REGION || 'africa-south1',
  services: ['fluxori-backend', 'fluxori-frontend'],
  apiEndpoint: process.env.API_ENDPOINT || 'https://api.fluxori.com',
  loadBalancerIp: process.env.LOAD_BALANCER_IP || '',
  testDurationSec: 60,
  requestsPerSecond: 10,
  logDir: path.join(__dirname, 'results'),
};

// Ensure log directory exists
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

// Helper to format date for filenames
const getDateFormatted = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
};

// Log file
const logFile = path.join(config.logDir, `failover_test_${getDateFormatted()}.log`);
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
};

// Initialize log file
fs.writeFileSync(logFile, `Load Balancer Failover Test - ${new Date().toISOString()}\n\n`);
log(`Test Configuration: ${JSON.stringify(config, null, 2)}`);

// Function to make HTTP requests and measure response time
const makeRequest = async (url, expectedStatus = 200) => {
  const startTime = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Accept any status code
    });
    
    const responseTime = Date.now() - startTime;
    return {
      success: response.status === expectedStatus,
      status: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      responseTime,
    };
  }
};

// Function to disable a single instance of a Cloud Run service
const disableServiceInstance = async (service) => {
  log(`Disabling an instance of service: ${service}...`);
  
  try {
    // Get current instances
    const instancesOutput = execSync(
      `gcloud run services describe ${service} --region=${config.region} --project=${config.project} --format=json`
    ).toString();
    
    const serviceConfig = JSON.parse(instancesOutput);
    const currentInstances = serviceConfig.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 
      serviceConfig.status?.address?.url || 'Unknown' : 'Not Ready';
    
    log(`Current service status: ${currentInstances}`);
    
    // Scale service down to 1 instance
    execSync(
      `gcloud run services update ${service} --region=${config.region} --project=${config.project} --min-instances=1 --max-instances=1`
    );
    
    log(`Scaled ${service} to 1 instance`);
    
    // Make service unhealthy (you would implement a way to make the service unhealthy - for demo we'll just stop it)
    execSync(
      `gcloud run services update ${service} --region=${config.region} --project=${config.project} --clear-env-vars --set-env-vars=SIMULATE_FAILURE=true`
    );
    
    log(`Set environment variables to simulate failure for ${service}`);
    
    return true;
  } catch (error) {
    log(`Error disabling service instance: ${error.message}`);
    return false;
  }
};

// Function to restore service to normal operation
const restoreService = async (service) => {
  log(`Restoring service: ${service}...`);
  
  try {
    // Reset environment variables and scaling
    execSync(
      `gcloud run services update ${service} --region=${config.region} --project=${config.project} --clear-env-vars`
    );
    
    execSync(
      `gcloud run services update ${service} --region=${config.region} --project=${config.project} --min-instances=0 --max-instances=10`
    );
    
    log(`Restored ${service} to normal operation`);
    
    return true;
  } catch (error) {
    log(`Error restoring service: ${error.message}`);
    return false;
  }
};

// Function to simulate load during the test
const simulateLoad = async (duration, requestsPerSecond, url) => {
  log(`Simulating load on ${url} for ${duration} seconds at ${requestsPerSecond} requests per second...`);
  
  const totalRequests = duration * requestsPerSecond;
  const results = {
    totalRequests,
    successCount: 0,
    failureCount: 0,
    responseTimes: [],
    statusCodes: {},
  };
  
  const interval = 1000 / requestsPerSecond;
  
  for (let i = 0; i < totalRequests; i++) {
    // Stagger requests to achieve desired RPS
    await new Promise(resolve => setTimeout(resolve, interval));
    
    const result = await makeRequest(url);
    
    // Record statistics
    if (result.success) {
      results.successCount++;
    } else {
      results.failureCount++;
    }
    
    results.responseTimes.push(result.responseTime);
    
    const statusKey = result.status.toString();
    results.statusCodes[statusKey] = (results.statusCodes[statusKey] || 0) + 1;
    
    // Log progress periodically
    if (i % 10 === 0) {
      log(`Progress: ${i}/${totalRequests} requests completed`);
    }
  }
  
  // Calculate statistics
  results.averageResponseTime = results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length;
  results.minResponseTime = Math.min(...results.responseTimes);
  results.maxResponseTime = Math.max(...results.responseTimes);
  results.medianResponseTime = results.responseTimes.sort((a, b) => a - b)[Math.floor(results.responseTimes.length / 2)];
  results.successRate = (results.successCount / results.totalRequests) * 100;
  
  log(`Load test completed. ${results.successCount}/${results.totalRequests} requests successful (${results.successRate.toFixed(2)}%)`);
  
  return results;
};

// Main test function
const runFailoverTest = async () => {
  log('Starting load balancer failover test...');
  
  // Baseline test
  log('Running baseline test...');
  const baselineResults = await simulateLoad(
    config.testDurationSec / 2,
    config.requestsPerSecond,
    config.apiEndpoint + '/health'
  );
  
  log(`Baseline results: ${JSON.stringify(baselineResults, null, 2)}`);
  
  // Disable a service instance
  const serviceToDisable = config.services[0];
  await disableServiceInstance(serviceToDisable);
  
  // Wait a moment for the change to propagate
  log('Waiting for service disruption to take effect...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Failover test
  log('Running failover test...');
  const failoverResults = await simulateLoad(
    config.testDurationSec,
    config.requestsPerSecond,
    config.apiEndpoint + '/health'
  );
  
  log(`Failover results: ${JSON.stringify(failoverResults, null, 2)}`);
  
  // Restore service
  await restoreService(serviceToDisable);
  
  // Recovery test
  log('Waiting for service to recover...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  log('Running recovery test...');
  const recoveryResults = await simulateLoad(
    config.testDurationSec / 2,
    config.requestsPerSecond,
    config.apiEndpoint + '/health'
  );
  
  log(`Recovery results: ${JSON.stringify(recoveryResults, null, 2)}`);
  
  // Analyze results
  const analysis = {
    baselineSuccessRate: baselineResults.successRate,
    failoverSuccessRate: failoverResults.successRate,
    recoverySuccessRate: recoveryResults.successRate,
    baselineAvgResponseTime: baselineResults.averageResponseTime,
    failoverAvgResponseTime: failoverResults.averageResponseTime,
    recoveryAvgResponseTime: recoveryResults.averageResponseTime,
    successRateDrop: baselineResults.successRate - failoverResults.successRate,
    responseTimeIncrease: failoverResults.averageResponseTime - baselineResults.averageResponseTime,
    recoveryResponseTimeDiff: recoveryResults.averageResponseTime - baselineResults.averageResponseTime,
  };
  
  log(`Test Analysis: ${JSON.stringify(analysis, null, 2)}`);
  
  // Determine if the test was successful
  const testPassed = analysis.failoverSuccessRate > 95 && analysis.responseTimeIncrease < 1000;
  
  log(`Failover Test ${testPassed ? 'PASSED' : 'FAILED'}`);
  log(`Conclusion: ${testPassed ? 
    'The load balancer successfully handled the service disruption with minimal impact.' : 
    'The load balancer did not adequately handle the service disruption. Review load balancer configuration and service health checks.'}`);
  
  // Save full report
  const report = {
    configuration: config,
    timestamp: new Date().toISOString(),
    baselineResults,
    failoverResults,
    recoveryResults,
    analysis,
    testPassed,
  };
  
  const reportFile = path.join(config.logDir, `failover_report_${getDateFormatted()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`Full report saved to: ${reportFile}`);
};

// Run the test if executed directly
if (require.main === module) {
  if (!config.project) {
    console.error('Error: GCP_PROJECT_ID environment variable must be set');
    process.exit(1);
  }
  
  runFailoverTest()
    .then(() => {
      log('Test completed');
      process.exit(0);
    })
    .catch(error => {
      log(`Test failed with error: ${error.message}`);
      process.exit(1);
    });
}

// Export functions for programmatic use
module.exports = {
  runFailoverTest,
  disableServiceInstance,
  restoreService,
  simulateLoad,
};