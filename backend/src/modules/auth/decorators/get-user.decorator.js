'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetUser = void 0;
var common_1 = require('@nestjs/common');
/**
 * Decorator to get the authenticated user from the request
 */
exports.GetUser = (0, common_1.createParamDecorator)(function (data, ctx) {
  var request = ctx.switchToHttp().getRequest();
  var user = request.user;
  // If data is provided, return specific field from user
  return data ? (user === null || user === void 0 ? void 0 : user[data]) : user;
});
