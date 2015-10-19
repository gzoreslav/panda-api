var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var rest = require("./rest.js");
var md5 = require('md5');

var app = express();

function REST () {
	var self = this;
	self.connectMysql();
}

/*REST.prototype.connectMysql = function() {
	var self = this;
	var pool = mysql.createPool({
		connectionLimit: 100,
		host: '127.0.0.1',
		user: 'root',
		password: 'fib9731$$$',
		database: 'panda',
		charset: 'UTF8_GENERAL_CI',
		debug: true
	});
	pool.getConnection(function(err, connection) {
		if (err) {
			self.stop(err);
		} else {
			self.configureExpress(connection);
		}
	});
}*/

REST.prototype.connectMysql = function() {
	var self = this;
	var pool = mysql.createPool({
		connectionLimit : 50,
		waitForConnection: true,
		host: '127.0.0.1',
		user: 'root',
		password: 'fib9731$$$',
		database: 'panda',
		charset: 'UTF8_GENERAL_CI',
		debug : false
	});
	self.configureExpress(pool);
}

var allowCrossDomain = function(req, res, next) {
    //res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Origin', 'http://pandarun.com.ua');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

REST.prototype.configureExpress = function(connection) {
	var self = this;
	app.use(allowCrossDomain);
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	var router = express.Router();
	app.use('/api', router);
	var rest_router = new rest(router, connection, md5);
	self.startServer();
}

REST.prototype.startServer = function() {
	app.listen(3004, function() {
		console.log('=== server started ===');
		console.log('panda-api alive at port 3004');
	});
}

REST.prototype.stop = function(err) {
	console.log('mysql issue:\n' + err);
	process.exit(1);
}

new REST();