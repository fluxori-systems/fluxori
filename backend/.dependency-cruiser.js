/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies are harmful and make reasoning about the codebase difficult",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Files that don't belong to a module should be refactored into proper modules",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$", // dot files
          "\\.d\\.ts$", // TypeScript declaration files
          "(^|/)tsconfig\\.json$", // TypeScript config
          "(^|/)(jest|cypress)\\.config\\.(js|ts)$", // test config
          "(^|/)nest-cli\\.json$", // NestJS config
          "^src/main\\.ts$", // Entry point
          "^src/config/", // Config files
          "^src/test/", // Test utilities
          "^src/types/", // Global type definitions
        ],
      },
      to: {},
    },
    {
      name: "no-module-cross-boundaries",
      severity: "error",
      comment:
        "Module boundaries should be respected - import from module's public API only",
      from: {
        path: "^src/modules/([^/]+)/(?!.*index\\.ts)",
      },
      to: {
        path: "^src/modules/([^/]+)/(?!.*index\\.ts)",
        pathNot: [
          "^src/modules/$1/.+", // Same module is allowed
        ],
      },
    },
    {
      name: "no-common-utils-cross-boundaries",
      severity: "error",
      comment:
        "Common utilities should be imported through their public API, not directly",
      from: {},
      to: {
        path: "^src/common/(?!index\\.ts)",
        pathNot: ["^src/common/[^/]+/index\\.ts$", "^src/common/[^/]+$"],
      },
    },
    {
      name: "no-unneeded-imports-from-parent-package",
      severity: "warn",
      comment: "Don't import from parent package, import from files directly",
      from: {},
      to: {
        path: "^src/modules/[^/]+$",
        pathNot: ["^src/modules/[^/]+/(?!index\\.ts)"],
      },
    },
    {
      name: "no-unneeded-common-imports",
      severity: "warn",
      comment: "Don't import from common, import from specific common module",
      from: {},
      to: {
        path: "^src/common$",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: ["node_modules", "\\.(json|css|scss|sass|html|gql|graphql)$"],
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },
    moduleSystems: ["cjs", "es6"],
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
        theme: {
          graph: {
            splines: "ortho",
            rankdir: "TB",
          },
          modules: [
            {
              criteria: { source: "^src/modules/" },
              attributes: { fillcolor: "#ccffcc" },
            },
            {
              criteria: { source: "^src/common/" },
              attributes: { fillcolor: "#ccccff" },
            },
            {
              criteria: { source: "^src/config/" },
              attributes: { fillcolor: "#ffffcc" },
            },
          ],
          dependencies: [
            {
              criteria: { "rules[0].severity": "error" },
              attributes: { fontcolor: "red", color: "red" },
            },
            {
              criteria: { "rules[0].severity": "warn" },
              attributes: { fontcolor: "orange", color: "orange" },
            },
            {
              criteria: { "rules[0].severity": "info" },
              attributes: { fontcolor: "blue", color: "blue" },
            },
          ],
        },
      },
      archi: {
        collapsePattern: "^(node_modules|src/common|src/config)/",
        theme: {
          graph: {
            splines: "ortho",
            overlap: "false",
            nodesep: "0.8",
            ranksep: "1.0",
          },
        },
      },
    },
  },
};
