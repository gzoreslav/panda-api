var mysql   = require('mysql'),
    md5     = require("md5");

function ROUTER(router, connection, md5) {
    this.handleRoutes(router, connection, md5);
}

ROUTER.prototype.handleRoutes= function(router, connection, md5) {

    /*
    articles
    */

    router.get("/articles", function(req,res){
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

}

module.exports = ROUTER;
