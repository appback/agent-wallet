const pool = require('../../db');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

exports.stats = async (req, res, next) => {
  try {
    const [users, gemIssued, sponsored, expenses] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM user_transactions
                  WHERE type = 'credit' AND currency_id = (SELECT id FROM currencies WHERE code = 'gem')`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM sponsorship_orders WHERE status = 'rewarded'`),
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM platform_expenses')
    ]);

    res.json({
      stats: {
        total_users: parseInt(users.rows[0].count),
        total_gem_issued: Number(gemIssued.rows[0].total),
        total_sponsored: Number(sponsored.rows[0].total),
        total_expenses: Number(expenses.rows[0].total)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.users = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = req.query.search ? `%${req.query.search}%` : null;

    let where = '';
    const params = [];
    if (search) {
      params.push(search);
      where = `WHERE u.email ILIKE $1 OR u.display_name ILIKE $1`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role, u.created_at,
              COALESCE(ub.balance, 0) AS gem_balance
       FROM users u
       LEFT JOIN user_balances ub ON ub.user_id = u.id
         AND ub.currency_id = (SELECT id FROM currencies WHERE code = 'gem')
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    );

    res.json(paginatedResponse(result.rows, total, { page, limit }));
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'player'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or player' });
    }
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, display_name, role',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.sponsorshipOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = req.query.status || null;

    let where = '';
    const params = [];
    if (status) {
      params.push(status);
      where = 'WHERE so.status = $1';
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sponsorship_orders so ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT so.id, so.amount, so.gem_reward, so.status, so.created_at, so.paid_at, so.rewarded_at,
              u.display_name, u.email
       FROM sponsorship_orders so
       JOIN users u ON u.id = so.user_id
       ${where}
       ORDER BY so.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    );

    res.json(paginatedResponse(result.rows, total, { page, limit }));
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM platform_expenses WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.bonusPolicies = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT bp.*, COALESCE(bc.claim_count, 0) AS claim_count
       FROM bonus_policies bp
       LEFT JOIN (SELECT policy_id, COUNT(*) AS claim_count FROM bonus_claims GROUP BY policy_id) bc
         ON bc.policy_id = bp.id
       ORDER BY bp.id`
    );
    res.json({ policies: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.updateBonusPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, cooldown_seconds, is_active } = req.body;

    const fields = [];
    const params = [];
    let idx = 1;

    if (amount !== undefined) {
      fields.push(`amount = $${idx++}`);
      params.push(amount);
    }
    if (cooldown_seconds !== undefined) {
      fields.push(`cooldown_seconds = $${idx++}`);
      params.push(cooldown_seconds);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      params.push(is_active);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE bonus_policies SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json({ policy: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
