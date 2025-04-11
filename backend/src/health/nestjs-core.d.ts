/**
 * Type declaration overrides for @nestjs/common decorators
 * This helps TypeScript correctly resolve decorator types
 */

import "reflect-metadata";

declare global {
  // Fix TypeScript decorator error with experimentalDecorators
  interface ClassDecorator {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TFunction extends Function>(target: TFunction): TFunction | void;
  }

  interface PropertyDecorator {
    (target: Object, propertyKey: string | symbol): void;
  }

  interface MethodDecorator {
    <T>(
      target: Object,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<T>,
    ): TypedPropertyDescriptor<T> | void;
  }

  interface ParameterDecorator {
    (
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ): void;
  }
}

declare module "@nestjs/common" {
  export function Controller(prefix?: string | string[]): ClassDecorator;
  export function Get(path?: string | string[]): MethodDecorator;
  export function Post(path?: string | string[]): MethodDecorator;
  export function Put(path?: string | string[]): MethodDecorator;
  export function Delete(path?: string | string[]): MethodDecorator;
  export function Patch(path?: string | string[]): MethodDecorator;
  export function Options(path?: string | string[]): MethodDecorator;
  export function Head(path?: string | string[]): MethodDecorator;
  export function All(path?: string | string[]): MethodDecorator;
  export function Inject(token: any): ParameterDecorator;
  export function Optional(): ParameterDecorator;
  export function Injectable(options?: {
    scope?: any;
    durable?: boolean;
  }): ClassDecorator;
  export function UseGuards(...guards: any[]): MethodDecorator & ClassDecorator;
  export function UseInterceptors(
    ...interceptors: any[]
  ): MethodDecorator & ClassDecorator;
  export function UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator;
  export function UseFilters(
    ...filters: any[]
  ): MethodDecorator & ClassDecorator;
}

declare module "@nestjs/terminus" {
  export interface HealthCheckOptions {
    noCache?: boolean;
    swaggerDocumentation?: boolean;
  }

  export const HealthCheck: (options?: HealthCheckOptions) => MethodDecorator;

  export interface HealthIndicatorResult {
    [key: string]: {
      status: string;
      [key: string]: any;
    };
  }

  export interface HealthCheckResult {
    status: string;
    info?: HealthIndicatorResult;
    error?: HealthIndicatorResult;
    details: HealthIndicatorResult;
  }

  export class HealthCheckService {
    check(
      indicators: Array<() => Promise<HealthIndicatorResult> | Promise<any>>,
    ): Promise<HealthCheckResult>;
  }

  export abstract class HealthIndicator {
    protected getStatus(
      key: string,
      isHealthy: boolean,
      data?: { [key: string]: any },
    ): HealthIndicatorResult;
  }
}
