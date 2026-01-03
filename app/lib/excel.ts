// Exporta una factura y sus items a Excel de forma clara y ordenada
import * as XLSX from 'xlsx';

/**
 * Exporta la información de una factura y sus items a un archivo Excel.
 * @param form Objeto con los datos generales de la factura
 * @param items Array de items de la factura
 */
export function exportInvoiceToExcel(form: any, items: any[]) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Información general de la factura
  const generalInfo = [
    ['INVOICE INFORMATION'],
    [],
    ['Vendor', form.vendor || ''],
    ['Bill Number', form.bill_number || ''],
    ['Date', form.date || ''],
    ['Due Date', form.due_date || ''],
    ['Terms', form.terms || ''],
    ['Category', form.category || ''],
    ['Memo', form.memo || ''],
    ['Tax', form.tax || 0],
    ['Shipping', form.shipping || 0],
    ['Correction', form.correction || 0],
    ['Amount', form.amount || 0],
  ];
  const wsGeneral = XLSX.utils.aoa_to_sheet(generalInfo);
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'General Info');

  // Hoja 2: Items de la factura
  const itemHeaders = [
    'PRODUCT (AI)', 'ITEM', 'QTY', 'UNITS', 'UNIT PRICE', 'AMOUNT', 'CATEGORY', 'DISCREPANCY'
  ];
  const itemRows = items.map((item: any) => [
    item.product_ai || '',
    item.item || '',
    item.quantity || 0,
    item.units || '',
    item.unit_price || 0,
    item.amount || 0,
    item.category || '',
    item.discrepancy || ''
  ]);
  const wsItems = XLSX.utils.aoa_to_sheet([
    itemHeaders,
    ...itemRows
  ]);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Invoice Items');

  // Nombre de archivo
  const filename = `Invoice_${form.vendor || 'Vendor'}_${form.bill_number || ''}.xlsx`;
  XLSX.writeFile(wb, filename);
}

import { Event, SalesRow, SalesTotals } from './types'


export function exportEmployeeTipReport(
  eventInfo: any,
  tipDistribution: any[],
  totals: SalesTotals,
  sales: SalesRow[]
) {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Employee Tip Report - Simple version for employees
  const tipData = [
    ['EMPLOYEE GRATUITY REPORT'],
    [],
    ['Event:', eventInfo.eventName],
    ['Date:', eventInfo.date],
    ['Shift:', eventInfo.shift],
    [],
    ['EMPLOYEE', 'POSITION', 'CC GRATUITY', 'CASH GRATUITY', 'TOTAL GRATUITY', 'POINTS'],
    ...tipDistribution.map((row) => {
      const employeeData = sales.find(s => s.employee === row.employee)
      const position = employeeData?.position || ''
      const points = employeeData?.points || 0
      return [
        row.employee,
        position,
        `$${(row.ccGratuity || 0).toFixed(2)}`,
        `$${(row.cashGratuity || 0).toFixed(2)}`,
        `$${row.tips.toFixed(2)}`,
        points
      ]
    }),
    [],
    ['TOTAL', '', `$${totals.totalCcGratuity.toFixed(2)}`, `$${totals.totalCashGratuity.toFixed(2)}`, `$${totals.totalGratuity.toFixed(2)}`, totals.totalPoints]
  ]

  const tipWs = XLSX.utils.aoa_to_sheet(tipData)
  XLSX.utils.book_append_sheet(wb, tipWs, 'Employee Report')

  // Generate filename
  const date = eventInfo.date || new Date().toISOString().split('T')[0]
  const eventName = eventInfo.eventName || 'EVENT'
  const filename = `${eventName}_${date}_EmployeeReport.xlsx`

  // Write file
  XLSX.writeFile(wb, filename)
}

export function calculateTotals(sales: SalesRow[]): SalesTotals {
  return {
    totalNetSales: sales.reduce((sum, row) => sum + (row.netSales || 0), 0),
    totalCashSales: sales.reduce((sum, row) => sum + (row.cashSales || 0), 0),
    totalCcSales: sales.reduce((sum, row) => sum + (row.ccSales || 0), 0),
    totalCcGratuity: sales.reduce((sum, row) => sum + (row.ccGratuity || 0), 0),
    totalCashGratuity: sales.reduce((sum, row) => sum + (row.cashGratuity || 0), 0),
    totalPoints: sales.reduce((sum, row) => sum + (row.points || 0), 0),
    totalGratuity: sales.reduce((sum, row) => sum + (row.ccGratuity || 0) + (row.cashGratuity || 0), 0),
  }
}
