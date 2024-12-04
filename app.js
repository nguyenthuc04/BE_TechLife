require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var usersRouter = require('./routes/userRouter');
var courseRouter = require('./routes/courseRouter');
var postRouter = require('./routes/postRouter');
var reelRouter = require('./routes/reelRouter');
var staffRouter = require('./routes/staffRouter');
var revenueRouter = require('./routes/revenueRouter');
var notificationRoute = require('./routes/notificationRouter');



var app = express();

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://nguyentrungthuc555:honest2004@cluster0.qkoy9qi.mongodb.net/api?retryWrites=true&w=majority&appName=Cluster0', {});

// Middleware để xử lý CORS
app.use(cors());

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Lỗi kết nối MongoDB:'));
db.once('open', function () {
    console.log('Đã kết nối thành công đến MongoDB!');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usersRouter);
app.use('/', courseRouter);
app.use('/', postRouter);
app.use('/', reelRouter)
app.use('/', staffRouter)
app.use('/', notificationRoute);
app.use('/', revenueRouter)


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
