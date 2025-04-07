#!/usr/bin/env node

/**
 * This script initializes the new UI library structure for the rebuild.
 * It creates the directory structure and core component files.
 */

const fs = require('fs');
const path = require('path');

// Create directory structure
const directories = [
  'src/lib/ui',
  'src/lib/ui/components',
  'src/lib/ui/types',
  'src/lib/ui/hooks',
  'src/lib/ui/theme',
];

directories.forEach(dir => {
  const dirPath = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create index.ts file
const indexFile = `// UI Library
// This is the main entry point for the UI library

// Re-export all components
export * from './components';

// Re-export types
export * from './types';

// Re-export hooks
export * from './hooks';

// Re-export theme
export * from './theme';
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/index.ts'),
  indexFile
);
console.log('Created index.ts file');

// Create component index file
const componentIndexFile = `// Component exports
// Re-exports all UI components

// Basic components
export * from './Button';
export * from './Text';

// Layout components
export * from './Stack';
export * from './Group';
export * from './Grid';
export * from './SimpleGrid';

// Interactive components
export * from './Tabs';
export * from './Menu';

// Re-export Mantine components that don't need wrappers
export {
  Container, 
  Title,
  Card,
  Paper,
  Select,
  SegmentedControl,
  Skeleton,
  ThemeIcon,
  Box,
  Progress,
  Divider,
  Badge,
  Avatar,
  Modal,
  Drawer,
  ActionIcon,
  Center,
  Flex,
  Code,
  Chip,
  Switch,
  Checkbox,
  Input,
  NumberInput,
  TextInput,
  Textarea,
  Tooltip,
  Loader,
  Overlay,
  Popover,
  Space,
  ScrollArea,
  Burger,
  RingProgress,
  List,
  Anchor,
  Collapse,
  HoverCard,
  RadioGroup,
  Radio,
  Pagination,
  Dialog,
  Image,
  NavLink,
  AppShell,
  ColorSwatch,
  Timeline,
  Slider,
} from '@mantine/core';
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/components/index.ts'),
  componentIndexFile
);
console.log('Created components/index.ts file');

// Create Button component file
const buttonFile = `import { Button as MantineButton } from '@mantine/core';
import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react';

export interface ButtonProps extends ComponentPropsWithoutRef<typeof MantineButton> {
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ leftIcon, rightIcon, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const leftSection = leftIcon || props.leftSection;
    const rightSection = rightIcon || props.rightSection;

    return (
      <MantineButton
        ref={ref}
        {...props}
        leftSection={leftSection}
        rightSection={rightSection}
      />
    );
  }
);

Button.displayName = 'Button';
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/components/Button.tsx'),
  buttonFile
);
console.log('Created Button component');

// Create Text component file
const textFile = `import { Text as MantineText } from '@mantine/core';
import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react';

export interface TextProps extends ComponentPropsWithoutRef<typeof MantineText> {
  children?: ReactNode;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ weight, align, italic, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const fontWeight = weight || props.fw;
    const textAlign = align || props.ta;
    const fontStyle = italic ? 'italic' : props.fs;

    return (
      <MantineText
        ref={ref}
        {...props}
        fw={fontWeight}
        ta={textAlign}
        fs={fontStyle}
      />
    );
  }
);

Text.displayName = 'Text';
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/components/Text.tsx'),
  textFile
);
console.log('Created Text component');

// Create README file
const readmeFile = `# UI Library

This UI library provides a consistent set of components for building the Fluxori frontend.

## Usage

\`\`\`tsx
import { Button, Text, Stack } from '@/lib/ui';

function MyComponent() {
  return (
    <Stack spacing="md">
      <Text weight={500}>Hello world</Text>
      <Button onClick={() => console.log('Clicked')}>Click me</Button>
    </Stack>
  );
}
\`\`\`

## Philosophy

- **Type Safety**: All components are fully typed
- **Consistency**: Consistent API across components
- **Simplicity**: Simple, intuitive API for common use cases
- **Extensibility**: Easy to extend and customize

## Components

The library includes wrappers around Mantine UI components to ensure proper typing and consistent API.
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/README.md'),
  readmeFile
);
console.log('Created README.md');

// Create update-imports script
const updateImportsScript = `#!/usr/bin/env node

