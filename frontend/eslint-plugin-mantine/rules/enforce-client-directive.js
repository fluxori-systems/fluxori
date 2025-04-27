"use strict";

/**
 * Rule to enforce the 'use client' directive in client components
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce 'use client' directive at the top of client component files",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
  },

  create(context) {
    // Components that should always be client components
    const CLIENT_COMPONENT_INDICATORS = [
      "useState",
      "useEffect",
      "useRef",
      "useCallback",
      "useMemo",
      "useContext",
      "onClick",
      "onChange",
      "onSubmit",
      "onBlur",
      "onFocus",
      "onKeyDown",
      "onKeyUp",
      "useRouter",
      "useSearchParams",
      "usePathname",
      "useSelectedLayoutSegment",
    ];

    return {
      Program(node) {
        // Skip if this is a non-React file
        if (!context.getFilename().match(/\.(jsx|tsx)$/)) return;

        // Skip if this is not a component file
        if (
          context.getFilename().match(/(\.d\.ts|\.test\.|\.spec\.|types\.ts)/)
        )
          return;

        let hasUseClientDirective = false;
        let hasClientFeature = false;

        // Check if 'use client' directive exists
        for (const item of node.body) {
          if (
            item.type === "ExpressionStatement" &&
            item.directive === "use client"
          ) {
            hasUseClientDirective = true;
            break;
          }
        }

        // Scan the file for client component indicators
        const sourceCode = context.getSourceCode().getText();
        for (const indicator of CLIENT_COMPONENT_INDICATORS) {
          if (sourceCode.includes(indicator)) {
            hasClientFeature = true;
            break;
          }
        }

        // If there are client features but no 'use client' directive, report an error
        if (hasClientFeature && !hasUseClientDirective) {
          context.report({
            node,
            message:
              "Missing 'use client' directive at the top of the file. Client components must include this directive.",
            fix(fixer) {
              return fixer.insertTextBefore(node, "'use client';\n\n");
            },
          });
        }
      },
    };
  },
};
