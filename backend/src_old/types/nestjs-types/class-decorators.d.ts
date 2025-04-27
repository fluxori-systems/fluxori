// Type definitions for NestJS class decorators
declare module "@nestjs/common" {
  // Class Decorators
  export function Controller(prefix?: string | string[]): ClassDecorator;
  export function Injectable(options?: {
    scope?: any;
    durable?: boolean;
  }): ClassDecorator;
  export function Module(metadata: {
    imports?: any[];
    controllers?: any[];
    providers?: any[];
    exports?: any[];
  }): ClassDecorator;
  export function Global(): ClassDecorator;
  export function Catch(...exceptions: any[]): ClassDecorator;
}
