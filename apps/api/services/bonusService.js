const pool = require('../db');
const userWalletService = require('./userWalletService');

/**
 * Attempt to claim a bonus. Returns { granted, tx, reason }.
 * - Checks cooldown + max_claims
 * - Idempotency via bonus_claims + idempotency_key
 */
async function claimBonus(userId, policyCode) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Load policy
    const { rows: [policy] } = await client.query(
      `SELECT bp.*, c.code AS currency_code
       FROM bonus_policies bp
       JOIN currencies c ON c.id = bp.currency_id
       WHERE bp.code = $1 AND bp.is_active = true`,
      [policyCode]
    );
    if (!policy) {
      await client.query('COMMIT');
      return { granted: false, reason: 'policy_not_found' };
    }

    // Check max_claims
    if (policy.max_claims !== null) {
      const { rows: [{ count }] } = await client.query(
        'SELECT COUNT(*)::int AS count FROM bonus_claims WHERE user_id = $1 AND policy_id = $2',
        [userId, policy.id]
      );
      if (count >= policy.max_claims) {
        await client.query('COMMIT');
        return { granted: false, reason: 'max_claims_reached' };
      }
    }

    // Check cooldown (midnight reset for daily, elapsed for others)
    if (policy.cooldown_seconds !== null) {
      const { rows: [last] } = await client.query(
        `SELECT claimed_at FROM bonus_claims
         WHERE user_id = $1 AND policy_id = $2
         ORDER BY claimed_at DESC LIMIT 1`,
        [userId, policy.id]
      );
      if (last) {
        const claimedAt = new Date(last.claimed_at);
        if (policy.cooldown_seconds === 86400) {
          // Daily bonus: midnight reset (KST = UTC+9)
          const nowKST = new Date(Date.now() + 9 * 3600000);
          const claimedKST = new Date(claimedAt.getTime() + 9 * 3600000);
          const todayKST = nowKST.toISOString().slice(0, 10);
          const claimedDateKST = claimedKST.toISOString().slice(0, 10);
          if (todayKST === claimedDateKST) {
            const tomorrow = new Date(nowKST);
            tomorrow.setUTCHours(0, 0, 0, 0);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            const nextAvailable = new Date(tomorrow.getTime() - 9 * 3600000);
            await client.query('COMMIT');
            return { granted: false, reason: 'cooldown_active', next_available_at: nextAvailable };
          }
        } else {
          const elapsed = (Date.now() - claimedAt.getTime()) / 1000;
          if (elapsed < policy.cooldown_seconds) {
            await client.query('COMMIT');
            return { granted: false, reason: 'cooldown_active', next_available_at: new Date(claimedAt.getTime() + policy.cooldown_seconds * 1000) };
          }
        }
      }
    }

    await client.query('COMMIT');

    // Credit via userWalletService (has its own transaction)
    const idempotencyKey = `bonus_${policyCode}_${userId}_${Date.now()}`;
    const tx = await userWalletService.credit({
      userId,
      currencyCode: policy.currency_code,
      amount: policy.amount,
      reference: `bonus:${policyCode}`,
      memo: policy.description,
      idempotencyKey,
      metadata: { bonus_policy: policyCode }
    });

    // Record claim
    await pool.query(
      'INSERT INTO bonus_claims (user_id, policy_id, transaction_id) VALUES ($1, $2, $3)',
      [userId, policy.id, tx.id]
    );

    return { granted: true, tx, amount: policy.amount, currency: policy.currency_code };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Fire-and-forget signup bonus */
async function grantSignupBonus(userId) {
  try {
    return await claimBonus(userId, 'signup');
  } catch (err) {
    console.error('Signup bonus failed (non-fatal):', err.message);
    return { granted: false, reason: 'error' };
  }
}

/** Check and grant daily visit bonus */
async function checkDailyVisitBonus(userId) {
  try {
    return await claimBonus(userId, 'daily_visit');
  } catch (err) {
    console.error('Daily visit bonus failed (non-fatal):', err.message);
    return { granted: false, reason: 'error' };
  }
}

module.exports = { claimBonus, grantSignupBonus, checkDailyVisitBonus };
