/**
 * ARCHITECTURE NOTE:
 * Symbol injection tokens prevent string collision between modules and make
 * accidental injection of the wrong implementation a compile-time type error
 * rather than a runtime crash. Each Symbol is globally unique — two modules
 * can define EXPENSE_REPOSITORY_TOKEN independently and they will never clash.
 *
 * Usage: @Inject(EXPENSE_REPOSITORY_TOKEN) private readonly repo: IExpenseRepository
 */

export const EXPENSE_REPOSITORY_TOKEN = Symbol('IExpenseRepository');
export const CREATE_EXPENSE_USE_CASE_TOKEN = Symbol('CreateExpenseUseCase');
export const GET_EXPENSE_USE_CASE_TOKEN = Symbol('GetExpenseUseCase');
export const LIST_EXPENSES_USE_CASE_TOKEN = Symbol('ListExpensesUseCase');
export const UPDATE_EXPENSE_USE_CASE_TOKEN = Symbol('UpdateExpenseUseCase');
export const DELETE_EXPENSE_USE_CASE_TOKEN = Symbol('DeleteExpenseUseCase');
export const GET_EXPENSE_SUMMARY_USE_CASE_TOKEN = Symbol('GetExpenseSummaryUseCase');
