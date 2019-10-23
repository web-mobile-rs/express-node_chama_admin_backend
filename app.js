const express = require('express');
const path = require('path');
var cors = require('cors');
var axios = require('axios');
var schedule = require('node-schedule');

const Auth = require('./modules/auth/router.js');
const User = require('./modules/users/router.js');
const Group = require('./modules/groups/router.js');
const Transaction = require('./modules/transactions/router.js');

require('./config/db_connection.js');
require('./config/passport.js');

var fs = require('fs');
var passport = require('passport');
var bodyParser = require('body-parser');
var multer = require('multer');
const app = express();

app.use(cors())

var cookieParser = require('cookie-parser');


let connections = [];
let onlineUsers = {};


var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = './public/uploads/' + Date.now().toString().slice(0, 3) + '/'
        fs.mkdir(dir, err => {
                cb(null, dir)
            })
            // cb(null, './public/uploads/' + Date.now().toString().slice(0,3) + '/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

var upload = multer({
    storage: storage,
    limits: { fileSize: 100000000 }
}).single('file');

app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

// app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

app.use(cookieParser());

// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json 
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));


app.use('/auth', Auth);
app.use('/users', User);
app.use('/groups', Group);
app.use('/transactions', Transaction);


app.post('/C2BSuccess/:type/:chama_code', function(req, res) {
    console.log(req.body);
    try {
        var resultCode = req.body.Body.stkCallback.ResultCode;
        if (resultCode == 0) {
            var metaData = req.body.Body.stkCallback.CallbackMetadata;
            var phone = null;
            var amount = null;
            metaData.Item && metaData.Item.map((cursor) => {
                if (cursor.Name == "PhoneNumber") {
                    phone = cursor.Value;
                } else if (cursor.Name == "Amount") {
                    amount = cursor.Value;
                }
            })
            if (phone != null) {
                axios.post('https://api.chamaplus.com/transactions/C2BSuccess', { phone: phone, chama_code: req.params.chama_code, amount: amount, type: req.params.type });

                if (onlineUsers[phone] && onlineUsers[phone].online) {
                    var uSocket = onlineUsers[phone].socket;
                    uSocket.emit('c2bsuccess', {
                        amount: amount,
                        phone: phone
                    });
                }

                res.status(201).json({ success: true });
            } else {
                res.status(201).json({ success: false });
            }
        } else {
            res.status(201).json({ success: false });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false });
    }
})

app.post('/B2CTimeout', function(req, res) {
    try {
        console.log(req.body);
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false });
    }
})

app.post('/B2CSuccess/:type/:chama_code/:end_at', function(req, res) {
    try {
        console.log(req.body);
        var resultCode = req.body.ResultCode;
        if (resultCode == 0) {
            var params = req.body.ResultParameters.ResultParameter;
            var amount = null;
            var phone = null;
            params && params.map((cursor) => {
                if (cursor.Key == 'TransactionAmount') {
                    amount = cursor.Value;
                } else if (cursor.Key == 'ReceiverPartyPublicName') {
                    phone = cursor.Value.slice(0, 11);
                    console.log('phone = ', phone);
                }
            })
            if (phone != null && amount != null) {
                axios.post('https://api.chamaplus.com/transactions/B2CSuccess', { phone: phone, chama_code: req.params.chama_code, amount: amount, type: req.params.type, end_at: req.params.end_at });

                if (onlineUsers[phone] && onlineUsers[phone].online) {
                    var uSocket = onlineUsers[phone].socket;
                    uSocket.emit('b2csuccess', {
                        amount: amount,
                        phone: phone
                    });
                }

                res.status(201).json({ success: true });
            } else {
                res.status(201).json({ success: false });
            }
        } else {
            res.status(201).json({ success: false });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false });
    }
})



// FileUpload

app.post('/upload', function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.json({ success: false, message: 'The file size is too big! Max. 10MB' });
            } else if (err.code === 'filetype') {
                res.json({ success: false, message: 'The file does not match the desired file format! (JPG, JPEG, PNG)' });
            } else {
                console.log(err);
                res.json({ success: false, message: 'The upload of the file could not be completed.' });
            }
        } else {
            if (!req.file) {
                res.json({ success: false, message: 'No file was selected for upload!' });
            } else {
                res.json({ success: true, message: 'The file has been uploaded successfully.', file: req.file });
            }
        }
    })
})


// error handlers
// Catch unauthorised errors
app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401);
        res.json({ "message": err.name + ": " + err.message });
    }
});



//Node Schedule
var sch = schedule.scheduleJob('0 9 * * *', function() {
    axios.post('http://localhost:8888/users/everydayChecking', {});
})



// Socket Server Engine

var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 8889;

server.listen(port, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("-- [ CHAMA PLUS SOCKET ] " + " SERVER STARTED ON PORT " + port + " --");
    // console.log(server);
});

io.on('connection', function(socket) {
    connections.push(socket.id);

    socket.on('login', function(data) {
        console.log("[Chama Plus App] => User Login :" + data.phone);
        // axios.post('http://localhost:8888/auth/updateAccountStatus', {user_id: data.user_id, status: 'online'})
        onlineUsers[data.phone] = {
            online: true,
            socket: socket,
        };
    });

    socket.on('send:message', function(data) {
        console.log(data.event_id + " event send message to " + data.user_id + " to " + data.contactId + " user, message => " + data.message);

        try {
            // if (onlineUsers[data.user_id].online){
            //     var user = onlineUsers[data.user_id].socket;
            //     user.emit('receive:message', {
            //         event_id: data.event_id,
            //         contactId: data.user_Id,
            //     });
            // }
            if (onlineUsers[data.contactId].online) {
                user = onlineUsers[data.contactId].socket;
                user.emit('receive:message', {
                    event_id: data.event_id,
                    contactId: data.user_id,
                    message: data.message,
                    message_type: data.message_type
                });
            }
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('logout', function(user_id) {
        console.log('[Chama Plus App] => User Disconnected: ' + user_id);
        var userIndex = connections.indexOf(socket.id);
        if (userIndex != -1) {
            console.log('[Chama Plus App] => User Disconnected: ' + onlineUsers[user_id]);
            connections.splice(userIndex, 1);
            // axios.post('http://localhost:8888/auth/updateAccountStatus', {user_id: user_id, status: 'offline'})
            onlineUsers[user_id] = false;
        }
    });
});

app.listen(8888, () => console.log('-- [ CHAMA PLUS NODE ] SERVER STARTED LISTENING ON PORT 8888 --'));