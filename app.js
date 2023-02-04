const port = 3000;

var express = require('express'),
    app = express(),
    server = require('http').createServer(app);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
   extended: true;
}));

app.use(bodyParser.json());

app.post('/',function(req,res){
   var html = 'Hello:' + "From Intellaundry";
   res.send(html);
   console.log(html);
});

server.listen(port);