/**
 * This script updates imports throughout the codebase to use the new UI library.
 * It replaces imports from @mantine/core with imports from @/lib/ui.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Components that should be imported from our UI library
const COMPONENTS_TO_REPLACE = [
  'Button',
  'Text',
  'Stack',
  'Group',
  'Grid',
  'SimpleGrid',
  'Tabs',
  'Menu',
];

// Find all TypeScript and TSX files in the src directory
const srcDir = path.resolve(process.cwd(), 'src');
const files = glob.sync(\`\${srcDir}/**/*.{ts,tsx}\`, {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/lib/ui/**']
});

let updatedFiles = 0;

// Process each file
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Check if the file imports from @mantine/core
  if (content.includes('@mantine/core')) {
    // Replace imports
    const mantineImportRegex = /import\\s+{([^}]+)}\\s+from\\s+['"]@mantine\\/core['"]/g;
    let match;
    
    while ((match = mantineImportRegex.exec(originalContent)) !== null) {
      const importComponents = match[1].split(',').map(c => c.trim());
      const componentsToExtract = [];
      const remainingComponents = [];
      
      // Separate components that need to be extracted
      importComponents.forEach(comp => {
        const compName = comp.trim().split(' as ')[0].trim();
        if (COMPONENTS_TO_REPLACE.includes(compName)) {
          componentsToExtract.push(comp);
        } else {
          remainingComponents.push(comp);
        }
      });
      
      // If we have components to extract
      if (componentsToExtract.length > 0) {
        // Build the new import statements
        let newContent = content;
        
        // Replace the original import
        const originalImport = match[0];
        let newMantineImport = '';
        
        if (remainingComponents.length > 0) {
          newMantineImport = \`import { \${remainingComponents.join(', ')} } from '@mantine/core'\`;
        }
        
        const uiImport = \`import { \${componentsToExtract.join(', ')} } from '@/lib/ui'\`;
        
        // Check if we already have a UI import
        if (content.includes("from '@/lib/ui'")) {
          // Extract existing UI import
          const uiImportRegex = /import\\s+{([^}]+)}\\s+from\\s+['"]@\\/lib\\/ui['"]/;
          const uiMatch = content.match(uiImportRegex);
          
          if (uiMatch) {
            // Combine with existing UI import
            const existingComponents = uiMatch[1].split(',').map(c => c.trim());
            const allComponents = [...existingComponents, ...componentsToExtract];
            const uniqueComponents = [...new Set(allComponents)];
            
            const newUiImport = \`import { \${uniqueComponents.join(', ')} } from '@/lib/ui'\`;
            newContent = newContent.replace(uiMatch[0], newUiImport);
            
            // Remove the components from Mantine import
            if (remainingComponents.length > 0) {
              newContent = newContent.replace(originalImport, newMantineImport);
            } else {
              // Remove the entire Mantine import if no components remain
              newContent = newContent.replace(originalImport, '');
            }
          }
        } else {
          // Add new UI import after the Mantine import
          if (remainingComponents.length > 0) {
            newContent = newContent.replace(originalImport, \`\${newMantineImport}\\n\${uiImport}\`);
          } else {
            newContent = newContent.replace(originalImport, uiImport);
          }
        }
        
        content = newContent;
      }
    }
    
    // Clean up any duplicate newlines
    content = content.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');
    
    // Write the updated content if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedFiles++;
      console.log(\`Updated imports in: \${path.relative(process.cwd(), filePath)}\`);
    }
  }
});

console.log(\`\\nComplete! Updated \${updatedFiles} files.\`);
`;

fs.writeFileSync(
  path.resolve(process.cwd(), 'scripts/rebuild-strategy/update-imports.js'),
  updateImportsScript
);
console.log('Created update-imports.js script');

console.log('\nInitialization complete! Next steps:');
console.log('1. Implement remaining UI components in src/lib/ui/components/');
console.log('2. Run the update-imports.js script to update imports throughout the codebase');
console.log('3. Fix any remaining TypeScript errors');