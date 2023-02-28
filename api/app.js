const port = 3000;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');


const indexRouter = require('./routes/index');
//const usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog");

const ajaxUpdater = require("./routes/index");

const cors = require('cors');


//this could be a secuirty problem. Add a user with read only permission
    //to the database, setup a password, and store the connect string in a
    //separate and protected file.
mongoose.connect("mongodb://127.0.0.1:27017/test1",
{
	useNewUrlParser: true,
	useUnifiedTopology: true
	
}).then(() => {
	console.log('connected to db');
  const db = mongoose.connection;
}).catch((error) => {
	console.log('problem found', error);
});
    



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use('/css', express.static(__dirname + '/views/src'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use("/catalog", catalogRouter);
app.use("/index", ajaxUpdater);


//var espData = "";
var machine_id = "";
var current = "";
var count = "";

app.route("/ESPdata").get(function(req,res){
	res.json({
	"machine_id": machine_id,
		"current": current,
		"count": count
	});
});

app.route("/data")
.get(function(req, res){
	res.render("data");
	
//manual page refresh	
//res.render("data",{quote: espData});
})
.post(function(req,res){
  machine_id = req.body.machine_id;
	current = req.body.current;
	count = req.body.count;
	//returns a response to the sender. Improves ESP send rate. 
  res.send({response:"JSON Received"});
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(port, () => {
	console.log("Serving on port 3000")
})
