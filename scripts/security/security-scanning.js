#!/usr/bin/env node

/**
 * Fluxori Security Scanning Script
 *
 * This script performs automated security scanning of the Fluxori platform,
 * including infrastructure configuration, network security, and application vulnerabilities.
 *
 * Features:
 * - Scans GCP IAM permissions for overly permissive settings
 * - Tests network security configurations
 * - Runs OWASP vulnerability scans against endpoints
 * - Provides a comprehensive security report with remediation steps
 *
 * Usage:
 *   node security-scanning.js --project=fluxori-prod --scan-type=full --output=./reports
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Configure command line interface
program
  .version("1.0.0")
  .requiredOption("--project <project>", "GCP project ID")
  .option("--scan-type <type>", "Type of scan: iam, network, app, full", "full")
  .option("--output <dir>", "Output directory for reports", "./reports")
  .option("--api-url <url>", "API URL to scan", "https://api.fluxori.com")
  .option("--verbose", "Enable verbose output")
  .parse(process.argv);

const options = program.opts();

// Create output directory
const outputDir = path.resolve(options.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Logging utility
function log(message, type = "info") {
  const timestamp = new Date().toISOString();

  switch (type) {
    case "info":
      console.log(`[${timestamp}] [INFO] ${message}`);
      break;
    case "warning":
      console.warn(`[${timestamp}] [WARN] ${message}`);
      break;
    case "error":
      console.error(`[${timestamp}] [ERROR] ${message}`);
      break;
    case "success":
      console.log(`[${timestamp}] [SUCCESS] ${message}`);
      break;
    default:
      console.log(`[${timestamp}] ${message}`);
  }
}

// Run IAM Security Scan
async function scanIamSecurity() {
  log("Starting IAM security scan...");

  try {
    // Check for over-privileged service accounts
    log("Checking for over-privileged service accounts...");
    const serviceAccountsCmd = `gcloud projects get-iam-policy ${options.project} --format=json`;
    const { stdout: iamPolicyOutput } = await execAsync(serviceAccountsCmd);
    const iamPolicy = JSON.parse(iamPolicyOutput);

    const iamIssues = [];

    // Check for roles that might be too permissive
    const highRiskRoles = [
      "roles/owner",
      "roles/editor",
      "roles/iam.securityAdmin",
      "roles/iam.serviceAccountUser",
      "roles/iam.serviceAccountAdmin",
      "roles/storage.admin",
      "roles/datastore.admin",
    ];

    for (const binding of iamPolicy.bindings) {
      if (highRiskRoles.includes(binding.role)) {
        for (const member of binding.members) {
          iamIssues.push({
            severity: "HIGH",
            resource: member,
            issue: `Has highly privileged role: ${binding.role}`,
            remediation: `Consider using more granular roles for ${member} instead of ${binding.role}`,
          });
        }
      }
    }

    // Check for public access
    for (const binding of iamPolicy.bindings) {
      if (
        binding.members.some(
          (m) => m === "allUsers" || m === "allAuthenticatedUsers",
        )
      ) {
        iamIssues.push({
          severity: "CRITICAL",
          resource: binding.role,
          issue: "Public access granted",
          remediation:
            "Remove public access (allUsers, allAuthenticatedUsers) from IAM policies",
        });
      }
    }

    // Check service account keys
    log("Checking for service account keys...");
    const { stdout: serviceAccountsList } = await execAsync(
      `gcloud iam service-accounts list --project=${options.project} --format="value(email)"`,
    );

    const serviceAccounts = serviceAccountsList.split("\n").filter(Boolean);

    for (const sa of serviceAccounts) {
      const { stdout: keysOutput } = await execAsync(
        `gcloud iam service-accounts keys list --iam-account=${sa} --project=${options.project} --format=json`,
      );

      const keys = JSON.parse(keysOutput);

      if (keys.length > 0) {
        // Check for old keys (older than 90 days)
        const oldKeys = keys.filter((key) => {
          const createTime = new Date(key.validAfterTime);
          const now = new Date();
          const ageInDays = (now - createTime) / (1000 * 60 * 60 * 24);
          return ageInDays > 90;
        });

        if (oldKeys.length > 0) {
          iamIssues.push({
            severity: "MEDIUM",
            resource: sa,
            issue: `Service account has ${oldKeys.length} keys older than 90 days`,
            remediation:
              "Rotate service account keys regularly and remove unused keys",
          });
        }
      }
    }

    // Generate IAM security report
    const iamReport = {
      timestamp: new Date().toISOString(),
      project: options.project,
      issues: iamIssues,
      summary: {
        critical: iamIssues.filter((i) => i.severity === "CRITICAL").length,
        high: iamIssues.filter((i) => i.severity === "HIGH").length,
        medium: iamIssues.filter((i) => i.severity === "MEDIUM").length,
        low: iamIssues.filter((i) => i.severity === "LOW").length,
      },
    };

    // Save report
    const iamReportPath = path.join(outputDir, "iam-security-report.json");
    fs.writeFileSync(iamReportPath, JSON.stringify(iamReport, null, 2));

    log(
      `IAM security scan completed. Found ${iamIssues.length} potential issues.`,
      iamIssues.length > 0 ? "warning" : "success",
    );
    log(`Report saved to ${iamReportPath}`);

    return iamReport;
  } catch (error) {
    log(`Error during IAM security scan: ${error.message}`, "error");
    throw error;
  }
}

// Run Network Security Scan
async function scanNetworkSecurity() {
  log("Starting network security scan...");

  try {
    const networkIssues = [];

    // Check firewall rules
    log("Checking firewall rules...");
    const { stdout: firewallOutput } = await execAsync(
      `gcloud compute firewall-rules list --project=${options.project} --format=json`,
    );

    const firewalls = JSON.parse(firewallOutput);

    // Check for overly permissive firewall rules
    for (const firewall of firewalls) {
      // Check for rules allowing all traffic from anywhere
      if (
        firewall.direction === "INGRESS" &&
        firewall.allowed &&
        firewall.sourceRanges &&
        firewall.sourceRanges.includes("0.0.0.0/0")
      ) {
        // Get the allowed protocols and ports
        const allowedTraffic = firewall.allowed
          .map((allow) => {
            const protocol = allow.IPProtocol;
            const ports = allow.ports || ["all"];
            return `${protocol}:${ports.join(",")}`;
          })
          .join("; ");

        if (
          allowedTraffic.includes("all") ||
          allowedTraffic.includes("tcp:all")
        ) {
          networkIssues.push({
            severity: "CRITICAL",
            resource: firewall.name,
            issue: `Overly permissive firewall rule allows ${allowedTraffic} from anywhere (0.0.0.0/0)`,
            remediation:
              "Restrict firewall rules to specific IP ranges and necessary ports only",
          });
        } else if (
          allowedTraffic.includes("tcp:22") ||
          allowedTraffic.includes("tcp:3389")
        ) {
          networkIssues.push({
            severity: "HIGH",
            resource: firewall.name,
            issue: `Firewall rule exposes SSH (22) or RDP (3389) to the internet: ${allowedTraffic}`,
            remediation:
              "Restrict SSH/RDP access to specific IP ranges or use IAP for secure access",
          });
        }
      }
    }

    // Check VPC Service Controls
    log("Checking VPC Service Controls...");
    try {
      const { stdout: servicePerimeterOutput } = await execAsync(
        `gcloud access-context-manager perimeters list --policy=POLICY_NUMBER --format=json`,
      );

      const perimeters = JSON.parse(servicePerimeterOutput);

      if (perimeters.length === 0) {
        networkIssues.push({
          severity: "MEDIUM",
          resource: options.project,
          issue: "No VPC Service Controls perimeters configured",
          remediation:
            "Consider implementing VPC Service Controls to restrict data exfiltration",
        });
      }
    } catch (error) {
      log(`Could not check VPC Service Controls: ${error.message}`, "warning");
      networkIssues.push({
        severity: "LOW",
        resource: options.project,
        issue: "Could not verify VPC Service Controls configuration",
        remediation:
          "Ensure VPC Service Controls are properly configured if handling sensitive data",
      });
    }

    // Check load balancer security
    log("Checking Cloud Load Balancing security...");
    try {
      const { stdout: lbOutput } = await execAsync(
        `gcloud compute target-https-proxies list --project=${options.project} --format=json`,
      );

      const loadBalancers = JSON.parse(lbOutput);

      for (const lb of loadBalancers) {
        // Check SSL policy
        try {
          const { stdout: sslPolicyOutput } = await execAsync(
            `gcloud compute target-https-proxies describe ${lb.name} --project=${options.project} --format=json`,
          );

          const lbDetails = JSON.parse(sslPolicyOutput);

          if (!lbDetails.sslPolicy) {
            networkIssues.push({
              severity: "MEDIUM",
              resource: lb.name,
              issue: "HTTPS proxy using default SSL policy",
              remediation:
                "Configure a custom SSL policy with modern and secure settings",
            });
          }
        } catch (error) {
          log(
            `Could not check SSL policy for ${lb.name}: ${error.message}`,
            "warning",
          );
        }
      }
    } catch (error) {
      log(
        `Could not check load balancer configurations: ${error.message}`,
        "warning",
      );
    }

    // Check Cloud Armor policies
    log("Checking Cloud Armor security policies...");
    try {
      const { stdout: armorOutput } = await execAsync(
        `gcloud compute security-policies list --project=${options.project} --format=json`,
      );

      const securityPolicies = JSON.parse(armorOutput);

      if (securityPolicies.length === 0) {
        networkIssues.push({
          severity: "MEDIUM",
          resource: options.project,
          issue: "No Cloud Armor security policies configured",
          remediation:
            "Implement Cloud Armor security policies to protect against common web attacks",
        });
      } else {
        // Check for WAF rules (XSS, SQLi protection)
        for (const policy of securityPolicies) {
          const { stdout: policyRulesOutput } = await execAsync(
            `gcloud compute security-policies describe ${policy.name} --project=${options.project} --format=json`,
          );

          const policyDetails = JSON.parse(policyRulesOutput);

          const hasXssProtection = policyDetails.rules.some(
            (rule) =>
              rule.match &&
              rule.match.expr &&
              rule.match.expr.expression &&
              rule.match.expr.expression.includes("xss"),
          );

          const hasSqliProtection = policyDetails.rules.some(
            (rule) =>
              rule.match &&
              rule.match.expr &&
              rule.match.expr.expression &&
              rule.match.expr.expression.includes("sqli"),
          );

          if (!hasXssProtection) {
            networkIssues.push({
              severity: "MEDIUM",
              resource: policy.name,
              issue: "Cloud Armor policy lacks XSS protection",
              remediation:
                'Add XSS protection rule using evaluatePreconfiguredExpr("xss-stable")',
            });
          }

          if (!hasSqliProtection) {
            networkIssues.push({
              severity: "MEDIUM",
              resource: policy.name,
              issue: "Cloud Armor policy lacks SQL injection protection",
              remediation:
                'Add SQL injection protection rule using evaluatePreconfiguredExpr("sqli-stable")',
            });
          }
        }
      }
    } catch (error) {
      log(`Could not check Cloud Armor policies: ${error.message}`, "warning");
    }

    // Generate network security report
    const networkReport = {
      timestamp: new Date().toISOString(),
      project: options.project,
      issues: networkIssues,
      summary: {
        critical: networkIssues.filter((i) => i.severity === "CRITICAL").length,
        high: networkIssues.filter((i) => i.severity === "HIGH").length,
        medium: networkIssues.filter((i) => i.severity === "MEDIUM").length,
        low: networkIssues.filter((i) => i.severity === "LOW").length,
      },
    };

    // Save report
    const networkReportPath = path.join(
      outputDir,
      "network-security-report.json",
    );
    fs.writeFileSync(networkReportPath, JSON.stringify(networkReport, null, 2));

    log(
      `Network security scan completed. Found ${networkIssues.length} potential issues.`,
      networkIssues.length > 0 ? "warning" : "success",
    );
    log(`Report saved to ${networkReportPath}`);

    return networkReport;
  } catch (error) {
    log(`Error during network security scan: ${error.message}`, "error");
    throw error;
  }
}

// Run Application Security Scan (simplified version - in production this would use OWASP ZAP or similar tools)
async function scanApplicationSecurity() {
  log("Starting application security scan...");

  try {
    const appIssues = [];

    // Check basic security headers
    log(`Checking security headers for ${options.apiUrl}...`);
    const { stdout: curlOutput } = await execAsync(
      `curl -sI ${options.apiUrl} | grep -i 'strict\\|content\\|x-\\|frame'`,
    );

    const headers = curlOutput.split("\n").filter(Boolean);

    // Check for important security headers
    const securityHeaders = {
      "Strict-Transport-Security": false,
      "Content-Security-Policy": false,
      "X-Content-Type-Options": false,
      "X-Frame-Options": false,
      "X-XSS-Protection": false,
    };

    for (const header of headers) {
      const headerName = header.split(":")[0].trim();
      Object.keys(securityHeaders).forEach((key) => {
        if (headerName.toLowerCase() === key.toLowerCase()) {
          securityHeaders[key] = true;
        }
      });
    }

    // Add issues for missing security headers
    Object.entries(securityHeaders).forEach(([header, present]) => {
      if (!present) {
        appIssues.push({
          severity: header === "Content-Security-Policy" ? "HIGH" : "MEDIUM",
          resource: options.apiUrl,
          issue: `Missing security header: ${header}`,
          remediation: `Add the ${header} header to API responses`,
        });
      }
    });

    // Check TLS configuration
    log(`Checking TLS configuration for ${options.apiUrl}...`);
    try {
      const { stdout: sslOutput } = await execAsync(
        `nmap --script ssl-enum-ciphers -p 443 ${options.apiUrl.replace("https://", "")}`,
      );

      if (
        sslOutput.includes("SSLv3") ||
        sslOutput.includes("TLSv1.0") ||
        sslOutput.includes("TLSv1.1")
      ) {
        appIssues.push({
          severity: "HIGH",
          resource: options.apiUrl,
          issue: "Outdated SSL/TLS protocols in use",
          remediation:
            "Disable SSLv3, TLSv1.0, and TLSv1.1, use only TLSv1.2+ with strong ciphers",
        });
      }

      if (sslOutput.includes("weak cipher")) {
        appIssues.push({
          severity: "HIGH",
          resource: options.apiUrl,
          issue: "Weak cipher suites enabled",
          remediation:
            "Disable weak cipher suites, use only strong ciphers with perfect forward secrecy",
        });
      }
    } catch (error) {
      log(`Could not check TLS configuration: ${error.message}`, "warning");
    }

    // Check for CORS issues
    log(`Checking CORS configuration for ${options.apiUrl}...`);
    const { stdout: corsOutput } = await execAsync(
      `curl -sI -H "Origin: http://evil.com" ${options.apiUrl} | grep -i "Access-Control-Allow-Origin"`,
    );

    if (corsOutput.includes("*")) {
      appIssues.push({
        severity: "HIGH",
        resource: options.apiUrl,
        issue:
          "CORS allows requests from any origin (Access-Control-Allow-Origin: *)",
        remediation: "Restrict CORS to specific trusted origins only",
      });
    }

    // Generate application security report
    const appReport = {
      timestamp: new Date().toISOString(),
      project: options.project,
      apiUrl: options.apiUrl,
      issues: appIssues,
      summary: {
        critical: appIssues.filter((i) => i.severity === "CRITICAL").length,
        high: appIssues.filter((i) => i.severity === "HIGH").length,
        medium: appIssues.filter((i) => i.severity === "MEDIUM").length,
        low: appIssues.filter((i) => i.severity === "LOW").length,
      },
    };

    // Save report
    const appReportPath = path.join(outputDir, "app-security-report.json");
    fs.writeFileSync(appReportPath, JSON.stringify(appReport, null, 2));

    log(
      `Application security scan completed. Found ${appIssues.length} potential issues.`,
      appIssues.length > 0 ? "warning" : "success",
    );
    log(`Report saved to ${appReportPath}`);

    return appReport;
  } catch (error) {
    log(`Error during application security scan: ${error.message}`, "error");
    throw error;
  }
}

// Generate consolidated security report
function generateConsolidatedReport(reports) {
  log("Generating consolidated security report...");

  const consolidated = {
    timestamp: new Date().toISOString(),
    project: options.project,
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    },
    categories: {},
    issues: [],
  };

  // Combine reports
  Object.entries(reports).forEach(([category, report]) => {
    consolidated.categories[category] = {
      issues: report.issues.length,
      summary: report.summary,
    };

    consolidated.summary.critical += report.summary.critical;
    consolidated.summary.high += report.summary.high;
    consolidated.summary.medium += report.summary.medium;
    consolidated.summary.low += report.summary.low;
    consolidated.summary.total += report.issues.length;

    // Add category information to each issue
    report.issues.forEach((issue) => {
      consolidated.issues.push({
        ...issue,
        category,
      });
    });
  });

  // Sort issues by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  consolidated.issues.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  // Save consolidated JSON report
  const consolidatedJsonPath = path.join(outputDir, "security-report.json");
  fs.writeFileSync(consolidatedJsonPath, JSON.stringify(consolidated, null, 2));

  // Generate HTML report
  const htmlReport = generateHtmlReport(consolidated);
  const consolidatedHtmlPath = path.join(outputDir, "security-report.html");
  fs.writeFileSync(consolidatedHtmlPath, htmlReport);

  log(
    `Consolidated security report generated with ${consolidated.summary.total} issues:`,
    consolidated.summary.total > 0 ? "warning" : "success",
  );
  log(`- Critical: ${consolidated.summary.critical}`);
  log(`- High: ${consolidated.summary.high}`);
  log(`- Medium: ${consolidated.summary.medium}`);
  log(`- Low: ${consolidated.summary.low}`);
  log(`Reports saved to:`);
  log(`- ${consolidatedJsonPath}`);
  log(`- ${consolidatedHtmlPath}`);

  return {
    jsonPath: consolidatedJsonPath,
    htmlPath: consolidatedHtmlPath,
    report: consolidated,
  };
}

// Generate HTML report
function generateHtmlReport(report) {
  const severityColors = {
    CRITICAL: "#d42a2a",
    HIGH: "#ff9800",
    MEDIUM: "#ffeb3b",
    LOW: "#4caf50",
  };

  const severityBadges = {
    CRITICAL: `<span style="background-color: ${severityColors.CRITICAL}; color: white; padding: 3px 8px; border-radius: 4px;">CRITICAL</span>`,
    HIGH: `<span style="background-color: ${severityColors.HIGH}; color: white; padding: 3px 8px; border-radius: 4px;">HIGH</span>`,
    MEDIUM: `<span style="background-color: ${severityColors.MEDIUM}; color: black; padding: 3px 8px; border-radius: 4px;">MEDIUM</span>`,
    LOW: `<span style="background-color: ${severityColors.LOW}; color: white; padding: 3px 8px; border-radius: 4px;">LOW</span>`,
  };

  // Generate issue rows
  const issueRows = report.issues
    .map((issue) => {
      return `
      <tr>
        <td>${severityBadges[issue.severity]}</td>
        <td>${issue.category}</td>
        <td>${issue.resource}</td>
        <td>${issue.issue}</td>
        <td>${issue.remediation}</td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluxori Security Scan Report</title>
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
      color: #2c3e50;
    }
    .summary-box {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .summary-item {
      flex: 1;
      text-align: center;
      padding: 15px;
      border-radius: 5px;
      color: white;
      margin: 0 5px;
    }
    .critical {
      background-color: ${severityColors.CRITICAL};
    }
    .high {
      background-color: ${severityColors.HIGH};
    }
    .medium {
      background-color: ${severityColors.MEDIUM};
      color: black;
    }
    .low {
      background-color: ${severityColors.LOW};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .category-summary {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .category-item {
      width: 30%;
      margin: 10px;
      padding: 15px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 5px;
    }
    .category-item h3 {
      margin-top: 0;
      text-transform: capitalize;
    }
  </style>
</head>
<body>
  <h1>Fluxori Security Scan Report</h1>
  <p><strong>Project:</strong> ${report.project}</p>
  <p><strong>Date:</strong> ${report.timestamp}</p>
  
  <h2>Summary</h2>
  <div class="summary-box">
    <div class="summary-item critical">
      <h3>Critical</h3>
      <p>${report.summary.critical}</p>
    </div>
    <div class="summary-item high">
      <h3>High</h3>
      <p>${report.summary.high}</p>
    </div>
    <div class="summary-item medium">
      <h3>Medium</h3>
      <p>${report.summary.medium}</p>
    </div>
    <div class="summary-item low">
      <h3>Low</h3>
      <p>${report.summary.low}</p>
    </div>
  </div>
  
  <h2>Category Summary</h2>
  <div class="category-summary">
    ${Object.entries(report.categories)
      .map(
        ([category, data]) => `
      <div class="category-item">
        <h3>${category}</h3>
        <p><strong>Total issues:</strong> ${data.issues}</p>
        <p><strong>Critical:</strong> ${data.summary.critical}</p>
        <p><strong>High:</strong> ${data.summary.high}</p>
        <p><strong>Medium:</strong> ${data.summary.medium}</p>
        <p><strong>Low:</strong> ${data.summary.low}</p>
      </div>
    `,
      )
      .join("")}
  </div>
  
  <h2>Issues (${report.summary.total})</h2>
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Category</th>
        <th>Resource</th>
        <th>Issue</th>
        <th>Remediation</th>
      </tr>
    </thead>
    <tbody>
      ${issueRows}
    </tbody>
  </table>
  
  <p><em>Generated by Fluxori Security Scanner on ${new Date().toISOString()}</em></p>
</body>
</html>
  `;
}

// Main function
async function main() {
  console.log(`
╔═════════════════════════════════════════════════╗
║         FLUXORI SECURITY SCAN - GCP             ║
╚═════════════════════════════════════════════════╝
  `);

  console.log(`Configuration:`);
  console.log(`- Project: ${options.project}`);
  console.log(`- Scan Type: ${options.scanType}`);
  console.log(`- Output Directory: ${options.output}`);
  console.log(`- API URL: ${options.apiUrl}`);

  try {
    const reports = {};

    // Run requested scans
    if (options.scanType === "iam" || options.scanType === "full") {
      reports.iam = await scanIamSecurity();
    }

    if (options.scanType === "network" || options.scanType === "full") {
      reports.network = await scanNetworkSecurity();
    }

    if (options.scanType === "app" || options.scanType === "full") {
      reports.application = await scanApplicationSecurity();
    }

    // Generate consolidated report
    const consolidatedReport = generateConsolidatedReport(reports);

    console.log("\nSecurity scan completed successfully.");

    return consolidatedReport;
  } catch (error) {
    console.error("Security scan failed:", error);
    process.exit(1);
  }
}

// Run the scan
main().catch((error) => {
  console.error("Scan failed:", error);
  process.exit(1);
});
