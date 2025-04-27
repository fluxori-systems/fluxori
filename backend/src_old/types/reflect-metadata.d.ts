/**
 * Custom type definitions for reflect-metadata
 */
declare module "reflect-metadata" {
  // Reflect.decorate
  export function decorate(
    decorators: ClassDecorator[],
    target: Function,
  ): Function;
  export function decorate(
    decorators: PropertyDecorator[],
    target: object,
    propertyKey: string | symbol,
  ): void;
  export function decorate(
    decorators: MethodDecorator[],
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor;

  // Reflect.metadata
  export function metadata(
    metadataKey: any,
    metadataValue: any,
  ): {
    (target: Function): void;
    (target: object, propertyKey: string | symbol): void;
  };

  // Reflect.defineMetadata
  export function defineMetadata(
    metadataKey: any,
    metadataValue: any,
    target: object,
  ): void;
  export function defineMetadata(
    metadataKey: any,
    metadataValue: any,
    target: object,
    propertyKey: string | symbol,
  ): void;

  // Reflect.hasMetadata
  export function hasMetadata(metadataKey: any, target: object): boolean;
  export function hasMetadata(
    metadataKey: any,
    target: object,
    propertyKey: string | symbol,
  ): boolean;

  // Reflect.hasOwnMetadata
  export function hasOwnMetadata(metadataKey: any, target: object): boolean;
  export function hasOwnMetadata(
    metadataKey: any,
    target: object,
    propertyKey: string | symbol,
  ): boolean;

  // Reflect.getMetadata
  export function getMetadata(metadataKey: any, target: object): any;
  export function getMetadata(
    metadataKey: any,
    target: object,
    propertyKey: string | symbol,
  ): any;

  // Reflect.getOwnMetadata
  export function getOwnMetadata(metadataKey: any, target: object): any;
  export function getOwnMetadata(
    metadataKey: any,
    target: object,
    propertyKey: string | symbol,
  ): any;

  // Reflect.getMetadataKeys
  export function getMetadataKeys(target: object): any[];
  export function getMetadataKeys(
    target: object,
    propertyKey: string | symbol,
  ): any[];

  // Reflect.getOwnMetadataKeys
  export function getOwnMetadataKeys(target: object): any[];
  export function getOwnMetadataKeys(
    target: object,
    propertyKey: string | symbol,
  ): any[];

  // Reflect.deleteMetadata
  export function deleteMetadata(metadataKey: any, target: object): boolean;
  export function deleteMetadata(
    metadataKey: any,
    target: object,
    propertyKey: string | symbol,
  ): boolean;
}
