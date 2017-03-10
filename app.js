
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes/index')
  , user = require('./routes/user')
  , stores = require('./routes/stores')
  , deals = require('./routes/deals')
  , subscriptions = require('./routes/subscriptions')
  // *** demo end-points ***
  , demoStores = require('./routes/demoStores')
  , demoDeals = require('./routes/demoDeals')
  , demoSubscriptions = require('./routes/demoSubscriptions')
  , demoSubscribe = require('./routes/demoSubscribe')
  , subscribe = require('./routes/subscribe')
  // *** demo end-points ***
  , devices = require('./routes/devices')
  , demoDevices = require('./routes/demoDevices')
  , analytics_buzz_popularity = require('./routes/analytics_buzz_popularity')
  , analytics_user_location = require('./routes/analytics_user_location')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  , multer  = require('multer')
  , timeout = require('connect-timeout')
  , request=require('request');
  
  
//var upload = multer({ dest: './uploads/',limits: { fileSize: maxSize } }) ;
  
//add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');  

var app = express();
app.use(timeout('60s'));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');

    next();
};

//since logger only returns a UTC version of date, I'm defining my own date format - using an internal module from console-stamp
/*express.logger.format('mydate', function() {
    var df = require('console-stamp/node_modules/dateformat');
    return df(new Date(), 'HH:MM:ss.l');
});*/

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + 'views');
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.limit('50mb'));
app.use(bodyParser.urlencoded({ limit: '50MB',extended: false })) ;
app.use(haltOnTimedout);
// parse application/json 
app.use(bodyParser.json()) ;
app.use(haltOnTimedout);


app.use(methodOverride());
app.use(haltOnTimedout);
// app.use(app.router); // No longer required in Express 4.x
app.use(express.static(path.join(__dirname, 'public')));
app.use(haltOnTimedout);
// to allow references to AWS / localhost
app.use(allowCrossDomain);
app.use(haltOnTimedout);
//app.use(express.logger('[:mydate] :method :url :status :res[content-length] - :remote-addr - :response-time ms'));
app.use(logger('combined'));
app.use(haltOnTimedout);
//app.use(multer({dest:'./uploads/'})) ;

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
  app.use(haltOnTimedout);
}

app.get('/', routes);
app.get('/user', user.list);

app.get('/analytics/:storeId', function(req, res) {
	var storeId = req.params.storeId ;
    res.render('pages/analytics', { storeId: storeId });
});


app.get('/analytics_buzz_popularity/v3/:storeId', analytics_buzz_popularity.getData);
app.get('/analytics_user_location/v3/:storeId', analytics_user_location.getData);

app.get('/stores', stores.findAllStores, stores.filterByLocation);
app.get('/stores/:email', stores.findByLoginEmail);
app.get('/stores/filterBySignupStatus/pending', stores.filterBySignupStatus);
//app.get('/deals', deals.findAllDeals);
app.get('/deals', deals.findAllDeals);
app.get('/deals/:id',deals.findDealsByCustomerId);
app.post('/deals/getOfferCode/:id',deals.createOfferCode);

app.get('/', function(req, res) {
  res.sendFile(__dirname + 'Analytics.html');
});


// POST method route
//app.post('/stores/:id',stores.updateProfilePicture,stores.updateBusinessInfo);
//app.post('/stores/:storeName',stores.updateProfilePicture,stores.updateBusinessInfo);
//app.post('/stores/:id',stores.updateBusinessInfo);

app.post('/stores/:id',stores.uploadStoreImage, stores.invalidateCloudFront, stores.updateBusinessInfo);
//app.post('/stores/:storeName',stores.updateOnlyBusinessInfo);
app.post('/updateStoreInfo/:id',stores.updateOnlyBusinessInfo);
//app.post('/createNewStore', stores.uploadStoreImage,stores.createNewStore,subscriptions.createNewSubscription) ;
app.post('/createNewStore', stores.uploadStoreImage,stores.createNewStore) ;
app.post('/approveStore/:id', stores.approveStore);

app.post('/createNewBuzzNoImage', deals.createNewDeal) ;
app.post('/createNewBuzzWithImage',deals.uploadDealImage, deals.dealImageURLUpdate) ;
app.post('/deals/editDeal/:id', deals.editDeal);
// accept one file where the name of the form field is named fileUpload
/*app.post('/upload', upload.fields([{name:'fileUpload',maxCount:1}]), function(req, res){
    //console.log("Request body is " + req.body) ;// form fields
    console.log("Request file is " + req.files['fileUpload'][0]) ;// form files
    res.status(204).end() ;
})
;

app.post('/uploadOne', upload.single('fileUpload'), function(req, res){
    //console.log("Request body is " + req.body) ;// form fields
    console.log("Request file is " + req.file) ;// form files
    res.status(204).end() ;
})
;*/
//app.delete('/deals/:id', deals.deleteDeal) ;
app.post('/deals/:id', deals.deleteDeal) ;

app.post('/devices', devices.registerNewDevice) ;
app.post('/merchantDevices', devices.registerNewMerchantDevice) ;

app.post('/subscribe',subscribe.enableSubscription);




//***** List of demo URL end-points : start *********
app.get('/demoStores', demoStores.findAllStores, demoStores.filterByLocation);
app.get('/demoStores/:email', demoStores.findByLoginEmail);
//app.get('/demoStores/:storeName', demoStores.findByStoreName);
app.get('/demoDeals', demoDeals.findAllDeals);
app.get('/demoDeals/:id',demoDeals.findDealsByCustomerId);
app.get('/demoGetSubscriptionStatus/:id',demoSubscriptions.getSubscriptionStatus);

app.post('/demoStores/:id',demoStores.uploadStoreImage, demoStores.invalidateCloudFront,demoStores.updateBusinessInfo);
app.post('/demoUpdateStoreInfo/:id',demoStores.updateOnlyBusinessInfo);
app.post('/approveDemoStore/:id', demoStores.approveDemoStore);


app.post('/democreateNewBuzzNoImage', demoDeals.createNewDeal) ;
app.post('/democreateNewBuzzWithImage',demoDeals.uploadDealImage, demoDeals.dealImageURLUpdate) ;
app.post('/demodeals/editDeal/:id', demoDeals.editDeal);

app.post('/demodeals/:id', demoDeals.deleteDeal) ;

app.post('/democreateNewStore', demoStores.uploadStoreImage,demoStores.createNewStore) ;

app.post('/demoSubscribe',demoSubscribe.enableSubscription);
app.post('/demoDevices', demoDevices.registerNewDevice) ;

//***** List of demo URL end-points : end *********

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
