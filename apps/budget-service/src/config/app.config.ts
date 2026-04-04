import * as Joi from 'joi';

export const appConfigSchema = Joi.object({
  TCP_PORT: Joi.number().integer().min(1024).max(65535).default(3002),
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  SQLITE_PATH: Joi.string().default('/data/budgets.db'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
