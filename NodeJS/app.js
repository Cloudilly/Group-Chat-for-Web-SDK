var SECRET= "<INSERT YOUR SECRET KEYS>";
var jwt= require("jsonwebtoken");
var bodyParser= require("body-parser");
var express= require("express");
var app= express();
app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/tokens", function(req, res) {
    res.end(jwt.sign({ device: req.body.device }, SECRET, { expiresIn: 86400 }));
});

var httpServer= require("http").createServer(app);
httpServer.listen(3000, function() { console.log("START TOKEN GENERATOR"); });