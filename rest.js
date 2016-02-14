var mysql = require('mysql');
var moment = require('moment');
m26 = require("m26-js");

function REST_ROUTER(router, connection, md5) {
    var self = this;
    self.handleRoutes(router, connection, md5);
}

REST_ROUTER.prototype.handleRoutes= function(router, connection, md5) {
    
    router.get("/", function(req, res){
        res.json({"message" : "panda-api (default version)"});
    });

    router.get("/users",function(req,res){
        var query = "SELECT * FROM users";
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

    router.get("/users/:user_id",function(req,res){
        var query = "SELECT * FROM users WHERE id = ?";
        query = mysql.format(query, req.params.user_id);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                if (rows.length !== 0) {
                    res.status(200).json({"data": rows[0]});
                    return;
                } else {
                    res.status(404).json({"error": {"message": "user not found"}});
                    return;
                }
            }
        });
    });

    router.get("/users/facebook/:user_id",function(req,res){
        var query = "SELECT * FROM users WHERE fb_id = ?";
        query = mysql.format(query, req.params.user_id);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                if (rows.length !== 0) {
                    res.status(200).json({"data": rows[0]});
                    return;
                } else {
                    res.status(404).json({"error": {"message": "user not found"}});
                    return;
                }
            }
        });
    });

    //old users
    router.get("/users2",function(req,res){
        var query = "SELECT * FROM user_login";
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

    router.get("/users2/:user_id",function(req,res){
        var query = "SELECT * FROM user_login WHERE id = ?";
        query = mysql.format(query, req.params.user_id);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
            	if (rows.length !== 0) {
                	res.status(200).json({"data": rows[0]});
                	return;
            	} else {
                	res.status(404).json({"error": {"message": "user not found"}});
                	return;
            	}
            }
        });
    });

    router.post("/users2", function(req, res){
        var query = "INSERT INTO user_login (user_email, user_password) VALUES (?,?)";
        var table = [
        	req.body.email,
        	md5(req.body.password)
        ];
        query = mysql.format(query,table);
        connection.query(query, function(err, rows){
            if (err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
            	query = "select * from user_login where user_email = ?";
            	query = mysql.format(query, req.body.email);
            	connection.query(query,function(err,rows) {
            		if (err) {
	                	res.status(500).json({"error": {
	                		"message": "SQL error",
	                		"origin": err
	                	}});
                		return;
            		} else {
                		res.status(200).json(rows[0]);
                		return;
                	}	
            	});
            }
        });
    });

    router.put("/users2/:id", function(req, res) {
    	var old_pass = md5(req.body.password);
    	var passed = false;
        var query = "select user_password, user_email from user_login WHERE user_id = ?";
        query = mysql.format(query, req.params.id)
        connection.query(query, function(err, rows) {
            if(err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
            	if (rows.length !== 1) {
                	res.status(404).json({"error": {"message": "user not found"}});
            	} else {
            		console.log(md5(req.body.old_password));
            		console.log(rows[0].user_password);
			        if (md5(req.body.old_password) !== rows[0].user_password) {
	                	res.status(403).json({"error": {"message": "passwords mismatch"}});
	                	return;
			        }
			        if (req.body.email !== rows[0].user_email) {
	                	res.status(403).json({"error": {"message": "emails mismatch"}});
	                	return;
			        }
				        var query = "UPDATE user_login SET user_password = ? WHERE user_id = ?";
				        var table = [
				        	md5(req.body.password),
				        	req.params.id
				        ];
				        query = mysql.format(query, table);
				        connection.query(query, function(err, rows) {
				            if(err) {
				                res.status(500).json({"error": {
				                	"message": "SQL error",
				                	"origin": err
				                }});
				                return;
				            } else {
				                res.status(204).json();
				                return;
				            }
				        });
            	}
            }
        });
    });

	/*
	competitions
	*/

    router.get("/competitions",function(req,res){
        var query = "select " + 
        	"competitions.title, competitions.id, competitions.location, " +
        	"competitions.start_date, competitions_type.id as type_id, " +
        	"competitions_type.title as type_title, count(competitors.id) as competitors_count, " +
            "competitions.logo_large, competitions.logo " + 
        	"from competitions " +
        	"inner join competitions_type on (competitions_type.id = competitions.competition_type) " +
            "left join categories on (categories.id_competition = competitions.id) " +
            "left join competitors on (competitors.id_category = categories.id) " +
            "where (status <> 0) " +
            "group by competitions.title, competitions.id, competitions.location, " +
            "competitions.logo_large, competitions.logo, " +
            "competitions.start_date, competitions_type.id, competitions_type.title " +
            "order by competitions.start_date desc";
        connection.query(query,function(err,rows){
            if (err) {
            	console.log(err);
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
                query = "select * from categories order by dist desc";
                connection.query(query,function(err, categories) {
                    if (err) {
                        console.log(err);
                        res.status(500).json({"error": {
                            "message": "SQL error",
                            "origin": err
                        }});
                        return;
                    } else {
                        //categories
                        for (var i = 0; i < rows.length; i++) {
                            rows[i].categories = [];
                            for (var j = 0; j < categories.length; j++) {
                                if (categories[j].id_competition === rows[i].id) {
                                    rows[i].categories.push(categories[j]);
                                }
                            }
                        };
                        //competitors
                        for (var i = 0; i < rows.length; i++) {
                            //TODO count real value
                            rows[i].competitors = {count: rows[i].competitors_count};
                        }
                        res.status(200).json({"data": rows, "total": rows.length});
                        return;
                    }
                });
            }
        });
    });

    router.get("/competitions/:id",function(req,res){
        var query = "SELECT competitions.id, competitions.title, competitions.location, competitions.competition_type, " +
        "competitions.start_date, competitions.url, competitions.logo_large, competitions.logo, competitions.descr, " +
        "competitions.status, competitions.show_laps, " +
        "competitions_type.title as type_title " +
        "FROM competitions " +
        "left join competitions_type on (competitions_type.id = competitions.competition_type) " +
        "WHERE (competitions.id = ?) and (competitions.status <> 0)";
        query = mysql.format(query, req.params.id);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
            	if (rows.length !== 0) {
                    rows[0].categories = [];
                    //TODO count real value
                    rows[0].competitors = {count: 0};
                    query = "select categories.id, categories.title, categories.descr, categories.dist, categories.id_competition, count(laps.id) as laps " + 
                    "from categories " + 
                    "left join laps on (laps.id_category = categories.id) " +
                    "where categories.id_competition = ? " +
                    "group by categories.id, categories.title, categories.descr, categories.dist " +
                    "order by categories.dist desc";
                    query = mysql.format(query, req.params.id);
                    connection.query(query,function(err, categories) {
                        if (err) {
                            console.log(err);
                            res.status(500).json({"error": {
                                "message": "SQL error",
                                "origin": err
                            }});
                            return;
                        } else {
                            query = "select id_category, count(id) as competitors_count from competitors where id_category in " +
                            "(select id from categories where id_competition = ?) group by id_category";
                            query = mysql.format(query, req.params.id);
                            connection.query(query,function(err, competitors) {
                                if (err) {
                                    console.log(err);
                                    res.status(500).json({"error": {
                                        "message": "SQL error",
                                        "origin": err
                                    }});
                                    return;
                                } else {
                                    for (var i = 0; i < categories.length; i++) {
                                        rows[0].categories.push(categories[i]);
                                        rows[0].categories[i].competitors = 0;
                                        for (var j = 0; j < competitors.length; j++) {
                                            if (competitors[j].id_category === rows[0].categories[i].id) {
                                                rows[0].categories[i].competitors = competitors[j].competitors_count;
                                            }
                                        }
                                    }
                        	        res.status(200).json({"data": rows[0]});
                        	        return;
                                }
                            });        
                        }
                    });
            	} else {
                	res.status(404).json({"error": {"message": "competition not found"}});
                	return;
            	}
            }
        });
    });

    router.post("/competitions", function(req, res){
        var query = "INSERT INTO competitions (title, location, start_date, competition_type) VALUES (?, ?, ?, ?)";
        var table = [
        	req.body.title,
        	req.body.location,
        	req.body.start,
        	req.body.type
        ];
        query = mysql.format(query,table);
        connection.query(query, function(err, rows){
            if (err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
            	query = "select * from competitions where title = ?";
            	query = mysql.format(query, req.body.title);
            	connection.query(query,function(err,rows) {
            		if (err) {
	                	res.status(500).json({"error": {
	                		"message": "SQL error",
	                		"origin": err
	                	}});
                		return;
            		} else {
                		res.status(200).json(rows[0]);
                		return;
                	}	
            	});
            }
        });
    });

    router.put("/competitions/:id", function(req, res) {
		var query = "UPDATE competitions SET title = ?, location = ?, start = ? WHERE id = ?";
		var table = [
			req.body.title,
			req.body.location,
			req.body.start,
			req.params.id
		];
		query = mysql.format(query, table);
		connection.query(query, function(err, rows) {
			if(err) {
				res.status(500).json({"error": {
					"message": "SQL error",
				    "origin": err
				}});
				return;
			} else {
            	query = "select * from competitions where id = ?";
            	query = mysql.format(query, req.params.id);
            	connection.query(query,function(err,rows) {
            		if (err) {
	                	res.status(500).json({"error": {
	                		"message": "SQL error",
	                		"origin": err
	                	}});
                		return;
            		} else {
                		res.status(200).json(rows[0]);
                		return;
                	}	
            	});
			}
		});
    });

    router.delete("/competitions/:id", function(req, res){
        var query = "delete from competitions where id = ?";
        query = mysql.format(query, req.params.id);
        connection.query(query, function(err, rows){
            if (err) {
                res.status(500).json({"error": {
                	"message": "SQL error",
                	"origin": err
                }});
                return;
            } else {
                res.status(204).json();
                return;
            }
        });
    });

    /*
    articles
    */

    router.get("/articles",function(req,res){
        var query = "select " + 
            "title, id, status, posted, descr " +
            "from articles " +
            "where (status=0) " +
            "order by posted desc";
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

    /*
    categories
    */

    router.get("/category/:id",function(req,res){
        var query = "SELECT categories.id, categories.title, categories.descr, categories.id_competition, " +
        "categories.dist, competitions.title as competition_title, competitions.show_laps as show_laps, competitions.logo as logo, " +
        "competitions.start_date, competitions.location " + 
        "FROM categories " +
        "left join competitions on (competitions.id = categories.id_competition) " +
        "WHERE categories.id = ?";
        query = mysql.format(query, req.params.id);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"error": {
                    "message": "SQL error",
                    "origin": err
                }});
                return;
            } else {
                if (rows.length !== 0) {
                    rows[0].laps = {data: [], count: 0};
                    query = "select * from laps where id_category = ? order by distance";
                    query = mysql.format(query, req.params.id);
                    connection.query(query,function(err, laps) {
                        if (err) {
                            console.log(err);
                            res.status(500).json({"error": {
                                "message": "SQL error",
                                "origin": err
                            }});
                            return;
                        } else {
                            for (var i = 0; i < laps.length; i++) {
                                rows[0].laps.data.push(laps[i]);
                            }
                            rows[0].laps.count = laps.length;
                            res.status(200).json({"data": rows[0]});
                            return;
                        }
                    });
                } else {
                    res.status(404).json({"error": {"message": "competition not found"}});
                    return;
                }
            }
        });
    });

    /*
    results
    */

    timePosition = function(results) {
        if (results.length === 0) return;
        var lapCount = results[0].laps.length;
        var index;
        var ix;
        var min;
        for (var l = 0; l < lapCount; l++) {
            index = 0;
            for (var i = 0; i < results.length; i++) {
                ix = -1;
                min = 10e200;
                for (var j = 0; j < results.length; j++) {
                    if ((results[j].laps[l].ms !== 'n/a') && 
                        (results[j].laps[l].ms !== -1) && 
                        (results[j].laps[l].ms !== 0) && 
                        (results[j].laps[l].position === 'n/a'))  {
                        if (results[j].laps[l].ms < min) {
                            ix = j;
                            min = results[j].laps[l].ms;
                        }
                    }    
                }
                if (ix !== -1) {
                    index++;  
                    results[ix].laps[l].position = index;
                }
            }
        }
        for (var i = 0; i < results.length; i++) {
            for (var l = 0; l < lapCount; l++) {
                if (results[i].laps[l].position !== 'n/a') {
                    if (l > 0) {
                        if ((results[i].laps[l-1].position !== 'n/a') && 
                            (results[i].laps[l].position !== results[i].laps[l-1].position)) {
                            results[i].laps[l].increase = (results[i].laps[l].position < results[i].laps[l-1].position);
                        }
                    }
                    if (l === 0) {
                        var t = new m26.ElapsedTime(results[i].laps[l].time.split('.')[0]);
                        var d = new m26.Distance(results[i].laps[l].dist, 'k');
                        var s = new m26.Speed(d, t);
                        results[i].laps[l].speed = s.kph().toFixed(2);
                        results[i].laps[l].pace = s.pace_per_km();
                    } else if (results[i].laps[l-1].position !== 'n/a') {
                        var t1 = (new m26.ElapsedTime(results[i].laps[l - 1].time.split('.')[0])).seconds();
                        var t2 = (new m26.ElapsedTime(results[i].laps[l].time.split('.')[0])).seconds();
                        var t = new m26.ElapsedTime(t2-t1);   
                        var d = new m26.Distance(results[i].laps[l].dist, 'k');
                        var s = new m26.Speed(d, t);
                        results[i].laps[l].speed = s.kph().toFixed(2);
                        results[i].laps[l].pace = s.pace_per_km();
                    }  
                }
            }
        }
        var hi;
        var h;
        var si;
        var s;
        for (var i = 0; i < results.length; i++) {
            hi = -1;
            h = 0;
            si = -1;
            s = 10000;
            for (var l = 0; l < lapCount; l++) {
                if (results[i].laps[l].speed !== 'n/a') {
                    if (parseFloat(results[i].laps[l].speed) > h) {
                        h = parseFloat(results[i].laps[l].speed);
                        hi = l;
                    }
                    if (parseFloat(results[i].laps[l].speed) < s) {
                        s = parseFloat(results[i].laps[l].speed);
                        si = l;
                    }
                }
            }
            if (hi !== -1) {
                results[i].laps[hi].highest = true;
            }
            if (si !== -1) {
                results[i].laps[si].lowest = true;
            }
        }        
    };

    sortResults = function(results) {
        if (results.length === 0) {
            return results;
        }
        var res = results.sort(function(a, b) {
            var sumA = 0;
            a.laps.map(function(lap) {
                //get last checked time
                if ((lap.ms !== 0) && (lap.ms !== -1)) { 
                    sumA = lap.ms;
                }    
            });
            var sumB = 0;
            b.laps.map(function(lap) {
                //get last checked time
                if ((lap.ms !== 0) && (lap.ms !== -1)) { 
                    sumB = lap.ms;
                }    
            });
            var fallsA = 0;
            a.laps
                .filter(function(lap) {
                    return (lap.ms === -1);
                })
                .map(function(lap) {
                    fallsA++;
                });
            var fallsB = 0;
            b.laps
                .filter(function(lap) {
                    return (lap.ms === -1);
                })
                .map(function(lap) {
                    fallsB++;
                });
            //sort by falls
            if (fallsA < fallsB) {
                return -1;
            }
            if (fallsA > fallsB) {
                return 1;
            }
            //sort by time
            if (sumA < sumB) {
                return -1;
            }
            if (sumA > sumB) {
                return 1;
            }
            //all the same
            return 0;
        });
        var i = 0;
        res.map(function(r) {
            r.rank = ++i;
        });
        return res;
    };

    router.get("/category/:id/results",function(req,res){
        var query = 
        "SELECT " +
        "id, firstname, lastname, nickname, number, id_category, club, location, age, sex " +
        "from competitors " +
        "WHERE id_category = ?";
        query = mysql.format(query, req.params.id);
        connection.query(query,function(err,rows){
            if (err) {
                console.log(err);
                res.status(500).json({"error": {
                    "message": "/category/:id/results [001] SQL error",
                    "origin": err
                }});
                return;
            } else {
                //add rank
                var i = 0;
                rows.map( function(row) {
                    row.rank = ++i;
                });
                //add results
                    query = "select * from laps where id_category = ? order by distance";
                    query = mysql.format(query, req.params.id);
                    connection.query(query,function(err, laps) {
                        if (err) {
                            console.log(err);
                            res.status(500).json({"error": {
                                "message": "/category/:id/results [002] SQL error",
                                "origin": err
                            }});
                            return;
                        } else {
                            rows.map(function(row) {
                                row.laps = [];
                                row.total = {
                                    dist: 0,
                                    speed: 'n/a',
                                    pace: 'n/a',
                                    position: 'n/a'
                                }
                                for (var i = 0; i < laps.length; i++) {
                                    row.laps.push({
                                        id: laps[i].id,
                                        dist: (i > 0) ? laps[i].distance - laps[i - 1].distance : laps[i].distance,
                                        time: 'n/a',
                                        ms: -1, // -1 = n/a, 0 - not checked
                                        speed: 'n/a',
                                        pace: 'n/a',
                                        position: 'n/a'
                                    });
                                    if (i === laps.length - 1) {
                                        row.laps[laps.length - 1].total = {
                                            dist: laps[i].distance,
                                            speed: 'n/a',
                                            pace: 'n/a',
                                            position: 'n/a'
                                        }
                                    }
                                }
                            });
                            resquery = "SELECT " +
                            "id, id_lap, id_competitor, result, skiped " +
                            "FROM results " +
                            "WHERE " +
                            "(id_lap in (select id from laps where id_category = ?)) and " +
                            "(id_competitor in (select id from competitors where id_category = ?)) " +
                            "order by id_competitor, id_lap";
                            resquery = mysql.format(resquery, [req.params.id, req.params.id]);
                            connection.query(resquery, function(err, results) {
                                if (err) {
                                    console.log(err);
                                    res.status(500).json({"error": {
                                        "message": "/category/:id/results [003] SQL error",
                                        "origin": err
                                    }});
                                    return;
                                } else {
                                    results.map(function(result) {
                                        var competitorResults = rows.filter(function(r) { 
                                            return (r.id === result.id_competitor);
                                        });  
                                        if (competitorResults.length > 0) {  
                                            var cell = competitorResults[0].laps.find(l => l.id === result.id_lap);
                                            if (cell !== undefined) {
                                                cell.skiped = (result.skipped === 1);
                                                if (result.result.toLowerCase() === 'n/a') {
                                                    cell.ms = -1;
                                                } else if (result.result === '0') {
                                                    cell.ms = 0;
                                                } else {    
                                                    cell.ms = moment(result.result, 'HH:mm:ss.SSS').format('x');
                                                    cell.time = moment(cell.ms, 'x').format('HH:mm:ss.SSS');
                                                    //pace and speed
                                                    if (cell.total !== undefined) {
                                                        var t = new m26.ElapsedTime(cell.time);
                                                        var d = new m26.Distance(cell.total.dist, 'k');
                                                        var s = new m26.Speed(d, t);
                                                        cell.total.speed = s.kph().toFixed(2);
                                                        cell.total.pace = s.pace_per_km();
                                                    }    
                                                }    
                                            }
                                        }    
                                    });
                                    //summaryTimes(rows);
                                    timePosition(rows);
                                    res.status(200).json({"data": sortResults(rows)});
                                    return;
                                }
                            });    
                        }    
                    });
            }
        });
    });

    /*
    Statistics
    */

    router.get("/stat/competitions_by_type",function(req,res){
        var query = "SELECT competitions_type.id, competitions_type.title, count(competitions.id) as competitions_count " +
            "FROM competitions_type " +
            "left join competitions on (competitions.competition_type = competitions_type.id) " +
            "group by competitions_type.id, competitions_type.title";
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

module.exports = REST_ROUTER;