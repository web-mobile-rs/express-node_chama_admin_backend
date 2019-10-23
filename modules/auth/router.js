var express = require('express');
var router = express.Router();
var _read = require('./ctl_login.js');
var _register = require('./ctl_register.js');
var _account = require('./ctl_account.js');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Auth Time: ', Date.now());
  next();
});

// Login
router.post('/login', _read.login);

// Register
router.post('/register', _register.register);

router.post('/getAllAccounts', _account.getAllAccounts);
router.post('/getAccountByUserId', _account.getAccountByUserId);
router.post('/updateAccount', _account.updateAccount);
router.post('/removeAllAccount', _account.removeAllAccount);
router.post('/removeAccountById', _account.removeAccountById);

router.get('/access-token/:access_token', _read.access_token);


module.exports = router;