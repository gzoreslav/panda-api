var _        = require('lodash'),
    config   = require('../config'),
    mysql    = require('mysql'),
    md5      = require("md5");

function ROUTER(router, connection, md5) {
    this.handleRoutes(router, connection, md5);
}

ROUTER.prototype.handleRoutes= function(router, connection, md5) {
    
    //get all users for competition
    router.get('/competitions/:id/competitors', function(req, res) {
        var query = "SELECT " +
        "competitors.id, competitors.firstname, competitors.lastname, competitors.nickname, " +
        "competitors.number, competitors.id_category, competitors.club, competitors.location, competitors.age, competitors.sex, " +
        "categories.title, categories.dist, competitors.id_user, count(results.id) as results " +
        "FROM competitors " +
        "left JOIN results ON ( results.id_competitor = competitors.id ) " +
        "inner join categories on (competitors.id_category = categories.id) " +
        "WHERE id_category in (select id from categories where id_competition = ?) " +
        "GROUP BY " +
        "competitors.id, competitors.firstname, competitors.lastname, competitors.nickname, " +
        "competitors.number, competitors.id_category, competitors.club, competitors.location, competitors.age, competitors.sex, " +
        "categories.title, categories.dist, competitors.id_user  " +
        "order by categories.dist desc, categories.title, lastname, firstname";
        query = mysql.format(query, req.params.id);
        connection.query(query,function(err, rows) {
            if (err) {
                console.log(err);
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                res.status(200).json({"data": rows, "total": rows.length});
                return;
            }
        });
    });

    //get all users for competition
    router.get('/categories/:id/competitors', function(req, res) {
        var query = "SELECT " +
        "competitors.id, competitors.firstname, competitors.lastname, competitors.nickname, " +
        "competitors.number, competitors.id_category, competitors.club, competitors.location, competitors.age, competitors.sex, " +
        "categories.title, categories.dist, competitors.id_user, count(results.id) as results " +
        "FROM competitors " +
        "left JOIN results ON ( results.id_competitor = competitors.id ) " +
        "inner join categories on (competitors.id_category = categories.id) " +
        "WHERE id_category = ? " +
        "GROUP BY " +
        "competitors.id, competitors.firstname, competitors.lastname, competitors.nickname, " +
        "competitors.number, competitors.id_category, competitors.club, competitors.location, competitors.age, competitors.sex, " +
        "categories.title, categories.dist, competitors.id_user " +
        "order by lastname, firstname";
        query = mysql.format(query, req.params.id);
        connection.query(query,function(err, rows) {
            if (err) {
                console.log(err);
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                res.status(200).json({"data": rows, "total": rows.length});
                return;
            }
        });
    });

}


module.exports = ROUTER;