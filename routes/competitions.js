var mysql   = require('mysql'),
    moment  = require('moment'),
    m26     = require("m26-js"),
    md5     = require("md5");

function ROUTER(router, connection, md5) {
    this.handleRoutes(router, connection, md5);
}

ROUTER.prototype.handleRoutes= function(router, connection, md5) {

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

    summaryTimes = function(results) {
        if (results.length === 0) {
            return results;
        }
        results.map(function(r, i) {
            //find total values for the last lap
            if (r.laps.length > 0) {
                for (var j = r.laps.length - 1; j >= 0; j--) {
                    if (r.laps[j].ms > 0) {
                        break;
                    }
                    if ((r.laps[j].ms == 0) && (r.laps[j].skiped == false)) {
                        r.fall = true;
                        break;
                    }
                }
                var k = r.laps.length - 1;
                if (k > 0) {
                    while (r.laps[k].time === 'n/a') {
                        k--;
                        if (k === 0) { break; }
                    }
                }
                if (r.laps[k].time !== 'n/a') {
                    var sum = 0;
                    for (var j = 0; j < k + 1; j++) {
                        sum = sum + r.laps[j].dist;
                    }
                    var t = new m26.ElapsedTime(r.laps[k].time);
                    var d = new m26.Distance(sum, 'k');
                    var s = new m26.Speed(d, t);
                    if (r.laps[k].total == undefined) {
                        r.laps[k].total = {};
                    }
                    r.laps[k].total.speed = s.kph().toFixed(2);
                    r.laps[k].total.pace = s.pace_per_km();
                }
            }
            //for competition without laps
            if (r.show_laps == 0) {
                if (r.laps.length > 0) {
                    r.total.dist     = r.laps[r.laps.length - 1].total.dist;
                    r.total.speed    = r.laps[r.laps.length - 1].total.speed;
                    r.total.pace     = r.laps[r.laps.length - 1].total.pace;
                    r.total.position = r.laps[r.laps.length - 1].position;
                    r.total.time     = r.laps[r.laps.length - 1].time;
                    if ((i > 0) && (r.total.time !== 'n/a')) {
                        var prev = 'n/a';
                        var winner = 'n/a';
                        if (results[i - 1].total.time !== 'n/a') {
                            var t1 = (new m26.ElapsedTime(results[i - 1].total.time.split('.')[0])).seconds();
                            var t2 = (new m26.ElapsedTime(r.total.time.split('.')[0])).seconds();
                            prev = new m26.ElapsedTime(t2-t1).as_hhmmss() + '.000';
                        }
                        if (results[0].total.time !== 'n/a') {
                            var t3 = (new m26.ElapsedTime(results[0].total.time.split('.')[0])).seconds();
                            var t4 = (new m26.ElapsedTime(r.total.time.split('.')[0])).seconds();
                            winner = new m26.ElapsedTime(t4-t3).as_hhmmss() + '.000';
                        }
                        r.total.dif = {
                            prev: prev,
                            winner: winner
                        }
                    }
                }
            } else {
                if (r.laps.length > 0) {
                    var k = r.laps.length - 1;
                    while (r.laps[k].time === 'n/a') {
                        k--;
                        if (k === 0) { break; }
                    }
                    r.total.time = r.laps[k].time;
                    r.total.lap = r.laps.length - 1 - k;
                    if (typeof(r.laps[k].total) !== 'undefined') {
                        r.total.dist     = r.laps[k].total.dist;
                        r.total.speed    = r.laps[k].total.speed;
                        r.total.pace     = r.laps[k].total.pace;
                        r.total.position = r.laps[k].position;
                    }
                    if ((i > 0) && (r.total.time !== 'n/a') && (r.total.lap == 0)) {
                        var prev = 'n/a';
                        var winner = 'n/a';
                        if (results[i - 1].total.time !== 'n/a') {
                            var t1 = (new m26.ElapsedTime(results[i - 1].total.time.split('.')[0])).seconds();
                            var t2 = (new m26.ElapsedTime(r.total.time.split('.')[0])).seconds();
                            prev = new m26.ElapsedTime(t2-t1).as_hhmmss() + '.000';
                        }
                        if (results[0].total.time !== 'n/a') {
                            var t3 = (new m26.ElapsedTime(results[0].total.time.split('.')[0])).seconds();
                            var t4 = (new m26.ElapsedTime(r.total.time.split('.')[0])).seconds();
                            winner = new m26.ElapsedTime(t4-t3).as_hhmmss() + '.000';
                        }
                        r.total.dif = {
                            prev: prev,
                            winner: winner
                        }
                    }
                }
            }
        });
        return results;
    };

    router.get("/category/:id/results",function(req,res){
        var query = 
        "SELECT " +
        "competitors.id as id, competitors.firstname as firstname, competitors.lastname as lastname, " +
        "competitors.nickname as nickname, competitors.number as number, " +
        "competitors.id_category as id_category, competitors.club as club, " +
        "competitors.location as location, competitors.age as age, competitors.sex as sex, " + 
        "competitors.id_user as id_user, competitions.show_laps as show_laps " +
        "from competitors " +
        "inner join categories on (categories.id = competitors.id_category) " +
        "inner join competitions on (categories.id_competition = competitions.id) " +
        "WHERE competitors.id_category = ?";
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

                                                    /*var t = new m26.ElapsedTime(cell.time);
                                                    var d = new m26.Distance(cell.dist, 'k');
                                                    var s = new m26.Speed(d, t);
                                                    if (cell.total === undefined) {
                                                        cell.total = {};
                                                    }
                                                    cell.total.speed = s.kph().toFixed(2);
                                                    cell.total.pace = s.pace_per_km();*/
                                                    
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
                                    timePosition(rows);
                                    summaryTimes(rows);
                                    res.status(200).json({"data": sortResults(rows)});
                                    return;
                                }
                            });    
                        }    
                    });
            }
        });
    });

}

module.exports = ROUTER;
