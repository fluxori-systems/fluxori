// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs", "src/templates/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "agent-framework", pattern: "src/modules/agent-framework" },
        { type: "ai-insights", pattern: "src/modules/ai-insights" },
        { type: "auth", pattern: "src/modules/auth" },
        { type: "buybox", pattern: "src/modules/buybox" },
        { type: "connectors", pattern: "src/modules/connectors" },
        { type: "credit-system", pattern: "src/modules/credit-system" },
        { type: "feature-flags", pattern: "src/modules/feature-flags" },
        { type: "interfaces", pattern: "src/modules/interfaces" },
        {
          type: "international-trade",
          pattern: "src/modules/international-trade",
        },
        { type: "inventory", pattern: "src/modules/inventory" },
        { type: "marketplaces", pattern: "src/modules/marketplaces" },
        { type: "notifications", pattern: "src/modules/notifications" },
        { type: "order-ingestion", pattern: "src/modules/order-ingestion" },
        { type: "organizations", pattern: "src/modules/organizations" },
        { type: "pim", pattern: "src/modules/pim" },
        { type: "rag-retrieval", pattern: "src/modules/rag-retrieval" },
        { type: "scheduled-tasks", pattern: "src/modules/scheduled-tasks" },
        { type: "security", pattern: "src/modules/security" },
        { type: "storage", pattern: "src/modules/storage" },
        { type: "users", pattern: "src/modules/users" },
      ],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
    },
  },
  // Override for test files to resolve TS project parsing errors
  {
    files: ["./test/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
