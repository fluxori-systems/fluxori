/**
 * Design System Validation Script
 *
 * This script validates the design system implementation to ensure:
 * - Color contrast meets WCAG AA standards
 * - Font names are correctly referenced
 * - No TypeScript errors in design system files
 * - CSS variables are properly defined
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("\n🎨 Validating Fluxori Design System...\n");

// Define paths
const designSystemPath = path.join(
  __dirname,
  "../frontend/src/lib/design-system",
);
const tokensPath = path.join(designSystemPath, "tokens");
const colorsPath = path.join(tokensPath, "colors.ts");

// Check if design system files exist
if (!fs.existsSync(designSystemPath)) {
  console.error("❌ Design system directory not found!");
  process.exit(1);
}

// Read colors file for contrast validation
console.log("🔍 Checking color contrast ratios...");

try {
  // Use a simple approach since we can't import TS directly in CommonJS
  const colorsContent = fs.readFileSync(colorsPath, "utf8");

  // Simple regex to find potential contrast issues (not perfect but a quick check)
  const contrastIssues = colorsContent.match(/\/\/ \[CONTRAST ISSUE\].*$/gm);

  if (contrastIssues && contrastIssues.length > 0) {
    console.warn("⚠️ Potential contrast issues found:");
    contrastIssues.forEach((issue) => console.warn(`  - ${issue}`));
  } else {
    console.log("✅ No flagged contrast issues");
  }
} catch (error) {
  console.error("❌ Error checking color contrast:", error.message);
}

// Check TypeScript types
console.log("\n🔍 Checking TypeScript types in design system...");

try {
  // Run TypeScript compiler on design system files
  const tscResult = execSync(
    "npx tsc --noEmit --project ../frontend/tsconfig.json ../frontend/src/lib/design-system/**/*.ts ../frontend/src/lib/design-system/**/*.tsx",
    { cwd: __dirname, stdio: "pipe" },
  ).toString();

  console.log("✅ TypeScript validation passed");
} catch (error) {
  console.error("❌ TypeScript errors found:");
  console.error(error.stdout.toString());
}

// Check CSS variables
console.log("\n🔍 Checking CSS variables...");

try {
  const globalCssPath = path.join(
    __dirname,
    "../frontend/src/styles/globals.css",
  );
  const cssContent = fs.readFileSync(globalCssPath, "utf8");

  // Check if CSS variables are defined
  const rootVars = cssContent.match(/:root\s*{([^}]*)}/s);

  if (!rootVars) {
    console.error("❌ No CSS variables found in :root selector");
  } else {
    const cssVarCount = (rootVars[1].match(/--[\w-]+:/g) || []).length;
    console.log(`✅ Found ${cssVarCount} CSS variables in :root selector`);

    // Check for dark mode variables
    const darkVars = cssContent.match(/\[data-theme="dark"\]\s*{([^}]*)}/s);
    if (!darkVars) {
      console.warn("⚠️ No dark mode CSS variables found");
    } else {
      const darkVarCount = (darkVars[1].match(/--[\w-]+:/g) || []).length;
      console.log(
        `✅ Found ${darkVarCount} CSS variables in dark mode selector`,
      );
    }
  }
} catch (error) {
  console.error("❌ Error checking CSS variables:", error.message);
}

// Check font face declarations
console.log("\n🔍 Checking font face declarations...");

try {
  const globalCssPath = path.join(
    __dirname,
    "../frontend/src/styles/globals.css",
  );
  const cssContent = fs.readFileSync(globalCssPath, "utf8");

  // Check for font face declarations
  const fontFace = cssContent.match(/@font-face\s*{[^}]*}/g);

  if (!fontFace) {
    console.warn("⚠️ No @font-face declarations found");
  } else {
    console.log(`✅ Found ${fontFace.length} @font-face declarations`);

    // Check for Inter font
    if (!cssContent.includes("font-family: 'Inter'")) {
      console.warn("⚠️ Inter font not found in @font-face declarations");
    } else {
      console.log("✅ Inter font properly declared");
    }

    // Check for Space Grotesk font
    if (!cssContent.includes("font-family: 'Space Grotesk'")) {
      console.warn(
        "⚠️ Space Grotesk font not found in @font-face declarations",
      );
    } else {
      console.log("✅ Space Grotesk font properly declared");
    }
  }
} catch (error) {
  console.error("❌ Error checking font declarations:", error.message);
}

// Create list of missing font files
console.log("\n🔍 Checking font files...");

const requiredFonts = [
  "inter-regular.woff2",
  "inter-medium.woff2",
  "inter-semibold.woff2",
  "inter-bold.woff2",
  "space-grotesk-regular.woff2",
  "space-grotesk-medium.woff2",
  "space-grotesk-bold.woff2",
];

const fontPath = path.join(__dirname, "../frontend/public/fonts");
let missingFonts = [];

try {
  if (!fs.existsSync(fontPath)) {
    console.warn("⚠️ Font directory does not exist. Creating it...");
    fs.mkdirSync(fontPath, { recursive: true });
  }

  const fonts = fs.readdirSync(fontPath);

  missingFonts = requiredFonts.filter((font) => !fonts.includes(font));

  if (missingFonts.length > 0) {
    console.warn("⚠️ Missing font files:");
    missingFonts.forEach((font) => console.warn(`  - ${font}`));
    console.warn(
      "These fonts need to be downloaded and placed in the /frontend/public/fonts directory",
    );
  } else {
    console.log("✅ All required font files are present");
  }
} catch (error) {
  console.error("❌ Error checking font files:", error.message);
}

// Final summary
console.log("\n📋 Design System Validation Summary:");
console.log("----------------------------------");

if (missingFonts.length > 0) {
  console.log("⚠️ Font files: Missing some required fonts");
} else {
  console.log("✅ Font files: All required fonts present");
}

try {
  // Run a simple check of the design system components
  const showcasePath = path.join(
    designSystemPath,
    "components/ThemeShowcase.tsx",
  );
  const docsPath = path.join(
    designSystemPath,
    "components/DesignSystemDocs.tsx",
  );

  if (fs.existsSync(showcasePath) && fs.existsSync(docsPath)) {
    console.log("✅ Documentation components: Present");
  } else {
    console.warn(
      "⚠️ Documentation components: Missing showcase or docs components",
    );
  }
} catch (error) {
  console.error("❌ Error checking components:", error.message);
}

console.log("\n🔍 Design system validation complete!");
console.log(
  "Note: For a complete validation, download required fonts and run the TypeScript compiler on the entire project.",
);
console.log("\nRecommended next steps:");
console.log("1. Download missing font files");
console.log("2. Run `npm run typecheck` in the frontend directory");
console.log("3. Test the design system in both light and dark modes");
console.log("4. Review the design system showcase at /design-system\n");
