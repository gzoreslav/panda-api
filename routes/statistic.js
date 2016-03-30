var mysql   = require('mysql'),
    moment  = require('moment'),
    m26     = require("m26-js"),
    md5     = require("md5");

function ROUTER(router, connection, md5) {
    this.handleRoutes(router, connection, md5);
}

ROUTER.prototype.handleRoutes= function(router, connection, md5) {

    /*
    Statistics
    */

    router.get("/stat/competitions_by_type",function(req,res){
        var query = "SELECT competitions_type.id, competitions_type.title, count(competitions.id) as competitions_count " +
            "FROM competitions_type " +
            "left join competitions on (competitions.competition_type = competitions_type.id) " +
            "group by competitions_type.id, competitions_type.title " +
            "order by competitions_count desc";
        connection.query(query,function(err,rows){
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


    router.get("/stat/competitions_by_year",function(req,res){
        var query = "SELECT  " +
            "count(id) as competitions_count, YEAR(start_date) as competition_year  " +
            "FROM competitions " +
            "group by competition_year " +
            "order by competition_year desc " +
            "limit 10";
        connection.query(query,function(err,rows){
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

    router.get("/stat/competitions_top",function(req,res){
        var query = "SELECT competitions.id, competitions.title, count(distinct results.id_competitor) as competition_count " +
            "FROM competitions " +
            "inner join categories on (categories.id_competition = competitions.id) " +
            "inner join laps on (laps.id_category = categories.id) " +
            "inner join results on (results.id_lap = laps.id) " +
            "group by competitions.id, competitions.title " +
            "order by competition_count desc " +
            "limit 10";
        connection.query(query,function(err,rows){
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

    router.get("/stat/users_sex",function(req,res){
        var query = "select count(id) as c, sex from users group by sex";
        connection.query(query,function(err,rows){
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

    router.get("/stat/general",function(req,res){
        var query = 'select "competitions" as name, count(id) as l, NULL as d from competitions ' +
            'union select "competiton_types" as name, count(id) as l, NULL as d from competitions_type ' +
            'union select "competitions_first" as name, NULL as l, min(start_date) as d from competitions ' +
            'union select "competitions_last" as name, NULL as l, max(start_date) as d from competitions ' +
            'union select "users" as name, count(id) as l, NULL as d from users ' +
            'union select "users_young" as name, NULL as l, min(birthday) as d from users ' +
            'union select "users_old" as name, NULL as l, max(birthday) as d from users';
        connection.query(query,function(err,rows){
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

    router.get("/stat/location",function(req,res){
        var query = "SELECT count(id) as competition_count, location FROM competitions " +
            "where location <> '' " +
            "group by competitions.location " +
            "order by competition_count desc";
        connection.query(query,function(err,rows){
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