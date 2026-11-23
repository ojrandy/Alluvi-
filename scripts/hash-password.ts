/**
 * Print a bcrypt hash (cost 12) for ADMIN_PASSWORD_HASH.
 *   npm run hash-password -- "your-strong-password"
 *
 * Next.js expands `$VAR` in .env files, and also in a real environment variable whose key is listed
 * in any .env file, which silently empties an unescaped bcrypt hash (even in single quotes). The
 * escaped form below (`\$`) survives both and is unescaped by src/server/auth.ts, so use it
 * everywhere: .env files, cPanel "Setup Node.js App" variables and CI secrets.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "<password of at least 12 characters>"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(`\nADMIN_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}\n`);
console.log("Paste this line as-is into .env / cPanel env vars / CI secrets (keep the backslashes).\n");
