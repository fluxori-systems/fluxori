import 'vitest';

declare global {
  type Mock<T = any> = {
    (...args: any[]): any;
    mock: {
      calls: any[][];
      instances: any[];
      clear(): void;
      reset(): void;
      restore(): void;
    };
  };
}

export {};
