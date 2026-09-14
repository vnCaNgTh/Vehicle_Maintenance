const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

/** Formats a "YYYY-MM-DD" (or ISO) date string as DD/MM/YYYY for display. */
export function formatDate(dateValue: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue)
  if (match) {
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }

  const parsed = new Date(dateValue)
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString('en-GB')
}

/** Formats a numeric VND amount for display only; the stored value stays numeric. */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}
