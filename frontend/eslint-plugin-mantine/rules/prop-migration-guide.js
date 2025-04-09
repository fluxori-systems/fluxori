'use strict';

/**
 * Mantine Prop Migration Guide
 * Comprehensive reference for migrating from deprecated Mantine v6 props to modern Mantine v7+ props
 */

// Map of deprecated props to their modern equivalents
const PROP_MAPPING = {
  // Text styling props
  'weight': 'fw',   // Font weight
  'align': 'ta',    // Text align
  'color': 'c',     // Text/component color
  
  // Layout props
  'spacing': 'gap',        // Space between elements
  'position': 'justify',   // Horizontal alignment
  
  // Button props
  'leftIcon': 'leftSection',     // Left icon/content in a button
  'rightIcon': 'rightSection',   // Right icon/content in a button
  
  // Additional props not currently handled but might be added in the future
  'uppercase': 'tt',       // Text transform (use tt="uppercase")
  'wrapLines': 'lineClamp', // Line clamping in Text components
  'underline': 'td',        // Text decoration (use td="underline")
  'italic': 'fs',           // Font style (use fs="italic")
};

// Documentation for each prop to explain usage
const PROP_DOCUMENTATION = {
  'fw': 'Font weight: 100-900, "bold", "normal", etc.',
  'ta': 'Text align: "left", "center", "right", "justify"',
  'c': 'Color: Can use Mantine theme colors like "blue.6" or CSS colors',
  'gap': 'Gap between elements in Stack, Group, etc. (xs, sm, md, lg, xl or number)',
  'justify': 'Horizontal alignment: "flex-start", "center", "flex-end", "space-between", etc.',
  'leftSection': 'Content to display on the left side of a component (usually an icon)',
  'rightSection': 'Content to display on the right side of a component (usually an icon)',
  'tt': 'Text transform: "uppercase", "lowercase", "capitalize", etc.',
  'lineClamp': 'Number of lines after which text will be truncated with ellipsis',
  'td': 'Text decoration: "underline", "line-through", "none"',
  'fs': 'Font style: "italic", "normal"',
};

// Components that have specific prop migrations
const COMPONENTS_WITH_MIGRATIONS = [
  'Text', 'Title', 'Stack', 'Group', 'Button', 'Menu.Item', 'Tabs.Tab',
  'SimpleGrid', 'Grid', 'Box', 'Container', 'Paper', 'Badge', 'Alert',
  'Card', 'Notification', 'Anchor', 'ActionIcon', 'Center', 'Flex'
];

// Examples of migrating from old to new props
const MIGRATION_EXAMPLES = [
  {
    component: 'Text',
    before: '<Text weight="bold" align="center" color="blue.5">Hello world</Text>',
    after: '<Text fw="bold" ta="center" c="blue.5">Hello world</Text>',
  },
  {
    component: 'Stack',
    before: '<Stack spacing="lg" position="center">...</Stack>',
    after: '<Stack gap="lg" justify="center">...</Stack>',
  },
  {
    component: 'Button',
    before: '<Button leftIcon={<IconSearch />} color="indigo">Search</Button>',
    after: '<Button leftSection={<IconSearch />} c="indigo">Search</Button>',
  },
  {
    component: 'Group',
    before: '<Group spacing="md" position="right">...</Group>',
    after: '<Group gap="md" justify="flex-end">...</Group>',
  },
  {
    component: 'Menu.Item',
    before: '<Menu.Item icon={<IconSettings />}>Settings</Menu.Item>',
    after: '<Menu.Item leftSection={<IconSettings />}>Settings</Menu.Item>',
  },
];

// ESLint rule for detecting and fixing deprecated props
const createEslintRule = (context) => {
  return {
    JSXAttribute(node) {
      const attributeName = node.name.name;
      
      // Check if this is a deprecated prop
      if (Object.keys(PROP_MAPPING).includes(attributeName)) {
        const parentComponent = context.getAncestors()
          .filter(node => node.type === 'JSXOpeningElement')
          .pop();
        
        if (!parentComponent) return;
        
        // Get component name
        let componentName = '';
        if (parentComponent.name.type === 'JSXIdentifier') {
          componentName = parentComponent.name.name;
        } else if (parentComponent.name.type === 'JSXMemberExpression') {
          componentName = `${parentComponent.name.object.name}.${parentComponent.name.property.name}`;
        }
        
        // Only apply to relevant Mantine components
        if (COMPONENTS_WITH_MIGRATIONS.includes(componentName)) {
          const modernProp = PROP_MAPPING[attributeName];
          
          context.report({
            node,
            message: `Deprecated prop '${attributeName}' used in ${componentName}. Use '${modernProp}' instead.`,
            fix: function(fixer) {
              return fixer.replaceText(node.name, modernProp);
            }
          });
        }
      }
    }
  };
};

// Exports
module.exports = {
  PROP_MAPPING,
  PROP_DOCUMENTATION,
  MIGRATION_EXAMPLES,
  COMPONENTS_WITH_MIGRATIONS,
  createEslintRule,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detects deprecated Mantine props and suggests modern alternatives',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
  },
  create: createEslintRule
};