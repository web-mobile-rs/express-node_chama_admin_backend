var transactionSchema = require('../schemas/data_transactions_schema.js');
var userSchema = require('../schemas/data_users_schema.js');
var groupSchema = require('../schemas/data_groups_schema.js');
var pendingSchema = require('../schemas/data_pendings_schema.js');
var roundSchema = require('../schemas/data_merry_go_rounds_schema.js');
var axios = require('axios');
var moment = require('moment');
var bcrypt = require('bcryptjs');
const timestamp = require('time-stamp');

const infobip_from = "CHAMAPLUS";
const infobip_username = "ChamaFinance";
const infobip_password = "AbeboBig2018@";

const shortCodeC2B = '666736';
const mpesaSDK = require('mpesa-node-sdk');
const passkey = '22b55edc9a754f330c7913a7d235903c1f5980af4c36a1bda59a8acc1c20829d';

module.exports.getAllContributions = async function(req, res) {
    try {
        var groups = await transactionSchema.find({ type: 'contribute' });
        var total = 0;
        groups.forEach(function(group, index) {
            total += group.amount;
        });
        res.status(200).json({ success: true, doc: total });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}
module.exports.getAllTransactions = async function(req, res) {
    try {
        var doc = await transactionSchema.find({}, {}, { sort: { created_at: -1 } });
        var users = await userSchema.find({});
        var groups = await groupSchema.find({});
        var resT = [];
        doc.map((cursor) => {
            var userInfo = null;
            users.map((user) => {
                if (user.phone == cursor.phone && user.chama_code == cursor.chama_code) {
                    userInfo = user;
                }
            })
            groups.map((group) => {
                if (group.phone == cursor.phone && group.chama_code == cursor.chama_code) {
                    userInfo = group;
                }
            })
            if (userInfo !== null) {
                resT.push({
                    user_name: userInfo.user_name,
                    phone: cursor.phone,
                    chama_code: userInfo.chama_code,
                    amount: cursor.amount,
                    currency: cursor.currency,
                    type: cursor.type,
                    created_at: cursor.created_at
                })
            }
        })
        res.status(201).json({ success: true, doc: resT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.getTransactionsByUserId = async function(req, res) {
    try {
        var user = await userSchema.findOne({ _id: req.body.user_id });
        var doc = await transactionSchema.find({ phone: user.phone, chama_code: user.chama_code }, {}, { sort: { created_at: -1 } });
        doc.map((cursor) => {
            resT.push({
                user_id: cursor.user_id,
                user_name: user.user_name,
                phone: user.phone,
                chama_code: user.chama_code,
                amount: cursor.amount,
                currency: cursor.currency,
                type: cursor.type,
            })
        })
        res.status(201).json({ success: true, doc: resT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.getTransactionsByPhone = async function(req, res) {
    try {
        var doc = await transactionSchema.find({ phone: req.body.phone, chama_code: req.body.chama_code }, {}, { sort: { created_at: -1 } });
        var user = await userSchema.findOne({ phone: req.body.phone, chama_code: req.body.chama_code });
        if (user == null) {
            var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
            user = {
                user_name: group.user_name,
                avatar: group.avatar,
                phone: group.phone,
                chama_code: group.chama_code,
                role: 'Chairperson'
            };
        }
        var resT = [];
        doc.map((cursor) => {
            resT.push({
                user_name: user.user_name,
                avatar: user.avatar,
                role: user.role,
                phone: user.phone,
                chama_code: user.chama_code,
                amount: cursor.amount,
                currency: cursor.currency,
                type: cursor.type,
                created_at: cursor.created_at
            })
        })

        res.status(201).json({ success: true, doc: resT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.getProfileByGroup = async function(req, res) {
    try {
        var doc = await transactionSchema.find({ chama_code: req.body.chama_code }, {}, { sort: { created_at: -1 } });
        var users = await userSchema.find({ chama_code: req.body.chama_code });
        var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
        var resT = [];
        users.push({
            user_name: group.user_name,
            chama_code: group.chama_code,
            account_status: 'Active',
            role: 'Chairperson',
            phone: group.phone,
            avatar: group.avatar
        });
        doc.map((cursor) => {
            var userInfo = null;
            users.map((user) => {
                if (cursor.phone === user.phone) {
                    userInfo = user;
                }
            })
            if (userInfo !== null) {
                resT.push({
                    user_id: cursor.user_id,
                    user_name: userInfo.user_name,
                    role: userInfo.role,
                    avatar: userInfo.avatar,
                    phone: userInfo.phone,
                    chama_code: userInfo.chama_code,
                    amount: cursor.amount,
                    currency: cursor.currency,
                    type: cursor.type,
                    created_at: cursor.created_at,
                });
            }
        })
        res.status(201).json({ success: true, doc: resT, members: users });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.addNewTransaction = async function(req, res) {
    // try {
    //     var transaction = req.body.transaction;
    //     var doc = await transactionSchema.create(transaction);
    //     res.status(201).json({ success: true, doc: doc });
    // } catch (error) {
    //     console.log(error);
    //     res.status(401).json({ success: false, error: error });
    // }
    try {
        await transactionSchema.create({
            phone: req.body.phone,
            chama_code: req.body.chama_code,
            amount: req.body.amount,
            type: req.body.type,
            duration: req.body.duration
        });
        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}
module.exports.getOutstandingTransactions = async function(req, res) {
    var doc = await transactionSchema.find({ $or: [{ type: 'emergency_fund' }, { type: '3x_my_saving' }], repaid: false });
    outstanding_loan = 0;
    doc.forEach(function(outstanding, index) {
        outstanding_loan += outstanding.amount;
    });
    res.status(200).json({ sucess: true, doc: outstanding_loan });
}

module.exports.getRepaidLoans = async function(req, res) {
    var doc = await transactionSchema.find({ repaid: true });
    repaid = 0;
    doc.forEach(function(repaid, index) {
        repaid += repaid.amount;
    });
    res.status(200).json({ sucess: true, doc: repaid });
}
module.exports.getOutstandingTransactionsByGroup = async function(req, res) {
    try {
        var users = await userSchema.find({ chama_code: req.body.chama_code });
        var doc = await transactionSchema.find({ type: 'borrow', repaid: false, chama_code: req.body.chama_code });
        var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
        var resT = [];

        users.push({
            user_name: group.user_name,
            chama_code: group.chama_code,
            account_status: 'Active',
            role: 'Chairperson',
            phone: group.phone,
            avatar: group.avatar
        });

        doc.map((cursor) => {
            var userInfo = null;
            users.map((user) => {
                if (user.phone == cursor.phone) {
                    userInfo = user;
                }
            })
            if (userInfo != null) {
                resT.push({
                    phone: cursor.phone,
                    chama_code: cursor.chama_code,
                    user_name: userInfo.user_name,
                    role: userInfo.role,
                    avatar: userInfo.avatar,
                    amount: cursor.amount,
                    currency: cursor.currency,
                    type: cursor.type,
                    end_at: cursor.end_at,
                    created_at: cursor.created_at
                })
            }
        })

        console.log(resT);

        res.status(201).json({ success: true, doc: resT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error })
    }
}

module.exports.getPendingTransactionsByGroup = async function(req, res) {
    try {
        var users = await userSchema.find({ chama_code: req.body.chama_code });
        var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
        var doc = await pendingSchema.find({ chama_code: req.body.chama_code });
        var resT = [];

        users.push({
            user_name: group.user_name,
            chama_code: group.chama_code,
            account_status: 'Active',
            role: 'Chairperson',
            phone: group.phone,
            avatar: group.avatar
        });

        doc.map((cursor) => {
            var userInfo = null;
            users.map((user) => {
                if (user.phone == cursor.phone) {
                    userInfo = user;
                }
            })

            if (userInfo != null) {
                resT.push({
                    id: cursor._id,
                    phone: cursor.phone,
                    chama_code: cursor.chama_code,
                    user_name: userInfo.user_name,
                    role: userInfo.role,
                    avatar: userInfo.avatar,
                    amount: cursor.amount,
                    currency: cursor.currency,
                    type: cursor.type,
                    duration: cursor.duration,
                    chairperson_approved: cursor.chairperson_approved,
                    secretary_approved: cursor.secretary_approved,
                    treasure_approved: cursor.treasure_approved,
                    created_at: cursor.created_at
                })
            }
        })
        res.status(201).json({ success: true, doc: resT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.addNewPendingTransaction = async function(req, res) {
    try {
        await pendingSchema.create({
            phone: req.body.phone,
            chama_code: req.body.chama_code,
            amount: req.body.amount,
            type: req.body.type,
            duration: req.body.duration
        });
        await transactionSchema.create({
            phone: req.body.phone,
            chama_code: req.body.chama_code,
            // chama_code: chama_code,
            amount: req.body.amount,
            type: req.body.type
        });
        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.declinePendingTransaction = async function(req, res) {
    try {
        var doc = await pendingSchema.findOne({ _id: req.body.id });
        if (doc != null) {
            await pendingSchema.remove({ _id: req.body.id });
            res.status(201).json({ success: true });
        } else {
            res.status(201).json({ success: false, message: 'No pending transaction' });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.checkBorrowStatusByGroup = async function(req, res) {
    try {
        var doc = await transactionSchema.findOne({ chama_code: req.body.chama_code, phone: req.body.phone, type: 'borrow', repaid: false });
        var pendingDoc = await pendingSchema.findOne({ chama_code: req.body.chama_code, phone: req.body.phone });
        if (doc == null && pendingDoc == null) {
            var transactions = await transactionSchema.find({ chama_code: req.body.chama_code, type: 'borrow', repaid: false });
            var pendings = await pendingSchema.find({ chama_code: req.body.chama_code });
            var users = await userSchema.find({ chama_code: req.body.chama_code });
            if (transactions.length + pendings.length < (users.length + 1) * 30 / 100) {
                res.status(201).json({ success: true });
            } else {
                res.status(201).json({ success: false, message: 'Borrow is not available for this chama group now.' });
            }
        } else {
            res.status(201).json({ success: false, message: 'You already have borrow transaction.' });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.newContribution = async function(req, res) {
    try {
        //- -----------------m-pesa transaction(C2B)------------------

        let time = timestamp('YYYYMMDDHHMMSS');
        let shortcode = shortCodeC2B;
        let password = Buffer.from(shortcode + passkey + time).toString('base64');
        // var chama_code = req.body.chama_name.substr(0, 2) + Math.random().toString(36).substr(2, 4);

        const request_options = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": time,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": req.body.amount,
            "PartyA": req.body.phone,
            "PartyB": shortcode,
            "PhoneNumber": req.body.phone,
            "CallBackURL": "https://api.chamaplus.com/C2BSuccess/" + req.body.type + "/" + req.body.chama_code,
            "AccountReference": req.body.chama_code,
            "TransactionDesc": "mpesac2b"
        };

        await mpesaSDK.STKPushSimulation(request_options, function(data) {
                console.log(data);
            })
            //-----------------------------------------------------------       
        res.status(201).json({ success: true, message: 'Processing your contribution..... ' });

        // var salt = bcrypt.genSaltSync(10);
        // var hash = bcrypt.hashSync(req.body.password, salt);        
        // console.log(chama_code)
        // let nTransaction = transactionSchema({
        //     phone: req.body.phone,
        //     // chama_code: req.body.chama_code,
        //     chama_code: chama_code,
        //     amount: req.body.amount,
        //     type: req.body.type
        // })
        // nTransaction.save((err) => {
        //         if (err) {
        //             console.log("cannot save data")
        //             console.log(err)
        //         } else {
        //             console.log(nTransaction)
        //             console.log("successfully saved")
        //         }
        //     })
        // await transactionSchema.create({
        //     phone: req.body.phone,
        //     chama_code: req.body.chama_code,
        //     // chama_code: chama_code,
        //     amount: req.body.amount,
        //     type: req.body.type
        // });
        // res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.newPayback = async function(req, res) {
    try {
        //------------------m-pesa transaction(C2B)------------------

        let time = timestamp('YYYYMMDDHHMMSS');
        let shortcode = shortCodeC2B;
        let password = Buffer.from(shortcode + passkey + time).toString('base64');

        const request_options = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": time,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": req.body.amount,
            "PartyA": req.body.phone,
            "PartyB": shortcode,
            "PhoneNumber": req.body.phone,
            "CallBackURL": "https://api.chamaplus.com/C2BSuccess/" + req.body.type + "/" + req.body.chama_code,
            "AccountReference": req.body.chama_code,
            "TransactionDesc": "mpesac2b"
        };

        await mpesaSDK.STKPushSimulation(request_options, function(data) {
            console.log(data);
        })

        //-----------------------------------------------------------
        await transactionSchema.create({
            phone: req.body.phone,
            chama_code: req.body.chama_code,
            // chama_code: chama_code,
            amount: req.body.amount,
            type: req.body.type,
            repaid: "true"
        });
        res.status(201).json({ success: true, message: 'Processing your payback..... ' });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.getMerryGoRounds = async function(req, res) {
    try {
        var rounds = await roundSchema.find({ chama_code: req.body.chama_code, accept_status: 'pending' }, {}, { sort: { created_at: 1 } });
        var acceptRound = await roundSchema.findOne({ chama_code: req.body.chama_code, phone: req.body.phone, accept_status: 'waiting' });
        var users = await userSchema.find({ chama_code: req.body.chama_code });
        var group = await groupSchema.findOne({ chama_code: req.body.chama_code });
        var username = [];
        var resT = [];

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

        users.map((user) => {
            username[user.phone] = user.user_name;
        })
        username[group.phone] = group.user_name;

        rounds.map((round, index) => {
            var duedate = new Date();
            duedate.setDate(group.last_contribution.getDate() + contribution_cycle_days * (index + 1));

            resT.push({
                user_name: username[round.phone],
                amount: group.contribution * group.merry_go_round / 100,
                currency: round.currency,
                duedate: duedate
            })
        })

        res.status(201).json({ success: true, doc: resT, waiting: (acceptRound != null ? acceptRound.amount : 0) })
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.C2BSuccess = async function(req, res) {
    try {
        console.log(req.body);
        var chama_code = req.body.chama_code;
        var amount = req.body.amount;
        var type = req.body.type;
        var text = "";

        var user = await userSchema.findOne({ phone: req.body.phone, chama_code: chama_code });
        var group = await groupSchema.findOne({ chama_code: chama_code });
        var user_name = "";
        if (user != null) user_name = user.user_name;
        else user_name = group.user_name;

        await transactionSchema.create({
            phone: req.body.phone,
            chama_code: chama_code,
            amount: amount,
            type: type
        });

        if (type == 'contribute') {
            text = "Dear " + user_name + ", thank you for your contribution of " + amount + " KES to '" + group.chama_name + "' Chama Group at " + moment().format('YYYY-MM-DD');
            if (user != null) {
                user.contribution_status = true;
                await userSchema.update({ phone: req.body.phone, chama_code: chama_code }, user);
            } else {
                group.contribution_status = true;
                await groupSchema.update({ chama_code: chama_code }, group);
            }
        } else {
            text = "Dear " + user_name + ", thank you for your repayment of " + amount + " KES to '" + group.chama_name + "' Chama Group at " + moment().format('YYYY-MM-DD');
            var borrow = await transactionSchema.findOne({ phone: req.body.phone, chama_code: chama_code, type: 'borrow', repaid: false });
            borrow.repaid = true;
            await transactionSchema.update({ phone: req.body.phone, chama_code: req.body.chama_code, type: 'borrow', repaid: false }, borrow);
        }

        await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
            "from": infobip_from,
            "to": req.body.phone,
            "text": text
        }, {
            headers: {
                Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        })

        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}

module.exports.B2CSuccess = async function(req, res) {
    try {
        console.log(req.body);
        var chama_code = req.body.chama_code;
        var type = req.body.type;
        var text = "";
        var user = await userSchema.findOne({ phone: req.body.phone, chama_code: chama_code });
        if (user == null) {
            user = await groupSchema.findOne({ phone: req.body.phone, chama_code: chama_code });
        }

        if (type == 'borrow') {
            var amount = req.body.amount;
            var end_at = req.body.end_at;
            await transactionSchema.create({
                phone: req.body.phone,
                chama_code: chama_code,
                type: 'borrow',
                amount: amount,
                end_at: end_at
            });

            text = "Dear " + user.user_name + ", you borrowed " + amount + " KES from Chama Plus. You should pay back until " + moment(end_at).format('YYYY-MM-DD');
        } else if (type == 'merry') {
            text = "Dear " + user.user_name + ", You received " + round.amount + " KES from Chama Plus with Merry-Go-Round.";

            var round = await roundSchema.findOne({ chama_code: chama_code, phone: req.body.phone, accept_status: 'waiting' });
            if (round != null) {
                round.accept_status = req.body.accept_status;
                await roundSchema.update({ chama_code: req.body.chama_code, phone: req.body.phone, accept_status: 'waiting' }, round);
            }
        }

        await axios.post('https://224ll.api.infobip.com/sms/2/text/single', {
            "from": infobip_from,
            "to": req.body.phone,
            "text": text
        }, {
            headers: {
                Authorization: "Basic " + Buffer.from(infobip_username + ":" + infobip_password).toString('base64'),
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        })

        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, error: error });
    }
}