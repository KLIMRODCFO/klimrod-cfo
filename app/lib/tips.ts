import { SalesRow, SalesTotals } from './types'

/**
 * Calcular distribución de propinas entre empleados
 * @param sales - Array de filas de ventas
 * @param distributionMethod - Método de distribución: 'percentage' (por puntos) o 'equal' (partes iguales)
 * @returns Objeto con distribución de propinas por empleado
 */
export function calculateTipDistribution(
  sales: SalesRow[],
  distributionMethod: 'percentage' | 'equal' = 'percentage'
) {
  const totals = calculateTotalGratuity(sales)
  const totalGratuity = totals.totalGratuity

  if (distributionMethod === 'equal') {
    // Distribuir propinas en partes iguales entre empleados
    const employeeCount = sales.filter((s) => String(s.employee || '').trim()).length
    const tipPerEmployee = employeeCount > 0 ? totalGratuity / employeeCount : 0
    const ccPerEmployee = employeeCount > 0 ? totals.totalCcGratuity / employeeCount : 0
    const cashPerEmployee = employeeCount > 0 ? totals.totalCashGratuity / employeeCount : 0

    return sales.map((row) => ({
      employee: row.employee,
      tips: String(row.employee || '').trim() ? tipPerEmployee : 0,
      ccGratuity: String(row.employee || '').trim() ? ccPerEmployee : 0,
      cashGratuity: String(row.employee || '').trim() ? cashPerEmployee : 0,
    }))
  }

  // Distribuir por porcentaje de puntos (default)
  const totalPoints = sales.reduce((sum, row) => sum + (row.points || 0), 0)

  return sales.map((row) => {
    const percentage = totalPoints > 0 ? (row.points || 0) / totalPoints : 0
    const tips = percentage * totalGratuity
    const ccTips = percentage * totals.totalCcGratuity
    const cashTips = percentage * totals.totalCashGratuity
    return {
      employee: row.employee,
      tips: Math.round(tips * 100) / 100,
      ccGratuity: Math.round(ccTips * 100) / 100,
      cashGratuity: Math.round(cashTips * 100) / 100,
      points: row.points || 0
    }
  })
}

/**
 * Calcular solo propinas totales
 */
export function calculateTotalGratuity(sales: SalesRow[]) {
  return {
    totalCcGratuity: sales.reduce((sum, row) => sum + (row.ccGratuity || 0), 0),
    totalCashGratuity: sales.reduce((sum, row) => sum + (row.cashGratuity || 0), 0),
    totalGratuity: sales.reduce(
      (sum, row) => sum + (row.ccGratuity || 0) + (row.cashGratuity || 0),
      0
    ),
  }
}

/**
 * Generar reporte de propinas
 */
export function generateTipReport(sales: SalesRow[], distributionMethod: 'percentage' | 'equal' = 'percentage') {
  const tipDistribution = calculateTipDistribution(sales, distributionMethod)
  const gratuityTotals = calculateTotalGratuity(sales)

  return {
    distribution: tipDistribution,
    totals: gratuityTotals,
    method: distributionMethod,
  }
}
