const port = 3000;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var server = require('http').createServer(app);
var bodyParser = require('body-parser');

const indexRouter = require('./routes/index');
//const usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog");

const ajaxUpdater = require("./routes/index");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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

app.route("/data")
.get(function(req, res){
	res.render("data",{
	machine_id: machine_id,
		current: current,
		count: count
	});
	
//manual page refresh	
//res.render("data",{quote: espData});
})
.post(function(req,res){
  machine_id = req.body.machine_id;
	current = req.body.current;
	count = req.body.count;
	//returns a response to the sender. 
  //res.send({response:req.body.quote});
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
