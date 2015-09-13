
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , stores = require('./routes/stores')
  , deals = require('./routes/deals')
  , http = require('http')
  , path = require('path');
  
//add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');  

var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');

    next();
};

//since logger only returns a UTC version of date, I'm defining my own date format - using an internal module from console-stamp
express.logger.format('mydate', function() {
    var df = require('console-stamp/node_modules/dateformat');
    return df(new Date(), 'HH:MM:ss.l');
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// to allow references to AWS / localhost
app.use(allowCrossDomain);
app.use(express.logger('[:mydate] :method :url :status :res[content-length] - :remote-addr - :response-time ms'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/stores', stores.findAllStores);
app.get('/stores/:storeName', stores.findByStoreName);
app.get('/deals', deals.findAllDeals);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
