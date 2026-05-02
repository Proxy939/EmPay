// src/utils/amountInWords.js
// Converts a number to Indian currency words
// e.g. 43800 → "Forty Three Thousand Eight Hundred Rupees Only"

const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
               'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
               'Seventeen','Eighteen','Nineteen']
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']

function twoDigits(n) {
  if (n < 20) return ones[n]
  return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')).trim()
}

function convertGroup(n) {
  if (n === 0) return ''
  if (n < 100) return twoDigits(n)
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '')
}

/**
 * Convert amount to Indian currency words.
 * @param {number} amount
 * @returns {string}
 */
function amountToWords(amount) {
  const n = Math.floor(amount)
  if (n === 0) return 'Zero Rupees Only'

  const crore = Math.floor(n / 10000000)
  const lakh  = Math.floor((n % 10000000) / 100000)
  const thou  = Math.floor((n % 100000) / 1000)
  const rest  = n % 1000

  let words = ''
  if (crore) words += convertGroup(crore) + ' Crore '
  if (lakh)  words += convertGroup(lakh)  + ' Lakh '
  if (thou)  words += convertGroup(thou)  + ' Thousand '
  if (rest)  words += convertGroup(rest)

  return words.trim() + ' Rupees Only'
}

module.exports = { amountToWords }
