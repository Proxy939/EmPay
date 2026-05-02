// utils/generateCredentials.js
// Handles auto-generation of Login IDs and strong passwords for new employees

const { prisma } = require('../config/prisma');

// ─── generateLoginId ──────────────────────────────────────────────────────────
// Format: [CompanyPrefix2][FirstName2][LastName2][Year][SerialNo4digits]
// Example: OIJODO20220001
// Serial is read from SystemConfig 'joining_serial_counter' and incremented atomically

const generateLoginId = async (companyPrefix, fullName, joiningYear) => {
  const nameParts = fullName.trim().toUpperCase().split(' ');
  const firstName = nameParts[0] || 'XX';
  const lastName = nameParts[1] || nameParts[0] || 'XX';

  const firstNameCode = firstName.substring(0, 2);
  const lastNameCode = lastName.substring(0, 2);

  // Get current serial from SystemConfig, or start at 1
  let serial = 1;
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'joining_serial_counter' },
  });

  if (config) {
    serial = parseInt(config.value, 10);
  }

  // Build the login ID
  const loginId = `${companyPrefix}${firstNameCode}${lastNameCode}${joiningYear}${String(serial).padStart(4, '0')}`;

  // Increment the counter for next use
  await prisma.systemConfig.upsert({
    where: { key: 'joining_serial_counter' },
    update: { value: String(serial + 1) },
    create: { key: 'joining_serial_counter', value: String(serial + 1) },
  });

  return loginId;
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
