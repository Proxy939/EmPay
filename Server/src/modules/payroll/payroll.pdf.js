// src/modules/payroll/payroll.pdf.js
// Generates a PDFKit document for a payslip. Returns the doc (caller must pipe + end).
const PDFDocument = require('pdfkit')
const { amountToWords } = require('../../utils/amountInWords')
const { monthName } = require('../../utils/dateHelpers')

// ── Design tokens ──────────────────────────────────────────────────────────────
const INDIGO  = '#4f46e5'
const TEAL    = '#00b4d8'
const GRAY    = '#6b7280'
const LGRAY   = '#f3f4f6'
const BLACK   = '#111827'
const WHITE   = '#ffffff'
const PAGE_W  = 595.28   // A4
const PAGE_H  = 841.89
const MARGIN  = 40

function generatePdf(payslip) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })

  const emp    = payslip.employee
  const pr     = payslip.payrun
  const comp   = payslip.components || {}
  const pStart = new Date(pr.periodStart)
  const pEnd   = new Date(pr.periodEnd)
  const periodLabel = `${monthName(pStart.getMonth() + 1)} ${pStart.getFullYear()}`

  // ── Header band ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, 80).fill(INDIGO)

  doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
     .text('EmPay HRMS', MARGIN, 22)
  doc.fontSize(9).font('Helvetica')
     .text('Salary Slip', MARGIN, 44)
  doc.fontSize(14).font('Helvetica-Bold')
     .text(`For the Month of ${periodLabel}`, PAGE_W / 2, 28, { align: 'right', width: PAGE_W / 2 - MARGIN })

  // ── Employee details grid ────────────────────────────────────────────────────
  let y = 100
  const colW = (PAGE_W - MARGIN * 2) / 2

  doc.fillColor(LGRAY).rect(MARGIN, y, PAGE_W - MARGIN * 2, 18).fill()
  doc.fillColor(INDIGO).fontSize(9).font('Helvetica-Bold')
     .text('EMPLOYEE DETAILS', MARGIN + 6, y + 5)
  y += 22

  const details = [
    ['Employee Name',  `${emp.firstName} ${emp.lastName}`,   'Employee Code', emp.user?.loginId || '—'],
    ['Department',     emp.department      || '—',            'Designation',   emp.designation   || '—'],
    ['Location',       emp.companyLocation || '—',            'Date of Joining', emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : '—'],
    ['PAN Number',     emp.panNumber       || '—',            'UAN Number',    emp.uanNumber     || '—'],
    ['Bank A/C',       emp.bankAccountNumber || '—',          'Bank Name',     emp.bankName      || '—'],
    ['Pay Period',     `${pStart.toLocaleDateString('en-IN')} – ${pEnd.toLocaleDateString('en-IN')}`, 'Pay Date', new Date().toLocaleDateString('en-IN')],
  ]

  details.forEach(([l1, v1, l2, v2]) => {
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(l1 + ':', MARGIN, y)
    doc.fillColor(BLACK).font('Helvetica-Bold').text(v1, MARGIN + 90, y)
    doc.fillColor(GRAY).font('Helvetica').text(l2 + ':', MARGIN + colW, y)
    doc.fillColor(BLACK).font('Helvetica-Bold').text(v2, MARGIN + colW + 90, y)
    y += 16
  })
  y += 8

  // ── Worked days table ────────────────────────────────────────────────────────
  doc.fillColor(LGRAY).rect(MARGIN, y, PAGE_W - MARGIN * 2, 18).fill()
  doc.fillColor(TEAL).fontSize(9).font('Helvetica-Bold')
     .text('DAYS SUMMARY', MARGIN + 6, y + 5)
  y += 22

  const dayRows = [
    ['Working Days in Month', payslip.workedDays + payslip.unpaidLeaveDays + payslip.paidLeaveDays],
    ['Days Worked',           payslip.workedDays],
    ['Paid Leave Days',       payslip.paidLeaveDays],
    ['Unpaid Leave Days',     payslip.unpaidLeaveDays],
    ['Total Payable Days',    payslip.totalPayableDays],
  ]

  dayRows.forEach(([l, v]) => {
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(l + ':', MARGIN + 4, y)
    doc.fillColor(BLACK).font('Helvetica-Bold').text(String(v), MARGIN + 180, y)
    y += 14
  })
  y += 8

  // ── Earnings / Deductions ────────────────────────────────────────────────────
  const halfW = (PAGE_W - MARGIN * 2 - 20) / 2

  // Headers
  doc.fillColor(INDIGO).rect(MARGIN, y, halfW, 18).fill()
  doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
     .text('EARNINGS', MARGIN + 6, y + 5)
  doc.fillColor(TEAL).rect(MARGIN + halfW + 20, y, halfW, 18).fill()
  doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
     .text('DEDUCTIONS', MARGIN + halfW + 26, y + 5)
  y += 22

  const earnings = [
    ['Basic Salary',         comp.basicSalary       || 0],
    ['HRA',                  comp.hra               || 0],
    ['Standard Allowance',   comp.standardAllowance || 0],
    ['Performance Bonus',    comp.performanceBonus  || 0],
    ['LTA',                  comp.lta               || 0],
    ['Fixed Allowance',      comp.fixedAllowance    || 0],
  ]

  const deductions = [
    ['PF (Employee)',        payslip.pfEmployee],
    ['PF (Employer)',        payslip.pfEmployer],
    ['Professional Tax',     payslip.professionalTax],
    ['TDS',                  payslip.tdsDeduction],
  ]

  const maxRows = Math.max(earnings.length, deductions.length)
  for (let i = 0; i < maxRows; i++) {
    const bg = i % 2 === 0 ? '#f9fafb' : WHITE

    // Earnings row
    if (earnings[i]) {
      doc.fillColor(bg).rect(MARGIN, y, halfW, 14).fill()
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text(earnings[i][0], MARGIN + 4, y + 3)
      doc.fillColor(BLACK).font('Helvetica-Bold')
         .text(`₹ ${earnings[i][1].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, MARGIN + 4, y + 3, { align: 'right', width: halfW - 8 })
    }

    // Deductions row
    const dx = MARGIN + halfW + 20
    if (deductions[i]) {
      doc.fillColor(bg).rect(dx, y, halfW, 14).fill()
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text(deductions[i][0], dx + 4, y + 3)
      doc.fillColor('#dc2626').font('Helvetica-Bold')
         .text(`- ₹ ${deductions[i][1].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, dx + 4, y + 3, { align: 'right', width: halfW - 8 })
    }
    y += 14
  }

  // Totals
  y += 4
  const totalDeductions = payslip.pfEmployee + payslip.professionalTax + payslip.tdsDeduction
  doc.fillColor(LGRAY).rect(MARGIN, y, halfW, 18).fill()
  doc.fillColor(INDIGO).fontSize(9).font('Helvetica-Bold')
     .text('Gross Salary', MARGIN + 4, y + 4)
  doc.text(`₹ ${payslip.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, MARGIN + 4, y + 4, { align: 'right', width: halfW - 8 })

  const dx2 = MARGIN + halfW + 20
  doc.fillColor(LGRAY).rect(dx2, y, halfW, 18).fill()
  doc.fillColor('#dc2626').text('Total Deductions', dx2 + 4, y + 4)
  doc.text(`- ₹ ${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, dx2 + 4, y + 4, { align: 'right', width: halfW - 8 })
  y += 22

  // Net payable band
  doc.fillColor(INDIGO).rect(MARGIN, y, PAGE_W - MARGIN * 2, 26).fill()
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
     .text('NET PAYABLE', MARGIN + 6, y + 7)
  doc.fontSize(12)
     .text(`₹ ${payslip.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, MARGIN, y + 7, { align: 'right', width: PAGE_W - MARGIN * 2 - 6 })
  y += 32

  // Amount in words
  doc.fillColor(GRAY).fontSize(8).font('Helvetica-Oblique')
     .text(`In Words: ${amountToWords(Math.round(payslip.netAmount))}`, MARGIN, y)
  y += 20

  // ── Employer cost note ────────────────────────────────────────────────────────
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text(`Total Employer Cost (including Employer PF): ₹ ${payslip.employerCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, MARGIN, y)
  y += 20

  // ── Footer ────────────────────────────────────────────────────────────────────
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LGRAY).stroke()
  y += 10
  doc.fillColor(GRAY).fontSize(7).font('Helvetica')
     .text('This is a computer-generated payslip and does not require a physical signature.', MARGIN, y, { align: 'center', width: PAGE_W - MARGIN * 2 })

  return doc
}

module.exports = { generatePdf }
