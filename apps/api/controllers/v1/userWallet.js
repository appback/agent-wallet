const userWalletService = require('../../services/userWalletService');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

exports.balances = async (req, res, next) => {
  try {
    const balances = await userWalletService.getBalances(req.user.userId);
    res.json({ balances });
  } catch (err) {
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const currencyCode = req.query.currency || null;

    const { data, total } = await userWalletService.getHistory(
      req.user.userId,
      { currencyCode, page, limit, offset }
    );

    res.json(paginatedResponse(data, total, { page, limit }));
  } catch (err) {
    next(err);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { currency_code, amount, reference, memo } = req.body;
    if (!currency_code || !amount || amount <= 0) {
      return res.status(400).json({ error: 'currency_code and positive amount required' });
    }

    const transaction = await userWalletService.debit({
      userId: req.user.userId,
      currencyCode: currency_code,
      amount,
      reference: reference || 'user_withdraw',
      memo: memo || null
    });

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
};
