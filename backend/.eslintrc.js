module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'import',
    'boundaries',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'node_modules/**/*'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'prettier/prettier': 'warn',
    'import/order': [
      'warn',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'object',
          'type'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        },
        'pathGroups': [
          {
            'pattern': '@nestjs/**',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': 'src/modules/**',
            'group': 'internal',
            'position': 'before'
          },
          {
            'pattern': 'src/common/**',
            'group': 'internal',
            'position': 'before'
          }
        ],
        'pathGroupsExcludedImportTypes': ['builtin']
      }
    ],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          {
            from: ['module'],
            allow: ['module', 'common', 'config']
          },
          {
            from: ['controller'],
            allow: ['service', 'dto', 'interface', 'common', 'guard']
          },
          {
            from: ['service'],
            allow: ['repository', 'interface', 'common', 'model', 'utils']
          },
          {
            from: ['repository'],
            allow: ['model', 'interface', 'common', 'utils']
          },
          {
            from: ['common'],
            allow: ['common']
          }
        ]
      }
    ],
    'boundaries/dependency-type': [
      'error',
      {
        type: 'element',
        types: {
          'module': {
            module: true,
            packageJson: false
          },
          'controller': {
            // Any file that has 'controller' in its name
            modulePattern: '^.*/(?!index).*\\.controller\\.ts$',
            // ...or is in a controllers/ directory
            pathPattern: '^src/(?:.*/)?controllers/(?!index)'
          },
          'service': {
            modulePattern: '^.*/(?!index).*\\.service\\.ts$',
            pathPattern: '^src/(?:.*/)?services/(?!index)'
          },
          'repository': {
            modulePattern: '^.*/(?!index).*\\.repository\\.ts$',
            pathPattern: '^src/(?:.*/)?repositories/(?!index)'
          },
          'interface': {
            modulePattern: '^.*/(?!index).*\\.interface\\.ts$',
            pathPattern: '^src/(?:.*/)?interfaces/(?!index)'
          },
          'model': {
            modulePattern: '^.*/(?!index).*\\.model\\.ts$|^.*/(?!index).*\\.schema\\.ts$',
            pathPattern: '^src/(?:.*/)?models/(?!index)'
          },
          'dto': {
            modulePattern: '^.*/(?!index).*\\.dto\\.ts$',
            pathPattern: '^src/(?:.*/)?dtos/(?!index)'
          },
          'guard': {
            modulePattern: '^.*/(?!index).*\\.guard\\.ts$',
            pathPattern: '^src/(?:.*/)?guards/(?!index)'
          },
          'utils': {
            modulePattern: '^.*/(?!index).*\\.utils\\.ts$',
            pathPattern: '^src/(?:.*/)?utils/(?!index)'
          },
          'common': {
            pathPattern: '^src/common/.*'
          },
          'config': {
            pathPattern: '^src/config/.*'
          }
        }
      }
    ],
    'boundaries/element-types': 'off',
    'boundaries/dependency-type': 'off',
    'import/no-cycle': 'error',
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: 'src/modules',
            from: 'src/common',
            except: ['src/common/index.ts', 'src/common/*/index.ts']
          },
          {
            target: 'src/modules',
            from: 'src/modules',
            except: ['*/index.ts']
          }
        ]
      }
    ]
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};