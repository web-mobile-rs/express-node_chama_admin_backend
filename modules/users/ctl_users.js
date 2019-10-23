var userSchema = require('../schemas/data_users_schema.js');
var groupSchema = require('../schemas/data_groups_schema.js');
var accountSchema = require('../schemas/account_schema.js');
var transactionSchema = require('../schemas/data_transactions_schema.js');
var roundSchema = require('../schemas/data_merry_go_rounds_schema.js');
var bcrypt = require('bcryptjs');

var axios = require('axios');

const infobip_from = "CHAMAPLUS";
const infobip_username = "ChamaFinance";
const infobip_password = "AbeboBig2018@";

module.exports.getAllUsers = async function(req, res) {
    try {
        var doc = await userSchema.find({});
        res.status(201).json({ success: true, doc: doc });
    } catch (err) {
        console.log(err);
        res.status(401).json({ success: false, error: err });
    }
}

module.exports.getUsersByStatus = async function(req, res) {
    try {
        var account_status = req.body.account_status;
        var doc;
        if (account_status == 'All') {
            doc = await userSchema.find({});
        } else {
            doc = await userSchema.find({ account_status });
        }
        res.status(201).json({ success: true, doc: doc });
    } catch (err) {
        console.log(err);
        res.status(401).json({ success: false, error: err });
    }
}

