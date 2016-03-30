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
	profile       = require("./routes/profile.js"),
	competitions  = require("./routes/competitions.js"),
	competitors   = require("./routes/competitors.js"),
	statistic     = require("./routes/statistic.js");
	articles      = require("./routes/articles.js");


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
    res.header('Access-Control-Allow-Origin', 'http://pandarun.com.ua:3001');
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

	var router = express.Router();
	app.use('/api', router);
	var profile_router      = new profile(router, connection, md5);
	var competitions_router = new competitions(router, connection, md5);
	var competitors_router  = new competitors(router, connection, md5);
	var statistic_router    = new statistic(router, connection, md5);
	var articles_router     = new articles(router, connection, md5);

	self.startServer();

}

REST.prototype.startServer = function() {
	var server = http.createServer(app).listen(port, function() {
		console.log('=== server started ===');
		console.log('panda-api alive at port ' + port);
	});
}

REST.prototype.stop = function(err) {
	console.log('mysql issue:\n' + err);
	process.exit(1);
}

new REST();
