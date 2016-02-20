var express       = require('express'),
	mysql         = require('mysql'),
	bodyParser    = require('body-parser'),
	md5           = require('md5'),
	logger        = require('morgan'),
    cors          = require('cors'),
    http          = require('http'),
    errorhandler  = require('errorhandler'),
    cors          = require('cors'),
    dotenv        = require('dotenv'),
	rest          = require("./rest.js");


var app = express();

dotenv.load();

function REST () {
	var self = this;
	self.connectMysql();
}

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

var port = process.env.PORT || 3004;

REST.prototype.configureExpress = function(connection) {
	var self = this;

	app.use(allowCrossDomain);
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	app.use(cors());

	app.use(function(err, req, res, next) {
		if (err.name === 'StatusError') {
	    	res.send(err.status, err.message);
	  	} else {
	    	next(err);
	  	}
	});

	if (process.env.NODE_ENV === 'development') {
		app.use(logger('dev'));
  		app.use(errorhandler())
	}

	app.use(require('./anonymous-routes'));
	app.use(require('./protected-routes'));
	app.use(require('./user-routes'));
	
	var router = express.Router();
	app.use('/api', router);
	var rest_router = new rest(router, connection, md5);
	self.startServer();

}

REST.prototype.startServer = function() {
	http.createServer(app).listen(port, function() {
		console.log('=== server started ===');
		console.log('panda-api alive at port ' + port);
	});
}

REST.prototype.stop = function(err) {
	console.log('mysql issue:\n' + err);
	process.exit(1);
}

new REST();
