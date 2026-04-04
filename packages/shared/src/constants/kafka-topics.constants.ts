/**
 * Kafka topic names for event streaming.
 *
 * Unlike RabbitMQ (work queues with message deletion after ack), Kafka retains
 * events in an ordered log. Consumers can replay from any offset, making it
 * ideal for building materialized views and analytics pipelines.
 */
export const KAFKA_TOPICS = {
  /** Full ordered log of expense create/update/delete events */
  EXPENSE_LIFECYCLE: 'expense.lifecycle',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
