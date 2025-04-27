// Type definitions for NestJS parameter decorators
declare module "@nestjs/common" {
  // Parameter Decorators
  export function Req(): ParameterDecorator;
  export function Request(): ParameterDecorator;
  export function Res(): ParameterDecorator;
  export function Response(): ParameterDecorator;
  export function Next(): ParameterDecorator;
  export function Session(): ParameterDecorator;
  export function Param(property?: string): ParameterDecorator;
  export function Body(property?: string): ParameterDecorator;
  export function Query(property?: string): ParameterDecorator;
  export function Headers(property?: string): ParameterDecorator;
  export function Ip(): ParameterDecorator;
  export function HostParam(): ParameterDecorator;
  export function UseGuards(...guards: any[]): MethodDecorator & ClassDecorator;
  export function UseInterceptors(
    ...interceptors: any[]
  ): MethodDecorator & ClassDecorator;
  export function UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator;
  export function UseFilters(
    ...filters: any[]
  ): MethodDecorator & ClassDecorator;
  export function Inject(token: any): ParameterDecorator;
  export function Optional(): ParameterDecorator;
}
