import * as Joi from 'joi';

/**
 * Configuration validation schema for environment variables
 *
 * This schema is used to validate environment variables at application startup
 * to ensure all required configurations are properly set.
 */
export const configValidationSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  // Server configuration
  PORT: Joi.number().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('api'),

  // Security and CORS
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('dev-secret-key'),
  }),
  JWT_EXPIRATION: Joi.string().default('1d'),
  CORS_ORIGIN: Joi.string().default('*'),

  // Google Cloud Platform
  GCP_PROJECT_ID: Joi.string().required(),
  GCP_KEY_FILE: Joi.string().optional(),
  GCP_LOCATION: Joi.string().default('europe-west1'),

  // Firestore configuration
  FIRESTORE_DATABASE_ID: Joi.string().default('fluxori-db'),
  FIRESTORE_COLLECTION_PREFIX: Joi.string().optional(),

  // Storage configuration
  GCS_BUCKET_NAME: Joi.string().default('fluxori-uploads'),

  // Logging and monitoring
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'verbose', 'debug')
    .default('info'),

  // API documentation
  SWAGGER_ENABLED: Joi.string().valid('true', 'false').default('true'),

  // Feature flags
  ENABLE_CACHE: Joi.boolean().default(true),

  // Vertex AI configuration for RAG and AI insights
  VERTEX_AI_LOCATION: Joi.string().default('europe-west4'),
  EMBEDDING_MODEL: Joi.string().default('textembedding-gecko@latest'),
  GENERATION_MODEL: Joi.string().default('gemini-1.0-pro'),

  // Service authentication
  SERVICE_AUTH_ENABLED: Joi.boolean().default(false),
  SERVICE_AUTH_SECRET: Joi.string().when('SERVICE_AUTH_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
