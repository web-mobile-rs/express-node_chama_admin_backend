var express = require('express');
var router = express.Router();
var _group = require('./ctl_groups.js');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Group Time: ', Date.now());
  next();
});

router.post('/getAllGroups', _group.getAllGroups);
router.post('/addNewGroup', _group.addNewGroup);
router.post('/updateGroup', _group.updateGroup);
router.post('/updateChamaGroup', _group.updateChamaGroup);
router.post('/removeGroup', _group.removeGroup);
router.post('/removeGroups', _group.removeGroups);

module.exports = router;