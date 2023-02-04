const port = 3000;

var express = require('express'),
    app = express(),
    server = require('http').createServer(app);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
   extended: true
}));

app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.send("Hello from INTELLAUNDRY")
})

app.post('/',function(req,res){
   var html = "You were able to post";
   res.send(html);
   console.log(html);
});

server.listen(port);
