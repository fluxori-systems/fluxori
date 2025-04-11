import { Injectable, Logger } from "@nestjs/common";

import { ChatMessage } from "../interfaces/model-adapter.interface";

/**
 * Utility service for estimating token usage
 */
@Injectable()
export class TokenEstimator {
  private readonly logger = new Logger(TokenEstimator.name);

  // Average tokens per character for different languages
  // These are approximate values based on GPT tokenization
  private readonly avgTokensPerChar = {
    default: 0.25, // English and most Latin-script languages
    cjk: 0.5, // Chinese, Japanese, Korean
    cyrillic: 0.33, // Russian and other Cyrillic-script languages
    arabic: 0.33, // Arabic and similar scripts
    code: 0.2, // Programming code (tends to have longer tokens)
  };

  /**
   * Estimate tokens for a string
   * @param text Text to estimate tokens for
   * @param languageType Type of language for better estimation
   * @returns Estimated token count
   */
  estimateTokensForString(
    text: string,
    languageType: keyof typeof this.avgTokensPerChar = "default",
  ): number {
    if (!text) return 0;

    // Get the appropriate tokens-per-character ratio
    const ratio =
      this.avgTokensPerChar[languageType] || this.avgTokensPerChar.default;

    // Estimate tokens based on character count and language type
    return Math.ceil(text.length * ratio);
  }

  /**
   * Detect if text is likely code
   * @param text Text to analyze
   * @returns Whether the text appears to be code
   */
  private isLikelyCode(text: string): boolean {
    // Simple heuristic checks for code-like patterns
    const codePatterns = [
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
    let matchCount = 0;
    for (const pattern of codePatterns) {
      if (pattern.test(text)) {
        matchCount++;
      }
      if (matchCount >= 2) return true;
    }

    // Check for common indentation patterns
    const lines = text.split("\n");
    if (lines.length > 5) {
      let indentedLines = 0;
      for (const line of lines) {
        if (/^\s{2,}/.test(line)) {
          indentedLines++;
        }
      }

      // If more than 30% of lines are indented, likely code
      if (indentedLines / lines.length > 0.3) return true;
    }

    return false;
  }

  /**
   * Detect the likely language type of text
   * @param text Text to analyze
   * @returns The detected language type
   */
  private detectLanguageType(text: string): keyof typeof this.avgTokensPerChar {
    if (this.isLikelyCode(text)) return "code";

    // Check for CJK characters (Chinese, Japanese, Korean)
    const cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
    if (cjkPattern.test(text)) return "cjk";

    // Check for Cyrillic characters
    const cyrillicPattern = /[\u0400-\u04FF]/;
    if (cyrillicPattern.test(text)) return "cyrillic";

    // Check for Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return "arabic";

    return "default";
  }

  /**
   * Estimate tokens for a chat message
   * @param message Chat message
   * @returns Estimated token count
   */
  estimateTokensForMessage(message: ChatMessage): number {
    // Base tokens for message structure including role
    let tokens = 4; // Each message has ~4 tokens of overhead

    // Add tokens for content
    if (message.content) {
      const languageType = this.detectLanguageType(message.content);
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
      let argsString = "";
      if (typeof message.functionCall.arguments === "string") {
        argsString = message.functionCall.arguments;
      } else {
        try {
          argsString = JSON.stringify(message.functionCall.arguments);
        } catch (error) {
          this.logger.warn(
            `Could not serialize function arguments: ${error.message}`,
          );
        }
      }

      tokens += this.estimateTokensForString(argsString, "code");
    }

    return tokens;
  }

  /**
   * Estimate tokens for conversation messages
   * @param messages Chat messages
   * @returns Estimated token count
   */
  estimateTokensForConversation(messages: ChatMessage[]): number {
    // Base tokens for conversation structure
    let tokens = 2; // ~2 tokens of overhead for the conversation wrapper

    // Add tokens for each message
    for (const message of messages) {
      tokens += this.estimateTokensForMessage(message);
    }

    return tokens;
  }

  /**
   * Estimate tokens for function definitions
   * @param functions Function definitions
   * @returns Estimated token count
   */
  estimateTokensForFunctions(
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>,
  ): number {
    let tokens = 0;

    for (const fn of functions) {
      // Function name
      tokens += this.estimateTokensForString(fn.name);

      // Function description
      tokens += this.estimateTokensForString(fn.description);

      // Function parameters
      try {
        const paramsString = JSON.stringify(fn.parameters);
        tokens += this.estimateTokensForString(paramsString, "code");
      } catch (error) {
        this.logger.warn(
          `Could not serialize function parameters: ${error.message}`,
        );
      }
    }

    return tokens;
  }
}
