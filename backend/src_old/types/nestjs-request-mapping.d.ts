import "reflect-metadata";

declare module "@nestjs/common" {
  export interface RequestMappingMetadata {
    path?: string | string[];
    method?: string;
  }

  // Function that creates decorators for HTTP methods
  export type RequestMappingDecorator = (
    path?: string | string[],
  ) => MethodDecorator;

  // HTTP Method Decorators
  export const Get: RequestMappingDecorator;
  export const Post: RequestMappingDecorator;
  export const Put: RequestMappingDecorator;
  export const Delete: RequestMappingDecorator;
  export const Patch: RequestMappingDecorator;
  export const Options: RequestMappingDecorator;
  export const Head: RequestMappingDecorator;
  export const All: RequestMappingDecorator;

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
}
