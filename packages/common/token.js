const crypto = require('crypto');

function generateToken(prefix) {
  const raw = crypto.randomBytes(32).toString('hex');
  return `${prefix}${raw}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function compareToken(plain, hash) {
  const plainHash = hashToken(plain);
  try {
    return crypto.timingSafeEqual(Buffer.from(plainHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

module.exports = { generateToken, hashToken, compareToken };
