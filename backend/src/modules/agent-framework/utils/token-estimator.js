'use strict';
var __esDecorate =
  (this && this.__esDecorate) ||
  function (
    ctor,
    descriptorIn,
    decorators,
    contextIn,
    initializers,
    extraInitializers,
  ) {
    function accept(f) {
      if (f !== void 0 && typeof f !== 'function')
        throw new TypeError('Function expected');
      return f;
    }
    var kind = contextIn.kind,
      key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
    var target =
      !descriptorIn && ctor
        ? contextIn['static']
          ? ctor
          : ctor.prototype
        : null;
    var descriptor =
      descriptorIn ||
      (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            'Cannot add initializers after decoration has completed',
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === 'accessor'
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === 'accessor') {
        if (result === void 0) continue;
        if (result === null || typeof result !== 'object')
          throw new TypeError('Object expected');
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === 'field') initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue
        ? initializers[i].call(thisArg, value)
        : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  };
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === 'symbol')
      name = name.description ? '['.concat(name.description, ']') : '';
    return Object.defineProperty(f, 'name', {
      configurable: true,
      value: prefix ? ''.concat(prefix, ' ', name) : name,
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TokenEstimator = void 0;
var common_1 = require('@nestjs/common');
/**
 * Utility service for estimating token usage
 */
var TokenEstimator = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var TokenEstimator = (_classThis = /** @class */ (function () {
    function TokenEstimator_1() {
      this.logger = new common_1.Logger(TokenEstimator.name);
      // Average tokens per character for different languages
      // These are approximate values based on GPT tokenization
      this.avgTokensPerChar = {
        default: 0.25, // English and most Latin-script languages
        cjk: 0.5, // Chinese, Japanese, Korean
        cyrillic: 0.33, // Russian and other Cyrillic-script languages
        arabic: 0.33, // Arabic and similar scripts
        code: 0.2, // Programming code (tends to have longer tokens)
      };
    }
    /**
     * Estimate tokens for a string
     * @param text Text to estimate tokens for
     * @param languageType Type of language for better estimation
     * @returns Estimated token count
     */
    TokenEstimator_1.prototype.estimateTokensForString = function (
      text,
      languageType,
    ) {
      if (languageType === void 0) {
        languageType = 'default';
      }
      if (!text) return 0;
      // Get the appropriate tokens-per-character ratio
      var ratio =
        this.avgTokensPerChar[languageType] || this.avgTokensPerChar.default;
      // Estimate tokens based on character count and language type
      return Math.ceil(text.length * ratio);
    };
    /**
     * Detect if text is likely code
     * @param text Text to analyze
     * @returns Whether the text appears to be code
     */
    TokenEstimator_1.prototype.isLikelyCode = function (text) {
      // Simple heuristic checks for code-like patterns
      var codePatterns = [
        /function\s+\w+\s*\(/, // function declarations
        /class\s+\w+/, // class declarations
        /\bif\s*\(.+\)\s*{/, // if statements
        /\bfor\s*\(.+\)\s*{/, // for loops
        /\bwhile\s*\(.+\)\s*{/, // while loops
        /\breturn\s+.+;/, // return statements
        /import\s+.+\s+from\s+['"].+['"];/, // ES6 imports
        /const\s+\w+\s*=/, // const declarations
        /let\s+\w+\s*=/, // let declarations
        /var\s+\w+\s*=/, // var declarations
      ];
      // If the text contains multiple code patterns, it's likely code
      var matchCount = 0;
      for (
        var _i = 0, codePatterns_1 = codePatterns;
        _i < codePatterns_1.length;
        _i++
      ) {
        var pattern = codePatterns_1[_i];
        if (pattern.test(text)) {
          matchCount++;
        }
        if (matchCount >= 2) return true;
      }
      // Check for common indentation patterns
      var lines = text.split('\n');
      if (lines.length > 5) {
        var indentedLines = 0;
        for (var _a = 0, lines_1 = lines; _a < lines_1.length; _a++) {
          var line = lines_1[_a];
          if (/^\s{2,}/.test(line)) {
            indentedLines++;
          }
        }
        // If more than 30% of lines are indented, likely code
        if (indentedLines / lines.length > 0.3) return true;
      }
      return false;
    };
    /**
     * Detect the likely language type of text
     * @param text Text to analyze
     * @returns The detected language type
     */
    TokenEstimator_1.prototype.detectLanguageType = function (text) {
      if (this.isLikelyCode(text)) return 'code';
      // Check for CJK characters (Chinese, Japanese, Korean)
      var cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
      if (cjkPattern.test(text)) return 'cjk';
      // Check for Cyrillic characters
      var cyrillicPattern = /[\u0400-\u04FF]/;
      if (cyrillicPattern.test(text)) return 'cyrillic';
      // Check for Arabic characters
      var arabicPattern = /[\u0600-\u06FF]/;
      if (arabicPattern.test(text)) return 'arabic';
      return 'default';
    };
    /**
     * Estimate tokens for a chat message
     * @param message Chat message
     * @returns Estimated token count
     */
    TokenEstimator_1.prototype.estimateTokensForMessage = function (message) {
      // Base tokens for message structure including role
      var tokens = 4; // Each message has ~4 tokens of overhead
      // Add tokens for content
      if (message.content) {
        var languageType = this.detectLanguageType(message.content);
        tokens += this.estimateTokensForString(message.content, languageType);
      }
      // Add tokens for name if present
      if (message.name) {
        tokens += this.estimateTokensForString(message.name);
      }
      // Add tokens for function call if present
      if (message.functionCall) {
        // Function name
        tokens += this.estimateTokensForString(message.functionCall.name);
        // Function arguments
        var argsString = '';
        if (typeof message.functionCall.arguments === 'string') {
          argsString = message.functionCall.arguments;
        } else {
          try {
            argsString = JSON.stringify(message.functionCall.arguments);
          } catch (error) {
            this.logger.warn(
              'Could not serialize function arguments: '.concat(error.message),
            );
          }
        }
        tokens += this.estimateTokensForString(argsString, 'code');
      }
      return tokens;
    };
    /**
     * Estimate tokens for conversation messages
     * @param messages Chat messages
     * @returns Estimated token count
     */
    TokenEstimator_1.prototype.estimateTokensForConversation = function (
      messages,
    ) {
      // Base tokens for conversation structure
      var tokens = 2; // ~2 tokens of overhead for the conversation wrapper
      // Add tokens for each message
      for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        tokens += this.estimateTokensForMessage(message);
      }
      return tokens;
    };
    /**
     * Estimate tokens for function definitions
     * @param functions Function definitions
     * @returns Estimated token count
     */
    TokenEstimator_1.prototype.estimateTokensForFunctions = function (
      functions,
    ) {
      var tokens = 0;
      for (var _i = 0, functions_1 = functions; _i < functions_1.length; _i++) {
        var fn = functions_1[_i];
        // Function name
        tokens += this.estimateTokensForString(fn.name);
        // Function description
        tokens += this.estimateTokensForString(fn.description);
        // Function parameters
        try {
          var paramsString = JSON.stringify(fn.parameters);
          tokens += this.estimateTokensForString(paramsString, 'code');
        } catch (error) {
          this.logger.warn(
            'Could not serialize function parameters: '.concat(error.message),
          );
        }
      }
      return tokens;
    };
    return TokenEstimator_1;
  })());
  __setFunctionName(_classThis, 'TokenEstimator');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    TokenEstimator = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (TokenEstimator = _classThis);
})();
exports.TokenEstimator = TokenEstimator;
