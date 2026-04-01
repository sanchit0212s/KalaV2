// Display-only money formatting for catalog, cart, and checkout amounts.

/**
 * Format a money amount for display using the supplied currency code.
 */
export function formatMoneyAmount(amount: string | number, currencyCode: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencyCode} 0`;
  return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'INR' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'INR' ? 0 : 2,
  }).format(num);
}
