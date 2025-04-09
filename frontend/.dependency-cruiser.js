/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are harmful and make reasoning about the codebase difficult',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Files should belong to a module or be imported somewhere',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|tsx|json)$', // dot files
          '\\.d\\.ts$',                            // TypeScript declaration files
          '(^|/)tsconfig\\.json$',                 // TypeScript config
          '(^|/)(jest|cypress)\\.config\\.(js|ts)$',  // test config
          '^src/app/[^/]+/page\\.(js|tsx)$',       // Next.js page components
          '^src/app/layout\\.(js|tsx)$',          // Next.js layout component
          '^src/app/.*\\.(js|tsx)$',              // Other Next.js app components
          '^src/middleware\\.ts$'                 // Next.js middleware
        ]
      },
      to: {}
    },
    {
      name: 'components-proper-import',
      severity: 'error',
      comment: 'Components should only import from their allowed dependencies',
      from: {
        path: '^src/components/(?!index\\.ts)'
      },
      to: {
        pathNot: [
          '^src/components',         // Own components
          '^src/lib',                // Shared libraries
          '^src/hooks',              // Custom hooks
          '^src/contexts',           // React contexts
          '^src/types',              // TypeScript types
          '^src/api',                // API clients
          // Allow external dependencies
          '^(?!src)'                 
        ]
      }
    },
    {
      name: 'lib-component-isolation',
      severity: 'error',
      comment: 'UI library components should not depend on app-specific code',
      from: {
        path: '^src/lib/ui/'
      },
      to: {
        path: [
          '^src/components',
          '^src/app',
          '^src/api',
          '^src/contexts',
          '^src/repositories'
        ]
      }
    },
    {
      name: 'ui-importing-motion',
      severity: 'error',
      comment: 'UI components should not directly import from Motion module - use shared interfaces instead',
      from: {
        path: ['^src/lib/ui/'],
        pathNot: ['.d.ts$']
      },
      to: {
        path: ['^src/lib/motion/'],
        pathNot: ['.d.ts$']
      }
    },
    {
      name: 'motion-importing-ui',
      severity: 'error',
      comment: 'Motion components should not directly import from UI module - use shared interfaces instead',
      from: {
        path: ['^src/lib/motion/'],
        pathNot: ['.d.ts$']
      },
      to: {
        path: ['^src/lib/ui/'],
        pathNot: ['.d.ts$']
      }
    },
    {
      name: 'shared-module-usage',
      severity: 'info',
      comment: 'Both UI and Motion modules can import from Shared module',
      from: {
        path: ['^src/lib/(ui|motion)/']
      },
      to: {
        path: ['^src/lib/shared/']
      }
    },
    {
      name: 'no-direct-firebase-import-outside-lib',
      severity: 'error',
      comment: 'Firebase should only be imported through the firebase utility layer',
      from: {
        pathNot: [
          '^src/lib/firebase'
        ]
      },
      to: {
        path: [
          'firebase',
          'firebase/.+'
        ],
        pathNot: [
          '^src/lib/firebase'
        ]
      }
    },
    {
      name: 'hooks-proper-import',
      severity: 'error',
      comment: 'Hooks should only import from their allowed dependencies',
      from: {
        path: '^src/hooks/(?!index\\.ts)'
      },
      to: {
        pathNot: [
          '^src/hooks',             // Other hooks
          '^src/lib',               // Shared libraries
          '^src/types',             // TypeScript types
          '^src/api',               // API clients
          '^src/contexts',          // React contexts
          // Allow external dependencies
          '^(?!src)'
        ]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: [
        'node_modules',
        '\\.(css|scss|sass|less|styl|html|gql|graphql)$'
      ],
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg'
      ]
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho',
            rankdir: 'TB'
          },
          modules: [
            {
              criteria: { source: '^src/app/' },
              attributes: { fillcolor: '#ccffcc' }
            },
            {
              criteria: { source: '^src/components/' },
              attributes: { fillcolor: '#ccccff' }
            },
            {
              criteria: { source: '^src/lib/ui/' },
              attributes: { fillcolor: '#2563eb', fontcolor: 'white' }
            },
            {
              criteria: { source: '^src/lib/motion/' },
              attributes: { fillcolor: '#db2777', fontcolor: 'white' }
            },
            {
              criteria: { source: '^src/lib/shared/' },
              attributes: { fillcolor: '#16a34a', fontcolor: 'white' }
            },
            {
              criteria: { source: '^src/lib/' },
              attributes: { fillcolor: '#ffffcc' }
            },
            {
              criteria: { source: '^src/hooks/' },
              attributes: { fillcolor: '#ffcccc' }
            },
            {
              criteria: { source: '^src/api/' },
              attributes: { fillcolor: '#ccffff' }
            }
          ],
          dependencies: [
            {
              criteria: { 'rules[0].severity': 'error' },
              attributes: { fontcolor: 'red', color: 'red' }
            },
            {
              criteria: { 'rules[0].severity': 'warn' },
              attributes: { fontcolor: 'orange', color: 'orange' }
            },
            {
              criteria: { 'rules[0].severity': 'info' },
              attributes: { fontcolor: 'blue', color: 'blue' }
            }
          ]
        }
      },
      archi: {
        collapsePattern: '^(node_modules|src/lib)/',
        theme: {
          graph: {
            splines: 'ortho',
            overlap: 'false',
            nodesep: '0.8',
            ranksep: '1.0'
          }
        }
      }
    }
  }
};