/**
 * Integration Tests - Report Generator
 *
 * Generates an HTML report from Jest test results for use in CI/CD environments.
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

// Configuration
const config = {
  junitReportPath: path.join(__dirname, "reports", "junit.xml"),
  htmlReportPath: path.join(
    __dirname,
    "reports",
    "integration-test-report.html",
  ),
  dashboardReportPath: path.join(__dirname, "reports", "dashboard.html"),
};

// Check if the JUnit report exists
if (!fs.existsSync(config.junitReportPath)) {
  console.error(
    chalk.red(`JUnit report not found at ${config.junitReportPath}`),
  );
  console.error(chalk.yellow("Make sure to run tests with the --ci flag"));
  process.exit(1);
}

// Read the JUnit report
const junitXml = fs.readFileSync(config.junitReportPath, "utf8");

// Parse the XML (simplified for demo)
const parseJunitXml = (xml) => {
  // In a real implementation, use an XML parser
  // For this example, we'll just extract some basic information

  const testsuites = xml.match(/<testsuites.*?>/);
  const testsuitesAttr = testsuites
    ? testsuites[0].match(/tests="(\d+)" failures="(\d+)"/)
    : null;

  const totalTests = testsuitesAttr ? parseInt(testsuitesAttr[1], 10) : 0;
  const failedTests = testsuitesAttr ? parseInt(testsuitesAttr[2], 10) : 0;
  const passedTests = totalTests - failedTests;

  // Extract test cases
  const testCaseRegex = /<testcase.*?<\/testcase>/gs;
  const testCaseMatches = [...xml.matchAll(testCaseRegex)];

  const testCases = testCaseMatches.map((match) => {
    const caseText = match[0];
    const nameMatch = caseText.match(/name="([^"]+)"/);
    const classNameMatch = caseText.match(/classname="([^"]+)"/);
    const timeMatch = caseText.match(/time="([^"]+)"/);

    const name = nameMatch ? nameMatch[1] : "Unknown";
    const className = classNameMatch ? classNameMatch[1] : "Unknown";
    const time = timeMatch ? parseFloat(timeMatch[1]) : 0;

    const failureMatch = caseText.match(/<failure.*?>(.*?)<\/failure>/s);
    const failed = !!failureMatch;
    const failureMessage = failureMatch ? failureMatch[1] : "";

    return {
      name,
      className,
      time,
      failed,
      failureMessage,
    };
  });

  return {
    totalTests,
    passedTests,
    failedTests,
    testCases,
  };
};

const testResults = parseJunitXml(junitXml);

// Generate HTML report
const generateHtmlReport = (results) => {
  const passPercent =
    results.totalTests > 0
      ? Math.round((results.passedTests / results.totalTests) * 100)
      : 0;

  // Group tests by class
  const testsByClass = {};
  results.testCases.forEach((test) => {
    if (!testsByClass[test.className]) {
      testsByClass[test.className] = [];
    }
    testsByClass[test.className].push(test);
  });

  // Calculate class-level statistics
  const classStats = Object.keys(testsByClass).map((className) => {
    const tests = testsByClass[className];
    const totalTests = tests.length;
    const failedTests = tests.filter((t) => t.failed).length;
    const passedTests = totalTests - failedTests;
    const passPercent =
      totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      className,
      totalTests,
      passedTests,
      failedTests,
      passPercent,
    };
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluxori Integration Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      margin-bottom: 2rem;
      text-align: center;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-value {
      font-size: 2rem;
      font-weight: bold;
    }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    .test-classes {
      margin-bottom: 2rem;
    }
    .test-class {
      margin-bottom: 1rem;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      overflow: hidden;
    }
    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: #f8f9fa;
      cursor: pointer;
    }
    .class-tests {
      padding: 0.75rem 1rem;
    }
    .test-case {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
    .test-case:last-child {
      border-bottom: none;
    }
    .test-passed { border-left: 5px solid #28a745; }
    .test-failed { border-left: 5px solid #dc3545; }
    .test-name {
      font-weight: bold;
    }
    .test-time {
      color: #6c757d;
      font-size: 0.875rem;
    }
    .failure-message {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background-color: #f8d7da;
      border-radius: 3px;
      color: #721c24;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .progress-bar {
      height: 8px;
      border-radius: 4px;
      background-color: #e9ecef;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-value {
      height: 100%;
      background-color: #28a745;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      color: #6c757d;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Fluxori Integration Test Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </header>
  
  <section class="summary">
    <div class="summary-item">
      <div class="summary-value">${results.totalTests}</div>
      <div>Total Tests</div>
    </div>
    <div class="summary-item">
      <div class="summary-value pass">${results.passedTests}</div>
      <div>Passed Tests</div>
    </div>
    <div class="summary-item">
      <div class="summary-value fail">${results.failedTests}</div>
      <div>Failed Tests</div>
    </div>
    <div class="summary-item">
      <div class="summary-value ${passPercent >= 90 ? "pass" : "fail"}">${passPercent}%</div>
      <div>Pass Rate</div>
    </div>
  </section>
  
  <section class="test-classes">
    <h2>Test Classes</h2>
    
    ${classStats
      .map(
        (cls) => `
      <div class="test-class">
        <div class="class-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
          <div>${cls.className} (${cls.passedTests}/${cls.totalTests})</div>
          <div>${cls.passPercent}%</div>
        </div>
        <div class="progress-bar">
          <div class="progress-value" style="width: ${cls.passPercent}%"></div>
        </div>
        <div class="class-tests" style="display: none;">
          ${testsByClass[cls.className]
            .map(
              (test) => `
            <div class="test-case ${test.failed ? "test-failed" : "test-passed"}">
              <div class="test-name">${test.name}</div>
              <div class="test-time">${test.time.toFixed(3)}s</div>
              ${test.failed ? `<div class="failure-message">${test.failureMessage}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `,
      )
      .join("")}
  </section>
  
  <footer class="footer">
    <p>Fluxori Integration Tests &copy; 2025</p>
  </footer>
  
  <script>
    // Simple script to toggle test class details
    document.querySelectorAll('.class-header').forEach(header => {
      header.addEventListener('click', () => {
        const testList = header.nextElementSibling.nextElementSibling;
        testList.style.display = testList.style.display === 'none' ? 'block' : 'none';
      });
    });
  </script>
</body>
</html>
  `;

  return html;
};

// Generate dashboard report
const generateDashboardReport = (results) => {
  // Simplified dashboard for demo
  const passPercent =
    results.totalTests > 0
      ? Math.round((results.passedTests / results.totalTests) * 100)
      : 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluxori Test Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    .status {
      font-size: 5rem;
      margin: 2rem 0;
    }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    .gauge {
      width: 200px;
      height: 100px;
      margin: 2rem auto;
      position: relative;
      overflow: hidden;
    }
    .gauge-background {
      width: 200px;
      height: 200px;
      border-radius: 100px;
      background: #eee;
      position: absolute;
      top: 0;
    }
    .gauge-value {
      width: 200px;
      height: 200px;
      border-radius: 100px;
      background: #28a745;
      position: absolute;
      top: 0;
      transform-origin: center bottom;
    }
    .gauge-center {
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 60px;
      position: absolute;
      top: 40px;
      left: 40px;
      text-align: center;
      line-height: 120px;
      font-size: 2rem;
      font-weight: bold;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 2rem 0;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
    }
    .footer {
      margin-top: 2rem;
      color: #6c757d;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <h1>Fluxori Integration Test Dashboard</h1>
  <p>Latest results from ${new Date().toLocaleString()}</p>
  
  <div class="status ${results.failedTests === 0 ? "pass" : "fail"}">
    ${results.failedTests === 0 ? "✓" : "✗"}
  </div>
  
  <h2>${results.failedTests === 0 ? "All Tests Passed" : "Tests Failed"}</h2>
  
  <div class="gauge">
    <div class="gauge-background"></div>
    <div class="gauge-value" style="transform: rotate(${180 - passPercent * 1.8}deg)"></div>
    <div class="gauge-center">${passPercent}%</div>
  </div>
  
  <div class="stats">
    <div class="stat-item">
      <div class="stat-value">${results.totalTests}</div>
      <div>Total</div>
    </div>
    <div class="stat-item">
      <div class="stat-value pass">${results.passedTests}</div>
      <div>Passed</div>
    </div>
    <div class="stat-item">
      <div class="stat-value fail">${results.failedTests}</div>
      <div>Failed</div>
    </div>
  </div>
  
  <p><a href="integration-test-report.html">View Full Report</a></p>
  
  <div class="footer">
    <p>Generated by Fluxori Integration Test System</p>
  </div>
</body>
</html>
  `;

  return html;
};

// Write the HTML reports
try {
  const htmlReport = generateHtmlReport(testResults);
  fs.writeFileSync(config.htmlReportPath, htmlReport);

  const dashboardReport = generateDashboardReport(testResults);
  fs.writeFileSync(config.dashboardReportPath, dashboardReport);

  console.log(chalk.green(`HTML report generated: ${config.htmlReportPath}`));
  console.log(
    chalk.green(`Dashboard generated: ${config.dashboardReportPath}`),
  );
} catch (error) {
  console.error(chalk.red("Failed to generate report:"), error);
  process.exit(1);
}
