/**
 * ESLint rule to detect and warn about deprecated Mantine UI props
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow deprecated Mantine UI props',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: []
  },
  create(context) {
    // Map of deprecated props to their modern equivalents
    const deprecatedProps = {
      'color': 'c',
      'weight': 'fw',
      'spacing': 'gap',
      'position': 'justify',
      'align': 'ta',
      'leftIcon': 'leftSection',
      'rightIcon': 'rightSection',
      'breakpoint': null // removed prop, no direct replacement
    };

    // Components that might use deprecated props
    const mantineComponents = [
      'Text', 'Title', 'Group', 'Stack', 'Button', 'Badge',
      'Card', 'Alert', 'Notification', 'Paper', 'Box'
    ];

    return {
      JSXAttribute(node) {
        // Check if the attribute name is in our deprecated list
        const propName = node.name.name;
        if (!deprecatedProps.hasOwnProperty(propName)) {
          return;
        }

        // Check if we're in a Mantine component
        const jsxElement = node.parent;
        const elementName = jsxElement.name && jsxElement.name.name;
        
        // For direct Mantine components
        if (mantineComponents.includes(elementName)) {
          reportDeprecation(node, propName);
        }
        
        // For @mantine/core imports or other custom components
        else if (elementName && elementName.includes('mantine')) {
          reportDeprecation(node, propName);
        }
      }
    };

    function reportDeprecation(node, propName) {
      const replacement = deprecatedProps[propName];
      const message = replacement 
        ? `Use '${replacement}' instead of deprecated '${propName}' prop`
        : `The '${propName}' prop is deprecated and has been removed`;
        
      context.report({
        node,
        message,
        fix: replacement ? (fixer) => {
          return fixer.replaceText(node.name, replacement);
        } : null
      });
    }
  }
};