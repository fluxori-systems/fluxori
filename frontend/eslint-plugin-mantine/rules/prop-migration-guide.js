'use strict';

/**
 * Rule to detect and suggest fixes for deprecated Mantine props
 */
module.exports = {
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
  create: function(context) {
    // Map of deprecated props to their modern equivalents
    const PROP_MAPPING = {
      'weight': 'fw',
      'align': 'ta',
      'spacing': 'gap',
      'position': 'justify',
      'leftIcon': 'leftSection',
      'rightIcon': 'rightSection',
      'color': 'c'
    };

    // Components that have specific prop migrations
    const COMPONENTS_WITH_MIGRATIONS = [
      'Text', 'Title', 'Stack', 'Group', 'Button', 'Menu.Item', 'Tabs.Tab'
    ];

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
  }
};