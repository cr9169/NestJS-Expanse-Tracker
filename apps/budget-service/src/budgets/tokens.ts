export const BUDGET_REPOSITORY_TOKEN = Symbol('IBudgetRepository');
export const CREATE_BUDGET_USE_CASE_TOKEN = Symbol('CreateBudgetUseCase');
export const UPDATE_BUDGET_USE_CASE_TOKEN = Symbol('UpdateBudgetUseCase');
export const DELETE_BUDGET_USE_CASE_TOKEN = Symbol('DeleteBudgetUseCase');
export const GET_BUDGET_STATUS_USE_CASE_TOKEN = Symbol('GetBudgetStatusUseCase');
export const LIST_BUDGETS_USE_CASE_TOKEN = Symbol('ListBudgetsUseCase');
export const PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN = Symbol('ProcessExpenseEventUseCase');

// RabbitMQ client for emitting budget threshold alerts
export const RABBITMQ_CLIENT_TOKEN = Symbol('RabbitmqClient');
