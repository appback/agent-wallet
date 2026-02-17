const crypto = require('crypto');

function generateToken(prefix) {
  const raw = crypto.randomBytes(32).toString('hex');
  return `${prefix}${raw}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAgentToken() {
  return generateToken('aw_agent_');
}

function generateServiceKey() {
  return generateToken('aw_service_');
}

module.exports = { generateAgentToken, generateServiceKey, hashToken };
