const { Router } = require('express');
const auth = require('../../middleware/auth');
const agentAuth = require('../../middleware/agentAuth');
const serviceAuth = require('../../middleware/serviceAuth');
const adminAuth = require('../../middleware/adminAuth');

const authRoutes = require('./auth');
const agentsController = require('../../controllers/v1/agents');
const walletController = require('../../controllers/v1/wallet');
const servicesController = require('../../controllers/v1/services');
const adminController = require('../../controllers/v1/admin');
const leaderboardController = require('../../controllers/v1/leaderboard');

const router = Router();

// Auth
router.use('/auth', authRoutes);

// Public
router.post('/agents/register', agentsController.register);
router.get('/leaderboard', leaderboardController.list);

// Agent-authenticated
router.get('/wallet/balance', agentAuth, walletController.balance);
router.get('/wallet/history', agentAuth, walletController.history);
router.post('/wallet/transfer', agentAuth, walletController.transfer);

// Service-authenticated
router.post('/wallet/credit', serviceAuth, walletController.credit);
router.post('/wallet/debit', serviceAuth, walletController.debit);

// Admin
router.post('/services', auth, adminAuth, servicesController.create);
router.get('/services', auth, adminAuth, servicesController.list);
router.get('/admin/stats', auth, adminAuth, adminController.stats);

module.exports = router;
