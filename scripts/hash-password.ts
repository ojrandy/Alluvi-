/**
 * Print a bcrypt hash (cost 12) for ADMIN_PASSWORD_HASH.
 *   npm run hash-password -- "your-strong-password"
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "<password of at least 12 characters>"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));
