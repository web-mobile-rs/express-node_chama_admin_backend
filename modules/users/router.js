var express = require('express');
var router = express.Router();
var _user = require('./ctl_users.js');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('User Time: ', Date.now());
  next();
});

router.post('/getAllUsers', _user.getAllUsers);
router.post('/getUsersByStatus', _user.getUsersByStatus);
router.post('/getGroupMembersByStatus', _user.getGroupMembersByStatus);
router.post('/addNewUser', _user.addNewUser);
router.post('/updateUser', _user.updateUser);
router.post('/removeUser', _user.removeUser);
router.post('/removeUsers', _user.removeUsers);
router.post('/loginUser', _user.loginUser);
router.post('/signUpJoiner', _user.signUpJoiner);
router.post('/signUpLeader', _user.signUpLeader);
router.post('/changePassword', _user.changePassword);
router.post('/resetPassword', _user.resetPassword);
router.post('/userProfileSave', _user.userProfileSave);
router.post('/updateUserStatus', _user.updateUserStatus);
router.post('/everydayChecking', _user.everydayChecking);

module.exports = router;