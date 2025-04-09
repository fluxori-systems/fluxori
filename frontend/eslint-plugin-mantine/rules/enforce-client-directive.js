/**
 * ESLint rule to enforce 'use client' directive in components using client-side features
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Enforce 'use client' directive in components using client-side features",
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: []
  },
  create(context) {
    // Client-side hooks that require 'use client' directive
    const clientHooks = [
      'useRouter', 'useSearchParams', 'usePathname', 'useParams', // Next.js routing hooks
      'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', // React hooks
      'useForm', // react-hook-form
      'useDisclosure', 'useHover', 'useFocus', 'useClickOutside', // Mantine hooks
    ];

    // Client-side event handlers
    const clientEventProps = [
      'onClick', 'onChange', 'onSubmit', 'onBlur', 'onFocus',
      'onMouseEnter', 'onMouseLeave', 'onKeyDown', 'onKeyUp', 'onKeyPress'
    ];

    let hasClientFeatures = false;
    let hasUseClientDirective = false;
    let isComponentFile = false;

    return {
      Program(node) {
        // Reset state for each file
        hasClientFeatures = false;
        hasUseClientDirective = false;
        
        // Check if file looks like a component (has JSX, exports a function, etc.)
        isComponentFile = node.body.some(statement => 
          statement.type === 'ExportDefaultDeclaration' || 
          statement.type === 'ExportNamedDeclaration'
        );
        
        // Check for 'use client' directive
        if (node.body.length > 0 && 
            node.body[0].type === 'ExpressionStatement' &&
            node.body[0].directive === 'use client') {
          hasUseClientDirective = true;
        }
      },
      
      // Detect React hook usage
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && 
            clientHooks.includes(node.callee.name)) {
          hasClientFeatures = true;
        }
      },
      
      // Detect event handlers in JSX
      JSXAttribute(node) {
        const attrName = node.name.name;
        if (clientEventProps.includes(attrName)) {
          hasClientFeatures = true;
        }
      },
      
      'Program:exit'(node) {
        // Only report if this is a component file with client features but no directive
        if (isComponentFile && hasClientFeatures && !hasUseClientDirective) {
          context.report({
            node: node,
            message: "Component uses client-side features but lacks 'use client' directive",
            fix: (fixer) => {
              return fixer.insertTextBefore(node, "'use client';\n\n");
            }
          });
        }
      }
    };
  }
};