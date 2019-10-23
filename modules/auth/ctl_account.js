var AccountSchema = require('../schemas/account_schema.js');

module.exports.getAccountByUserId = async function(req, res) {
    try {
        var doc = await AccountSchema.findOne({user_name: req.body.userId});
        res.status(201).json({success: true, doc: doc});
    } catch (error) {
        console.log(error);
        res.status(401).json({success: false, error: error});
    }
}

module.exports.updateAccount = async function(req, res) {
    try {
        var doc = await AccountSchema.update({email: req.body.account.email}, req.body.account);
        res.status(201).json({success: true, doc: doc});
    } catch (error) {
        console.log(error);
        res.status(401).json({success: false, error: error});
    }
}

module.exports.getAllAccounts = async function (req, res) {
    try {
        var doc = await AccountSchema.find({});
        res.status(201).json({success: true, doc: doc});
    } catch (error) {
        console.log(error);
        res.status(401).json({success: false, error: error});
    }
}

module.exports.removeAllAccount = async function(req, res) {
    try {
        var doc = await AccountSchema.find({});
        doc.map(async (account) => {
            await AccountSchema.remove({_id: account._id});
        })
        res.status(201).json({success: true});
    } catch (error) {
        console.log(error);
        res.status(401).json({success: false, error: error});
    }
}

module.exports.removeAccountById = async function(req, res) {
    try {
        var doc = await AccountSchema.find({_id: req.body.userId});
        if (doc != null) {
            await AccountSchema.remove({_id: req.body.userId});
            res.status(201).json({success: true});
        }
        else {
            res.status(201).json({success: false});
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({success: false, error: error});
    }
}
