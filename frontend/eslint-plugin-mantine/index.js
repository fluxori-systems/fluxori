"use strict";

module.exports = {
  rules: {
    "no-deprecated-props": require("./rules/no-deprecated-props"),
    "enforce-client-directive": require("./rules/enforce-client-directive"),
  },
  configs: {
    recommended: {
      plugins: ["mantine"],
      rules: {
        "mantine/no-deprecated-props": "error",
        "mantine/enforce-client-directive": "error",
      },
    },
  },
};
