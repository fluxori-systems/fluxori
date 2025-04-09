#!/usr/bin/env node

/**
 * Component Generator
 * 
 * This script generates a new React component with proper TypeScript typing.
 * 
 * Usage:
 *   node generate-component.js ComponentName [--client] [--path=components/path]
 *   
 * Options:
 *   --client        Add 'use client' directive (default for components with state)
 *   --path          Subdirectory under src/components (default: components)
 *   --stateful      Create a stateful component with useState
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Please provide a component name!');
  process.exit(1);
}

const componentName = args[0];
const isClient = args.includes('--client');
const isStateful = args.includes('--stateful');
const forcedClient = isClient || isStateful;

// Default path is components, but can be overridden with --path
let componentPath = 'components';
const pathArg = args.find(arg => arg.startsWith('--path='));
if (pathArg) {
  componentPath = pathArg.split('=')[1];
}

// Absolute path to frontend directory
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// Full path where the component will be created
const fullPath = path.join(FRONTEND_DIR, 'src', componentPath, componentName);

// Create component directory if it doesn't exist
if (!fs.existsSync(fullPath)) {
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`📁 Created directory: ${fullPath}`);
}

// Generate index.ts
const indexContent = `export { ${componentName} } from './${componentName}';
`;

fs.writeFileSync(path.join(fullPath, 'index.ts'), indexContent);
console.log(`📝 Created index.ts`);

// Generate component file
let componentContent = '';

if (forcedClient) {
  componentContent += `'use client';

`;
}

componentContent += `import { ReactNode } from 'react';
`;

// Add UI imports if stateful
if (isStateful) {
  componentContent += `import { useState } from 'react';
import { Stack, Text, Button } from '@/lib/ui';
`;
}

componentContent += `
/**
 * ${componentName} props interface
 */
interface ${componentName}Props {
  /** Component children */
  children?: ReactNode;
  
  /** Custom className */
  className?: string;
`;

// Add more props for stateful component
if (isStateful) {
  componentContent += `  
  /** Initial counter value */
  initialCount?: number;
  
  /** Called when counter changes */
  onCountChange?: (count: number) => void;
`;
}

componentContent += `}

/**
 * ${componentName} component
 */
export function ${componentName}({
  children,
  className${isStateful ? ',\n  initialCount = 0,\n  onCountChange' : ''}
}: ${componentName}Props) {
`;

// Add state for stateful component
if (isStateful) {
  componentContent += `  const [count, setCount] = useState<number>(initialCount);
  
  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    if (onCountChange) {
      onCountChange(newCount);
    }
  };
  
`;
}

// Component JSX
if (isStateful) {
  componentContent += `  return (
    <Stack gap="md" className={className}>
      <Text fw={700}>Count: {count}</Text>
      <Button onClick={handleIncrement}>Increment</Button>
      {children}
    </Stack>
  );
`;
} else {
  componentContent += `  return (
    <div className={className}>
      {children}
    </div>
  );
`;
}

componentContent += `}
`;

fs.writeFileSync(path.join(fullPath, `${componentName}.tsx`), componentContent);
console.log(`📝 Created ${componentName}.tsx`);

// Generate test file
const testContent = `import { render, screen${isStateful ? ', fireEvent' : ''} } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders children correctly', () => {
    render(<${componentName}>Test Content</${componentName}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
${isStateful ? `
  it('increments counter when button is clicked', () => {
    render(<${componentName} />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Increment'));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('calls onCountChange when counter changes', () => {
    const handleCountChange = jest.fn();
    render(<${componentName} onCountChange={handleCountChange} />);
    
    fireEvent.click(screen.getByText('Increment'));
    expect(handleCountChange).toHaveBeenCalledWith(1);
  });` : ''}
});
`;

fs.writeFileSync(path.join(fullPath, `${componentName}.test.tsx`), testContent);
console.log(`📝 Created ${componentName}.test.tsx`);

console.log(`\n✅ Successfully created ${componentName} component!`);
console.log(`   Location: ${path.relative(process.cwd(), fullPath)}\n`);

if (!forcedClient) {
  console.log(`ℹ️ Note: This component was created as a server component.`);
  console.log(`   If it uses hooks, state, or event handlers, add 'use client' at the top.`);
  console.log(`   Or run with --client flag: node generate-component.js ${componentName} --client\n`);
}