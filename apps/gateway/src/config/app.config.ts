import * as Joi from 'joi';

export const appConfigSchema = Joi.object({
  GATEWAY_PORT: Joi.number().integer().min(1024).max(65535).default(3000),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  TCP_HOST: Joi.string().default('localhost'),
  TCP_PORT: Joi.number().integer().default(3001),
  BUDGET_TCP_HOST: Joi.string().default('localhost'),
  BUDGET_TCP_PORT: Joi.number().integer().default(3002),
  ANALYTICS_TCP_HOST: Joi.string().default('localhost'),
  ANALYTICS_TCP_PORT: Joi.number().integer().default(3003),
  NOTIFICATION_TCP_HOST: Joi.string().default('localhost'),
  NOTIFICATION_TCP_PORT: Joi.number().integer().default(3004),
  THROTTLE_TTL: Joi.number().integer().default(60000),
  THROTTLE_LIMIT: Joi.number().integer().default(10),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
