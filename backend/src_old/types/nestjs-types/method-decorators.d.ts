// Type definitions for NestJS method decorators
declare module "@nestjs/common" {
  // HTTP Method Decorators
  export function Get(path?: string | string[]): MethodDecorator;
  export function Post(path?: string | string[]): MethodDecorator;
  export function Put(path?: string | string[]): MethodDecorator;
  export function Delete(path?: string | string[]): MethodDecorator;
  export function Patch(path?: string | string[]): MethodDecorator;
  export function Options(path?: string | string[]): MethodDecorator;
  export function Head(path?: string | string[]): MethodDecorator;
  export function All(path?: string | string[]): MethodDecorator;
}
