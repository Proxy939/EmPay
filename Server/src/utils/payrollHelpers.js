// src/utils/payrollHelpers.js

/**
 * Calculate all salary components from basicWage, payableDays, and total working days in month.
 *
 * Formula:
 *   dailyWage         = basicWage / workingDaysInMonth
 *   scaledBasic       = dailyWage * payableDays
 *   hra               = scaledBasic * 0.50
 *   standardAllowance = scaledBasic * 0.1667
 *   performanceBonus  = scaledBasic * 0.0833
 *   lta               = scaledBasic * 0.0833
 *   fixedAllowance    = remaining to fill grossAmount
 *   grossAmount       = scaledBasic * 2.00  (salary structure targets 2× basic as gross)
 *   pfEmployee        = grossAmount * 0.06
 *   pfEmployer        = grossAmount * 0.06
 *   professionalTax   = 200 (flat)
 *   netAmount         = grossAmount - pfEmployee - professionalTax - tds
 *   employerCost      = grossAmount + pfEmployer
 *
 * @param {number} basicWage             Monthly basic wage (full month)
 * @param {number} payableDays           workedDays + paidLeaveDays
 * @param {number} totalWorkingDaysInMo  Total Mon-Fri days in the month
 * @param {number} [tds=0]               TDS deduction (default 0)
 */
function calculateSalaryComponents(basicWage, payableDays, totalWorkingDaysInMo, tds = 0) {
  const safe = totalWorkingDaysInMo > 0 ? totalWorkingDaysInMo : 22

  const dailyWage         = basicWage / safe
  const scaledBasic       = round(dailyWage * payableDays)
  const hra               = round(scaledBasic * 0.50)
  const standardAllowance = round(scaledBasic * 0.1667)
  const performanceBonus  = round(scaledBasic * 0.0833)
  const lta               = round(scaledBasic * 0.0833)

  // grossAmount target = 2× scaled basic (Basic + HRA + allowances)
  const grossTarget   = round(scaledBasic * 2.0)
  const allocated     = hra + standardAllowance + performanceBonus + lta
  const fixedAllowance = round(Math.max(0, grossTarget - scaledBasic - allocated))
  const grossAmount   = round(scaledBasic + hra + standardAllowance + performanceBonus + lta + fixedAllowance)

  const pfEmployee      = round(grossAmount * 0.06)
  const pfEmployer      = round(grossAmount * 0.06)
  const professionalTax = 200
  const netAmount       = round(grossAmount - pfEmployee - professionalTax - tds)
  const employerCost    = round(grossAmount + pfEmployer)

  return {
    basicSalary: scaledBasic,
    hra,
    standardAllowance,
    performanceBonus,
    lta,
    fixedAllowance,
    grossAmount,
    pfEmployee,
    pfEmployer,
    professionalTax,
    tdsDeduction: tds,
    netAmount,
    employerCost,
  }
}

function round(n) { return Math.round(n * 100) / 100 }

module.exports = { calculateSalaryComponents }
