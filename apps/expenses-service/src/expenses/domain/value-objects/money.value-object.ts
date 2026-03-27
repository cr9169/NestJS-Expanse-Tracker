import { DomainException } from '../../../common/exceptions/domain.exception';

/**
 * ARCHITECTURE NOTE:
 * Money is a Value Object — it has no identity and is compared by value.
 * We store amounts as integer cents (not floats) because IEEE 754 floats
 * cannot represent most decimal fractions exactly. For example:
 *   0.1 + 0.2 === 0.30000000000000004 in JavaScript
 * At scale, this causes balance discrepancies, rounding errors in reports,
 * and tax calculation bugs. Storing cents eliminates the problem at the source.
 *
 * The Value Object is immutable — all methods return new instances.
 */
export class Money {
  private constructor(
    /** Amount in smallest currency unit (e.g. cents for USD) */
    public readonly amountCents: number,
    /** ISO 4217 currency code */
    public readonly currency: string,
  ) {}

  /**
   * Create Money from an integer cent value (e.g. 1500 = $15.00).
   * This is the canonical factory — used when loading from DB.
   */
  static fromCents(amountCents: number, currency: string): Money {
    if (!Number.isInteger(amountCents)) {
      throw new DomainException('INVALID_AMOUNT', 'Amount must be an integer number of cents');
    }
    if (amountCents <= 0) {
      throw new DomainException('INVALID_AMOUNT', 'Amount must be greater than zero');
    }
    const normalizedCurrency = currency.trim().toUpperCase();
    if (normalizedCurrency.length !== 3) {
      throw new DomainException('INVALID_CURRENCY', 'Currency must be a 3-letter ISO 4217 code');
    }
    return new Money(amountCents, normalizedCurrency);
  }

  /**
   * Create Money from a decimal string (e.g. "15.00" → 1500 cents).
   * Used when the client sends a decimal amount.
   */
  static fromDecimalString(decimalAmount: string, currency: string): Money {
    const parts = decimalAmount.split('.');
    const wholePart = parts[0] ?? '0';
    const fracPart = (parts[1] ?? '00').padEnd(2, '0').slice(0, 2);
    const cents = parseInt(wholePart, 10) * 100 + parseInt(fracPart, 10);
    return Money.fromCents(cents, currency);
  }

  /** Convert back to decimal for display (e.g. 1500 → 15.00) */
  toDecimal(): number {
    return this.amountCents / 100;
  }

  /** Format for display (e.g. "$15.00") */
  toString(): string {
    return `${this.currency} ${this.toDecimal().toFixed(2)}`;
  }

  equals(other: Money): boolean {
    return this.amountCents === other.amountCents && this.currency === other.currency;
  }
}
