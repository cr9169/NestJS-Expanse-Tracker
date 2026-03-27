/**
 * Mirror of the expenses-service AppException hierarchy.
 * Used in the gateway to reconstruct typed errors from TCP RpcException payloads.
 */
export class AppException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
