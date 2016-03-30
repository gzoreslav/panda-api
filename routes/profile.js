var _        = require('lodash'),
    config   = require('../config'),
    jwt     = require('express-jwt'),
    jwtToken = require('jsonwebtoken'),
    mysql    = require('mysql'),
    md5      = require("md5");

function createToken(user) {
  return jwtToken.sign(_.omit(user, 'password'), config.secret, { expiresInMinutes: 60*5 });
}

var jwtCheck = jwt({
    secret: config.secret
});

function ROUTER(router, connection, md5) {
    this.handleRoutes(router, connection, md5);
}

ROUTER.prototype.handleRoutes= function(router, connection, md5) {
    
    //register/login user
    router.post("/login", function(req, res) { 

        if (!req.body.id || !req.body.password) {
            return res.status(400).send({message: "You must send the username and the password"});
        }

        var hash = md5(req.body.id + config.secret);
        if (hash !== req.body.password) {
            return res.status(400).send({message: "Wrong username or password"});
        }

        var query = "SELECT id FROM users WHERE fb_id = ?";
        query = mysql.format(query, req.body.id);
        connection.query(query, function(err, rows){
            if (err) {
                return res.status(500).send({message: err});
            } else {
                if (rows.length !== 0) {
                    getUser(req, res);
                } else {
                    query = "INSERT INTO users (fb_id, password, firstname, lastname, sex) VALUES (?, ?, ?, ?, ?)";
                    var table = [
                        req.body.id,
                        req.body.password,
                        req.body.first_name || ("User [" + req.body.id + "]"),
                        req.body.last_name || "",
                        req.body.gender === "male" ? "m" : req.body.gender === "female" ? "f" : ""
                    ];
                    query = mysql.format(query, table);
                    connection.query(query, function(err, rows){
                        if (err) {
                            return res.status(500).send({message: err});
                        } else {
                            getUser(req, res);
                        }
                    });
                }
            }    
        });
      
    }); 

    function getUser(req, res) {
        var query = "SELECT id, firstname, lastname FROM users WHERE fb_id = ?";
        query = mysql.format(query, req.body.id);
        connection.query(query,function(err,rows){
            if (err) {
                return res.status(500).send({message: err});
            } else {
                if (rows.length === 0) {
                    return res.status(500).send({message: "SQL error: User did not created"});
                } else {
                  return res.status(201).send({
                    id_token: createToken(rows[0])
                  });
                }
            }
        });
    }

    //current user profile
    router.get('/profile', jwtCheck, function(req, res) {
        getProfile(req, res, req.user.id);
    });

    //user profile
    router.get('/profile/:id', function(req, res) {
        getProfile(req, res, req.params.id);
    });
    
    function getProfile(req, res, id) {
        jwtCheck(req, res, function() {
            var query = "SELECT id, fb_id, firstname, lastname, nickname, location, sex, birthday, team, role FROM users WHERE id = ?";
            query = mysql.format(query, id);
            connection.query(query,function(err,rows){
                if (err) {
                    return res.status(500).send({text: err});
                } else {
                    if (rows.length === 0) {
                        return res.status(404).send('Користувача не знайдено');
                    } else {
                      return res.status(200).send({
                        id: rows[0].id,
                        fb_id: rows[0].fb_id,
                        firstname: rows[0].firstname,
                        lastname: rows[0].lastname,
                        nickname: rows[0].nickname,
                        location: rows[0].location,
                        birthday: rows[0].birthday,
                        role: rows[0].role,
                        sex: rows[0].sex,
                        team: rows[0].team,
                        me: _.get(req, 'user.id') == rows[0].id
                      });
                    }
                }
            });
        });
    };

    function loginCheck(req, res, callback) {
        jwtCheck(req, res, function() {
            callback(req, res);
        });
    }

    function getUsers(req, res) {
        var query = "SELECT " + 
            "users.id, users.fb_id, users.firstname, users.lastname, users.nickname, " +
            "users.location, users.sex, users.birthday, users.team, users.role, " +
            "count(competitors.id) as competitions " +
            "from users " +
            "left join competitors on (competitors.id_user = users.id) " +
            "GROUP BY users.id, users.fb_id, users.firstname, users.lastname, " + 
            "users.nickname, users.location, users.sex, users.birthday, users.team, users.role";
        connection.query(query,function(err, rows) {
            if (err) {
                console.log(err);
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                for (var i = 0; i < rows.length; i++) {
                    rows[i].me = (_.get(req, 'user.id') == rows[i].id);
                } 
                res.status(200).json({"data": rows, "total": rows.length});
                return;
            }
        });
    }

    //get all registered users (with me indicator)
    router.get('/users', function(req, res) {
        loginCheck(req, res, getUsers);
    });

    router.put("/profile", jwtCheck, function(req, res) {
        if (!req.body.id) {
            return res.status(400).send('Не вказаний код профайлу');
        }
        if (!req.body.firstname) {
            return res.status(400).send('Не вказане ім\'я');
        }
        if (!req.body.lastname) {
            return res.status(400).send('Не вказане прізвище');
        }
        if (!req.body.birthday) {
            return res.status(400).send('Не вказана дата народження');
        }
        var query = "update users " + 
            "set firstname = ?, lastname = ?, nickname = ?, birthday = ?, sex = ?, location = ?, team = ? " + 
            "where id = ?";
        var table = [
            req.body.firstname,
            req.body.lastname,
            req.body.nickname,
            req.body.birthday,
            req.body.sex,
            req.body.location,
            req.body.team,
            req.body.id
        ];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows){
            if (err) {
                return res.status(500).send(err);
            } else {
                getProfile(req, res, req.body.id);
            }
        });
    }); 

}

module.exports = ROUTER;