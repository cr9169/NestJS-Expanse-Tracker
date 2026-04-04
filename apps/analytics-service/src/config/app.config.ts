import * as Joi from 'joi';

export const appConfigSchema = Joi.object({
  TCP_PORT: Joi.number().integer().min(1024).max(65535).default(3003),
  KAFKA_BROKER: Joi.string().default('localhost:9092'),
  SQLITE_PATH: Joi.string().default('/data/analytics.db'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
