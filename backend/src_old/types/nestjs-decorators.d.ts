/**
 * Type declaration overrides for NestJS decorators
 * This helps TypeScript correctly resolve decorator types
 */

import "reflect-metadata";

declare module "@nestjs/common" {
  export interface RequestMappingMetadata {
    path?: string | string[];
    method?: string;
  }

  // HTTP Method Decorators
  export function Get(path?: string | string[]): MethodDecorator;
  export function Post(path?: string | string[]): MethodDecorator;
  export function Put(path?: string | string[]): MethodDecorator;
  export function Delete(path?: string | string[]): MethodDecorator;
  export function Patch(path?: string | string[]): MethodDecorator;
  export function Options(path?: string | string[]): MethodDecorator;
  export function Head(path?: string | string[]): MethodDecorator;
  export function All(path?: string | string[]): MethodDecorator;

  // Controller Decorator
  export function Controller(prefix?: string | string[]): ClassDecorator;

  // Guard Decorators
  export function UseGuards(...guards: any[]): MethodDecorator & ClassDecorator;

  // Parameter Decorators
  export function Request(): ParameterDecorator;
  export function Response(): ParameterDecorator;
  export function Next(): ParameterDecorator;
  export function Session(): ParameterDecorator;
  export function Param(property?: string): ParameterDecorator;
  export function Body(property?: string): ParameterDecorator;
  export function Query(property?: string): ParameterDecorator;
  export function Headers(property?: string): ParameterDecorator;
  export function Ip(): ParameterDecorator;
  export function HostParam(): ParameterDecorator;

  // Other Common Decorators
  export function Injectable(options?: {
    scope?: any;
    durable?: boolean;
  }): ClassDecorator;
  export function Optional(): ParameterDecorator;
  export function Inject(token: any): ParameterDecorator;
  export function UseInterceptors(
    ...interceptors: any[]
  ): MethodDecorator & ClassDecorator;
  export function UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator;
  export function UseFilters(
    ...filters: any[]
  ): MethodDecorator & ClassDecorator;

  // Create custom parameter decorator
  export function createParamDecorator(
    factory: (data: any, ctx: any) => any,
    options?: { scope?: any },
  ): (...args: any[]) => ParameterDecorator;
}