module.exports.getGroupMembersByStatus = async function(req, res) {
    try {
        var doc;
        if (req.body.account_status == 'All') {
            doc = await userSchema.find({ chama_code: req.body.chama_code });
        } else {
            doc = await userSchema.find({ chama_code: req.body.chama_code, account_status: req.body.account_status });
        }

        res.status(201).json({ success: true, doc: doc });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.addNewUser = async function(req, res) {
    try {
        var user = req.body.user;
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(user.password, salt);
        user.password = hash;

        var doc = await userSchema.findOne({ phone: user.phone });
        if (doc == null) {
            await userSchema.create(user);
            res.status(201).json({ success: true, doc: doc });
        } else {
            res.status(201).json({ success: false, message: 'Same user already exist.' });
        }
    } catch (err) {
        console.log(err);
        res.status(401).json({ success: false, error: err })
    }
}

module.exports.updateUser = async function(req, res) {
    try {
        var user = req.body.user;
        var doc = await userSchema.update({ phone: user.phone }, user);
        res.status(201).json({ success: true, doc: doc });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.removeUser = async function(req, res) {
    try {
        await userSchema.remove({ _id: req.body.userId });
        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.removeUsers = async function(req, res) {
    try {
        var userIds = req.body.userIds;
        userIds.map(async(cursor) => {
            await userSchema.remove({ _id: cursor });
        })
        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.loginUser = async function(req, res) {
    try {
        var account = await accountSchema.findOne({});
        var group = await groupSchema.findOne({ chama_name: req.body.chama_name });
        if (group == null) {
            res.status(201).json({ success: false, message: 'Chama Name is wrong!' });
        } else {
            var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: group.chama_code });

            if (doc != null) {
                if (!bcrypt.compareSync(req.body.password, doc.password)) {
                    res.status(201).json({ success: false, message: 'Password is wrong!' });
                } else {
                    var group = await groupSchema.findOne({ chama_code: doc.chama_code });
                    var data = {
                        user_name: doc.user_name,
                        phone: doc.phone,
                        avatar: doc.avatar,
                        chama_code: doc.chama_code,
                        chama_name: group.chama_name,
                        account_status: doc.account_status,
                        role: doc.role,
                        max_members: group.max_members,
                        contribution_status: doc.contribution_status,
                        contribution: group.contribution,
                        contribution_cycle: group.contribution_cycle,
                        emergency_fund: group.emergency_fund,
                        my_saving: group.my_saving,
                        merry_go_round: group.merry_go_round
                    };
                    var transactions = await transactionSchema.find({ phone: req.body.phone, chama_code: doc.chama_code });
                    res.status(201).json({ success: true, doc: data, interest_rate: account.interest_rate, transaction_fee: account.transaction_fee, transactions: transactions });
                }
            } else {
                doc = await groupSchema.findOne({ phone: req.body.phone, chama_name: req.body.chama_name });
                if (doc != null) {
                    if (!bcrypt.compareSync(req.body.password, doc.password)) {
                        res.status(201).json({ success: false, message: 'Password is wrong!' });
                    } else {
                        var data = {
                            user_name: doc.user_name,
                            phone: doc.phone,
                            avatar: doc.avatar,
                            chama_code: doc.chama_code,
                            chama_name: doc.chama_name,
                            account_status: 'Active',
                            role: 'Chairperson',
                            max_members: doc.max_members,
                            contribution_status: doc.contribution_status,
                            contribution: doc.contribution,
                            contribution_cycle: doc.contribution_cycle,
                            emergency_fund: doc.emergency_fund,
                            my_saving: doc.my_saving,
                            merry_go_round: doc.merry_go_round,
                        };
                        var transactions = await transactionSchema.find({ phone: req.body.phone, chama_code: doc.chama_code });
                        res.status(201).json({ success: true, doc: data, interest_rate: account.interest_rate, transaction_fee: account.transaction_fee, transactions: transactions });
                    }
                } else {
                    res.status(201).json({ success: false, message: 'Phone Number is wrong.' });
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.signUpJoiner = async function(req, res) {
    try {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);

        var user = {
            phone: req.body.phone,
            password: hash,
            user_name: req.body.user_name,
            chama_code: req.body.chama_code,
            account_status: 'Active',
            role: 'Member'
        }

        var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
        var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
        if (doc == null) {
            if (group == null) {
                res.status(201).json({ success: false, message: 'Chama code is wrong.' });
            } else {
                await userSchema.create(user);

                // merry-go-round
                await roundSchema.create({
                    phone: user.phone,
                    chama_code: user.chama_code,
                    amount: group.contribution * group.merry_go_round / 100,
                });

                res.status(201).json({
                    success: true,
                    doc: {
                        user_name: user.user_name,
                        phone: user.phone,
                        avatar: '',
                        chama_code: user.chama_code,
                        chama_name: group.chama_name,
                        account_status: user.account_status,
                        role: user.role,
                        max_members: group.max_members,
                        contribution: group.contribution,
                        contribution_cycle: group.contribution_cycle,
                        emergency_fund: group.emergency_fund,
                        my_saving: group.my_saving,
                        merry_go_round: group.merry_go_round
                    }
                });
            }
        } else {
            res.status(201).json({ success: false, message: 'Phone number already exist.' })
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.signUpLeader = async function(req, res) {
    try {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        var chama_code = req.body.chama_name.substr(0, 2) + Math.random().toString(36).substr(2, 4);

        var group = {
            chama_name: req.body.chama_name,
            user_name: req.body.user_name,
            phone: req.body.phone,
            password: hash,
            chama_code: chama_code,
            max_members: 15,
            contribution: 200,
            contribution_cycle: '1 week',
            emergency_fund: 10,
            my_saving: 70,
            merry_go_round: 20,
            account_status: 'Active'
        }

        var doc = await groupSchema.findOne({ chama_name: req.body.chama_name });
        if (doc == null) {
            await groupSchema.create(group);

            // merry-go-round
            await roundSchema.create({
                phone: group.phone,
                chama_code: group.chama_code,
                amount: group.contribution * group.merry_go_round / 100,
            });


            res.status(201).json({
                success: true,
                doc: {
                    user_name: group.user_name,
                    phone: group.phone,
                    avatar: '',
                    chama_code: group.chama_code,
                    chama_name: group.chama_name,
                    account_status: group.account_status,
                    role: "Chairperson",
                    max_members: group.max_members,
                    contribution: group.contribution,
                    contribution_cycle: group.contribution_cycle,
                    emergency_fund: group.emergency_fund,
                    my_saving: group.my_saving,
                    merry_go_round: group.merry_go_round
                }
            });
        } else {
            res.status(201).json({ success: false, message: 'Chama Name is already exist.' });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.changePassword = async function(req, res) {
    try {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.new_password, salt);

        if (req.body.role == 'Chairperson') {
            var doc = await groupSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
            if (doc != null && bcrypt.compareSync(req.body.cur_password, doc.password)) {
                doc.password = hash;
                await groupSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code }, doc);

                await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
                    "from": infobip_from,
                    "to": req.body.phone,
                    "text": "Your password changed. New password is '" + req.body.new_password + "'"
                }, {
                    headers: {
                        Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                })

                res.status(201).json({ success: true, message: 'Password successfully changed' });
            } else {
                res.status(201).json({ success: false, message: "Current Password doesn't match" });
            }
        } else {
            var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
            if (doc != null && bcrypt.compareSync(req.body.cur_password, doc.password)) {
                doc.password = hash;
                await userSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code }, doc);

                await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
                    "from": infobip_from,
                    "to": req.body.phone,
                    "text": "Your password changed. New password is '" + req.body.new_password + "'"
                }, {
                    headers: {
                        Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                })

                res.status(201).json({ success: true, message: 'Password successfully changed' });
            } else {
                res.status(201).json({ success: false, message: "Current Password doesn't match" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.resetPassword = async function(req, res) {
    try {
        var new_password = Math.random().toString(36).substr(2, 6);
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(new_password, salt);

        var group = await groupSchema.findOne({ chama_name: req.body.chama_name });

        if (group == null) {
            res.status(201).json({ success: false, message: 'Chama Name is wrong.' });
        } else {
            if (req.body.phone == group.phone) {
                group.password = hash;
                await groupSchema.update({ phone: req.body.phone, chama_code: group.chama_code }, group);

                await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
                    "from": infobip_from,
                    "to": req.body.phone,
                    "text": "Your password changed. New password is '" + new_password + "'"
                }, {
                    headers: {
                        Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                })

                res.status(201).json({ success: true, message: 'Password successfully changed' });
            } else {
                var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: group.chama_code });
                if (doc != null) {
                    doc.password = hash;
                    await userSchema.update({ phone: req.body.phone, chama_code: group.chama_code }, doc);

                    await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
                        "from": infobip_from,
                        "to": req.body.phone,
                        "text": "Your password changed. New password is '" + new_password + "'"
                    }, {
                        headers: {
                            Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                    })

                    res.status(201).json({ success: true, message: 'Password successfully changed' });
                } else {
                    res.status(201).json({ success: false, message: "Phone number is wrong." });
                }
            }
        }

    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.userProfileSave = async function(req, res) {
    try {
        if (req.body.role == 'Chairperson') {
            var doc = await groupSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
            if (doc != null) {
                doc.user_name = req.body.user_name;
                doc.avatar = req.body.avatar;
                await groupSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code }, doc);
                res.status(201).json({ success: true, doc: doc });
            } else {
                res.status(201).json({ success: false, message: 'Phone number is wrong.' });
            }
        } else {
            var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
            if (doc != null) {
                doc.user_name = req.body.user_name;
                doc.avatar = req.body.avatar;
                await userSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code }, doc);
                res.status(201).json({ success: true, doc: doc });
            } else {
                res.status(201).json({ success: false, message: 'Phone number is wrong.' });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.updateUserStatus = async function(req, res) {
    try {
        var doc = await userSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
        doc.role = req.body.role;
        doc.account_status = req.body.account_status;
        if (doc.account_status == 'Remove') {
            await userSchema.remove({ phone: req.body.phone, chama_code: req.body.chama_code });
            res.status(201).json({ success: true, message: 'Successfully removed.' })
        } else {
            await userSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code }, doc);
            res.status(201).json({ success: true, message: 'Succesfully changed user status.' })
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error })
    }
}

module.exports.everydayChecking = async function(req, res) {
    try {
        var groups = await groupSchema.find({});
        var users = await userSchema.find({});

        groups.map(async(group) => {
            var contribution_cycle_days = 7;
            switch (group.contribution_cycle) {
                case '1 week':
                    contribution_cycle_days = 7;
                    break;
                case '2 weeks':
                    contribution_cycle_days = 14;
                    break;
                case '3 weeks':
                    contribution_cycle_days = 21;
                    break;
                case 'Monthly':
                    contribution_cycle_days = 30;
                    break;
                default:
                    break;
            }

            var oneDay = 24 * 60 * 60 * 1000;
            var curDay = new Date();
            var diffDays = Math.round(Math.abs((curDay.getTime() - group.last_contribution.getTime()) / oneDay));
            if (diffDays == contribution_cycle_days) {
                var contributed_members = 0;

                // Contribution Update

                var tmp = group;
                tmp.last_contribution = Date.now();
                if (group.contribution_status == false) {
                    tmp.account_status = "Suspend";
                    await groupSchema.update({ chama_code: group.chama_code }, tmp);
                } else {
                    tmp.contribution_status = false;
                    contributed_members++;
                    await groupSchema.update({ chama_code: group.chama_code }, tmp);
                }
                users.map(async(user) => {
                    if (user.chama_code == group.chama_code) {
                        if (user.contribution_status == false) {
                            //suspend member
                            var tmp = user;
                            tmp.account_status = "Suspend";
                            await userSchema.update({ phone: user.phone, chama_code: user.chama_code }, tmp);
                        } else {
                            //contibution status clear
                            var tmp = user;
                            contributed_members++;
                            tmp.contribution_status = false;
                            await userSchema.update({ phone: user.phone, chama_code: user.chama_code }, tmp);
                        }
                    }
                })

                // merry-go-round update

                var waitingRounds = await roundSchema.findOne({ chama_code: group.chama_code, accept_status: 'waiting' });
                if (waitingRounds != null) {
                    await roundSchema.remove({ _id: waitingRounds._id });
                    await roundSchema.create({
                        phone: waitingRounds.phone,
                        chama_code: waitingRounds.chama_code,
                        amount: group.contribution * group.merry_go_round / 100,
                    })
                }

                var acceptRounds = await roundSchema.findOne({ chama_code: group.chama_code, accept_status: 'accept' });
                if (acceptRounds != null) {
                    await roundSchema.remove({ _id: acceptRounds._id });
                    await roundSchema.create({
                        phone: acceptRounds.phone,
                        chama_code: acceptRounds.chama_code,
                        amount: group.contribution * group.merry_go_round / 100,
                    })
                }

                var declineRounds = await roundSchema.findOne({ chama_code: group.chama_code, accept_status: 'decline' });
                if (declineRounds != null) {
                    await roundSchema.remove({ _id: declineRounds._id });
                    await roundSchema.create({
                        phone: declineRounds.phone,
                        chama_code: declineRounds.chama_code,
                        amount: group.contribution * group.merry_go_round / 100,
                    })
                }

                var pendingRounds = await roundSchema.find({ chama_code: group.chama_code, accept_status: 'pending' }, {}, { sort: { created_at: 1 } });

                if (pendingRounds.length > 0) {
                    var pending = pendingRounds[0];
                    pending.accept_status = 'waiting';
                    pending.amount = group.contribution * group.merry_go_round / 100 * contributed_members;
                    await roundSchema.update({ _id: pending._id }, pending);
                }
            }
        })

        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}