// Type definitions for NestJS
declare module "@nestjs/common" {
  // Main types that were being used as namespaces
  export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";

  export interface LoggerService {
    log(message: any, ...optionalParams: any[]): any;
    error(message: any, ...optionalParams: any[]): any;
    warn(message: any, ...optionalParams: any[]): any;
    debug?(message: any, ...optionalParams: any[]): any;
    verbose?(message: any, ...optionalParams: any[]): any;
  }

  export interface CanActivate {
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean>;
  }

  export interface ExecutionContext {
    getArgs(): any[];
    getArgByIndex(index: number): any;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    getClass(): Type<any>;
    getHandler(): Function;
    getType(): string;
  }

  export interface ArgumentsHost {
    getArgs(): any[];
    getArgByIndex(index: number): any;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    getType(): string;
  }

  export interface NestInterceptor {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<any> | Promise<Observable<any>>;
  }

  export interface CallHandler {
    handle(): Observable<any>;
  }

  export interface ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): any;
  }

  export interface DynamicModule {
    module: Type<any>;
    imports?: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
    >;
    controllers?: Type<any>[];
    providers?: Provider[];
    exports?: Array<
      | DynamicModule
      | Promise<DynamicModule>
      | string
      | symbol
      | Provider
      | ForwardReference
      | Abstract<any>
      | Function
    >;
    global?: boolean;
  }

  export interface Provider {
    provide: any;
    useClass?: Type<any>;
    useValue?: any;
    useFactory?: (...args: any[]) => any;
    useExisting?: any;
    inject?: any[];
  }

  export interface OnModuleInit {
    onModuleInit(): void | Promise<void>;
  }

  export interface Type<T = any> extends Function {
    new (...args: any[]): T;
  }

  export interface Abstract<T> extends Function {
    prototype: T;
  }

  export interface ForwardReference {
    forwardRef: () => Type<any>;
  }

  export interface Observable<T> {
    subscribe(observer?: any): any;
    pipe(...operators: any[]): Observable<any>;
  }

  export interface HttpArgumentsHost {
    getRequest<T = any>(): T;
    getResponse<T = any>(): T;
    getNext<T = any>(): T;
  }

  export interface RpcArgumentsHost {
    getData<T = any>(): T;
    getContext<T = any>(): T;
  }

  export interface WsArgumentsHost {
    getData<T = any>(): T;
    getClient<T = any>(): T;
  }

  export interface INestApplication {
    use(middleware: any): this;
    enableCors(options?: any): this;
    listen(port: number | string, callback?: () => void): Promise<any>;
    listen(
      port: number | string,
      hostname: string,
      callback?: () => void,
    ): Promise<any>;
    init(): Promise<this>;
    close(): Promise<void>;
    getHttpAdapter(): any;
    useGlobalFilters(...filters: any[]): this;
    useGlobalPipes(...pipes: any[]): this;
    useGlobalInterceptors(...interceptors: any[]): this;
    useGlobalGuards(...guards: any[]): this;
    set(key: string, value: any): this;
    get(key: string): any;
    select<T>(module: Type<T>): any;
    get<TInput = any, TResult = TInput>(
      typeOrToken: Type<TInput> | string | symbol,
    ): TResult;
  }

  /** HTTP exceptions and status codes */
  export class HttpException extends Error {
    constructor(response: string | object, status: number);
    getStatus(): number;
    getResponse(): string | object;
  }
  export class HttpStatus {
    static CONTINUE: number;
    static SWITCHING_PROTOCOLS: number;
    static OK: number;
    static CREATED: number;
    static ACCEPTED: number;
    static NON_AUTHORITATIVE_INFORMATION: number;
    static NO_CONTENT: number;
    static RESET_CONTENT: number;
    static PARTIAL_CONTENT: number;
    static MULTI_STATUS: number;
    static ALREADY_REPORTED: number;
    static IM_USED: number;
    static MULTIPLE_CHOICES: number;
    static MOVED_PERMANENTLY: number;
    static FOUND: number;
    static SEE_OTHER: number;
    static NOT_MODIFIED: number;
    static USE_PROXY: number;
    static TEMPORARY_REDIRECT: number;
    static PERMANENT_REDIRECT: number;
    static BAD_REQUEST: number;
    static UNAUTHORIZED: number;
    static PAYMENT_REQUIRED: number;
    static FORBIDDEN: number;
    static NOT_FOUND: number;
    static METHOD_NOT_ALLOWED: number;
    static NOT_ACCEPTABLE: number;
    static PROXY_AUTHENTICATION_REQUIRED: number;
    static REQUEST_TIMEOUT: number;
    static CONFLICT: number;
    static GONE: number;
    static LENGTH_REQUIRED: number;
    static PRECONDITION_FAILED: number;
    static PAYLOAD_TOO_LARGE: number;
    static URI_TOO_LONG: number;
    static UNSUPPORTED_MEDIA_TYPE: number;
    static RANGE_NOT_SATISFIABLE: number;
    static EXPECTATION_FAILED: number;
    static I_AM_A_TEAPOT: number;
    static MISDIRECTED_REQUEST: number;
    static UNPROCESSABLE_ENTITY: number;
    static LOCKED: number;
    static FAILED_DEPENDENCY: number;
    static TOO_EARLY: number;
    static UPGRADE_REQUIRED: number;
    static PRECONDITION_REQUIRED: number;
    static TOO_MANY_REQUESTS: number;
    static REQUEST_HEADER_FIELDS_TOO_LARGE: number;
    static UNAVAILABLE_FOR_LEGAL_REASONS: number;
    static INTERNAL_SERVER_ERROR: number;
    static NOT_IMPLEMENTED: number;
    static BAD_GATEWAY: number;
    static SERVICE_UNAVAILABLE: number;
    static GATEWAY_TIMEOUT: number;
    static HTTP_VERSION_NOT_SUPPORTED: number;
    static VARIANT_ALSO_NEGOTIATES: number;
    static INSUFFICIENT_STORAGE: number;
    static LOOP_DETECTED: number;
    static NOT_EXTENDED: number;
    static NETWORK_AUTHENTICATION_REQUIRED: number;
  }
  export class UnauthorizedException extends HttpException {}
  export class BadRequestException extends HttpException {}
  export class NotFoundException extends HttpException {}
  export class ForbiddenException extends HttpException {}
  export class ConflictException extends HttpException {}
  export class InternalServerErrorException extends HttpException {}
  export class HttpCode {
    constructor(statusCode: number);
  }

  /** Parameter and validation decorators */
  export function SetMetadata(key: string, value: any): any;
  export function UploadedFile(): any;
  export function StreamableFile(): any;
  export function ParseFilePipe(options?: any): any;
  export class MaxFileSizeValidator {
    constructor(maxBytes: number);
  }
  export class FileTypeValidator {
    constructor(options: any);
  }
  export class ValidationPipe {
    constructor(options?: any);
  }
  export class ClassSerializerInterceptor {}

  /** Lifecycle interfaces and helpers */
  export interface OnModuleDestroy {
    onModuleDestroy(): void | Promise<void>;
  }
  export function forwardRef(fn: () => any): any;

  /** Concrete Logger implementation stub */
  export class Logger implements LoggerService {
    /** Create a NestJS Logger or wrap a custom LoggerService */
    constructor(context?: string | LoggerService);
    log(message: any, context?: string): any;
    error(message: any, trace?: string, context?: string): any;
    warn(message: any, context?: string): any;
    debug?(message: any, context?: string): any;
    verbose?(message: any, context?: string): any;
  }
}
