'use strict';

const migrationGuide = require('./prop-migration-guide');

/**
 * Rule to detect and warn about deprecated Mantine props
 */
module.exports = {
  meta: migrationGuide.meta,
  create(context) {
    return migrationGuide.createEslintRule(context);
  }
};