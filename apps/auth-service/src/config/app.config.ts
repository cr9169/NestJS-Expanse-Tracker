import * as Joi from 'joi';

export const appConfigSchema = Joi.object({
  TCP_PORT: Joi.number().integer().min(1024).max(65535).default(3005),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  SQLITE_PATH: Joi.string().default('/data/auth.db'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
