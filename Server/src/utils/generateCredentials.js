// utils/generateCredentials.js
// Handles auto-generation of Login IDs and strong passwords for new employees

const { prisma } = require('../config/prisma');

// ─── generateLoginId ──────────────────────────────────────────────────────────
// Format: [CompanyPrefix2][FirstName2][LastName2][Year][SerialNo4digits]
// Example: OIJODO20220001
//   OI   → First 2 letters of "Odoo India"
//   JO   → First 2 letters of first name "John"
//   DO   → First 2 letters of last name "Doe"
//   2022 → Year of joining
//   0001 → Serial number (how many people joined that year + 1)

const generateLoginId = async (companyPrefix, fullName, joiningYear) => {
  // Split the full name to get first and last name initials
  const nameParts = fullName.trim().toUpperCase().split(' ');
  const firstName = nameParts[0] || 'XX';
  const lastName = nameParts[1] || nameParts[0] || 'XX'; // fallback if single name

  const firstNameCode = firstName.substring(0, 2);  // e.g. "JO" from "JOHN"
  const lastNameCode = lastName.substring(0, 2);    // e.g. "DO" from "DOE"

  // Count how many users already joined in this year to get the serial number
  const startOfYear = new Date(`${joiningYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${joiningYear}-12-31T23:59:59.999Z`);

  const countThisYear = await prisma.user.count({
    where: {
      joiningDate: { gte: startOfYear, lte: endOfYear },
    },
  });

  // Serial is count + 1, padded to 4 digits (e.g. 1 → "0001")
  const serial = String(countThisYear + 1).padStart(4, '0');

  return `${companyPrefix}${firstNameCode}${lastNameCode}${joiningYear}${serial}`;
};

// ─── generatePassword ─────────────────────────────────────────────────────────
// Generates a strong 12-character random password
// Includes: uppercase, lowercase, numbers, special characters

const generatePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$!%*?&';
  const all = uppercase + lowercase + numbers + special;

  // Guarantee at least one of each type
  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
    // Fill remaining 8 characters from all character sets
    ...Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]),
  ];

  // Shuffle so guaranteed chars aren't always at the start
  return password.sort(() => Math.random() - 0.5).join('');
};

module.exports = { generateLoginId, generatePassword };
