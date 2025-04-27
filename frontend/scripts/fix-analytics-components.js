/**
 * Script to fix TypeScript errors in components
 * Run with: node scripts/fix-analytics-components.js
 */

const fs = require("fs");
const path = require("path");

// Update files that may have Mantine v7 compatibility issues
const fixMantineProps = () => {
  const filesToFix = [
    "src/components/credit-system/analytics/AnalyticsDashboard.tsx",
    "src/components/credit-system/analytics/KeywordAnalytics.tsx",
    "src/components/credit-system/analytics/KeywordAnalyticsChart.tsx",
    "src/components/credit-system/analytics/SeasonalityChart.tsx",
    "src/components/credit-system/analytics/TrendPredictionChart.tsx",
    "src/components/credit-system/analytics/CompetitionAnalysisChart.tsx",
  ];

  // Fixes to apply to files
  const fixes = [
    // Replace span={X} with span={{base: X}}
    {
      regex: /Grid\.Col([^>]*)span=\{([0-9]+)\}/g,
      replacement: "Grid.Col$1span={{base: $2}}",
    },
    // Replace md={X} with span={{base: 12, md: X}}
    {
      regex: /Grid\.Col([^>]*)md=\{([0-9]+)\}/g,
      replacement: "Grid.Col$1span={{base: 12, md: $2}}",
    },
    // Replace Group position="apart" with Group justify="apart"
    {
      regex: /Group position="apart"/g,
      replacement: 'Group justify="apart"',
    },
    // Replace c={someValue} with color={someValue} in Icon components
    {
      regex: /Icon[a-zA-Z]+([^>]*)c=\{/g,
      replacement: "Icon$1color={",
    },
    // Replace Text c="dimmed" with Text color="dimmed"
    {
      regex: /Text([^>]*)c="dimmed"/g,
      replacement: 'Text$1color="dimmed"',
    },
    // Replace Text fw={X} with Text fontWeight={X}
    {
      regex: /Text([^>]*)fw=\{([^}]+)\}/g,
      replacement: "Text$1fw={$2}",
    },
    // Fix type errors in state variables
    {
      regex: /useState\('([^']+)'\)/g,
      replacement: "useState<string | null>('$1')",
    },
    // Fix Tabs.onChange to use onChange instead of onTabChange
    {
      regex: /onTabChange=\{([^}]+)\}/g,
      replacement: "onChange={$1}",
    },
  ];

  filesToFix.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf8");
      let modified = false;

      // Apply all fixes to the file
      fixes.forEach((fix) => {
        const originalContent = content;
        content = content.replace(fix.regex, fix.replacement);
        if (content !== originalContent) {
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Fixed: ${filePath}`);
      } else {
        console.log(`No changes needed in: ${filePath}`);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  });
};

// Main function
const main = () => {
  console.log("Fixing Mantine props in components...");
  fixMantineProps();
  console.log("Done!");
};

main();
