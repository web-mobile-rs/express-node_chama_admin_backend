var express = require('express');
var router = express.Router();
var _transaction = require('./ctl_transactions.js');

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Transaction Time: ', Date.now());
    next();
});

router.post('/getAllTransactions', _transaction.getAllTransactions);
router.post('/getTransactionsByUserId', _transaction.getTransactionsByUserId);
router.post('/getTransactionsByPhone', _transaction.getTransactionsByPhone);
// router.post('/getTransactionsByGroup', _transaction.getTransactionsByGroup);
router.post('/getProfileByGroup', _transaction.getProfileByGroup);
router.post('/addNewTransaction', _transaction.addNewTransaction);
router.post('/getOutstandingTransactionsByGroup', _transaction.getOutstandingTransactionsByGroup);
router.post('/getPendingTransactionsByGroup', _transaction.getPendingTransactionsByGroup);
router.post('/addNewPendingTransaction', _transaction.addNewPendingTransaction);
// router.post('/approvePendingTransaction', _transaction.approvePendingTransaction);
router.post('/declinePendingTransaction', _transaction.declinePendingTransaction);
router.post('/checkBorrowStatusByGroup', _transaction.checkBorrowStatusByGroup);
router.post('/newContribution', _transaction.newContribution);
router.post('/newPayback', _transaction.newPayback);
router.post('/getMerryGoRounds', _transaction.getMerryGoRounds);
// router.post('/updateMerryGoRound', _transaction.updateMerryGoRound);
router.post('/C2BSuccess', _transaction.C2BSuccess);
router.post('/B2CSuccess', _transaction.C2BSuccess);
router.post('/getAllContributions', _transaction.getAllContributions);
router.post('/getOutstandingTransactions', _transaction.getOutstandingTransactions);
router.post('/repaid_loan', _transaction.getRepaidLoans);
module.exports = router;