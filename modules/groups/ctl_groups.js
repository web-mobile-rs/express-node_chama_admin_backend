var groupSchema = require('../schemas/data_groups_schema.js');
var bcrypt = require('bcryptjs');

module.exports.getAllGroups = async function (req, res) {
  try {
    var doc = await groupSchema.find({});
    res.status(201).json({success: true, doc: doc});
  } catch(err) {
    console.log(err);
    res.status(401).json({success: false, error: err})
  }
}

module.exports.addNewGroup = async function (req, res) {
  try {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.group.password, salt);
    var chama_code = req.body.group.chama_name.substr(0, 2) + Math.random().toString(36).substr(2, 4);

    var group = {
      chama_name: req.body.group.chama_name,
      user_name: req.body.group.user_name,
      phone: req.body.group.phone,
      password: hash,
      avatar: req.body.group.avatar,
      max_members: req.body.group.max_members,
      contribution: req.body.group.contribution,
      contribution_cycle: req.body.group.contribution_cycle,
      emergency_fund: req.body.group.emergency_fund,
      my_saving: req.body.group.my_saving,
      merry_go_round: req.body.group.merry_go_round,
      chama_code: chama_code
    };

    var doc = await groupSchema.findOne({chama_name: group.chama_name });
    if (doc == null) {
      await groupSchema.create(group);
      res.status(201).json({success: true, doc: doc});
    }
    else
    {
      res.status(201).json({success: false, message: 'Same chama group already exist.'});
    }
  } catch(err) {
    console.log(err);
    res.status(401).json({success: false, error: err})
  }
}

module.exports.updateGroup = async function (req, res) {
  try {
    var group = req.body.group;
    var doc = await groupSchema.update({chama_name: group.chama_name}, group);
    res.status(201).json({success: true, doc: doc});
  } catch (error) {
    console.log(error);
    res.status(401).json({success: false, error: error});
  }
}

module.exports.removeGroup = async function (req, res) {
  try {
    await groupSchema.remove({_id: req.body.groupId});
    res.status(201).json({success: true});
  } catch (error) {
    console.log(error);
    res.status(401).json({success: false, error: error});
  }
}

module.exports.removeGroups = async function (req, res) {
  try {
    var groups = req.body.groupIds;
    groups.map(async (cursor) => {
      await groupSchema.remove({_id: cursor});
    })
    res.status(201).json({success: true});
  } catch (error) {
    console.log(error);
    res.status(401).json({success: false, error: error});
  }
}

module.exports.getGroupById = async function (req, res) {
  try {
    var doc = await groupSchema.findOne({_id: req.body.groupId});
    res.status(201).json({success: true, doc: doc});
  } catch (error) {
    console.log(error);
    res.status(401).json({success: false, error: error});
  }
}

module.exports.updateChamaGroup = async function (req, res) {
  try {
    var doc = await groupSchema.findOne({chama_code: req.body.chama_code});
    doc.chama_name = req.body.chama_name;
    doc.max_members = req.body.max_members;
    doc.contribution = req.body.contribution;
    doc.contribution_cycle = req.body.contribution_cycle;
    doc.emergency_fund = req.body.emergency_fund;
    doc.my_saving = req.body.my_saving;
    doc.merry_go_round = req.body.merry_go_round;
    await groupSchema.update({chama_code: req.body.chama_code}, doc);
    res.status(201).json({success: true, doc: {
      user_name: doc.user_name,
      phone: doc.phone,
      avatar: doc.avatar,
      chama_code: doc.chama_code,
      chama_name: doc.chama_name,
      account_status: doc.account_status,
      role: doc.role,
      max_members: doc.max_members,
      contribution: doc.contribution,
      contribution_cycle: doc.contribution_cycle,
      emergency_fund: doc.emergency_fund,
      my_saving: doc.my_saving,
      merry_go_round: doc.merry_go_round,
      created_at: doc.created_at
    }});
  } catch (error) {
    console.log(error);
    res.status(401).json({success: false, error: error});
  }
}