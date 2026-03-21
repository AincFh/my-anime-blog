import crypto from 'crypto';

function hashPasswordNode(password) {
  const salt = crypto.randomBytes(16);
  const hashBuffer = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const saltHex = salt.toString('hex');
  const hashHex = hashBuffer.toString('hex');
  return `${saltHex}:${hashHex}`;
}

console.log("=== HASH RESULT ===");
console.log("admin123:", hashPasswordNode("admin123"));
console.log("123456:", hashPasswordNode("123456"));
console.log("===================");
