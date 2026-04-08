import * as Joi from 'joi';

/**
 * ARCHITECTURE NOTE:
 * Joi schema validation on startup means the app crashes immediately with a
 * descriptive error if any required env var is missing or malformed.
 * This "fail fast" behaviour surfaces config problems in dev/CI before they
 * cause mysterious runtime failures in production. Never rely on optional env
 * vars silently defaulting to undefined in business logic.
 */
export const appConfigSchema = Joi.object({
  TCP_PORT: Joi.number().integer().min(1024).max(65535).default(3001),
  SQLITE_PATH: Joi.string().default('/data/expenses.db'),
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  KAFKA_BROKER: Joi.string().default('localhost:9092'),
  LARGE_EXPENSE_THRESHOLD_CENTS: Joi.number().integer().min(1).default(50000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
