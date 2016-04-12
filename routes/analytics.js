
var google = require('googleapis');





exports.getData = function(req, res){
	var storeId = req.params.storeId ;
	console.log("Store ID is: " + storeId) ;
	var accessToken;
	
	// Authenticating with JSON Web Token
	console.log("Initializing Service Account Private Key") ;
	
	// switch to either use local file or AWS credentials depending on where the program is running
	if(process.env.RUN_LOCAL=="TRUE") {
		console.log("Loading private key from local drive");
		var key = require('H:/Credentials/LocalBuzz-ServiceAccountKey.json');
	}
	else {
		console.log("Running on AWS platform. Loading private key file from AWS Server.");
		var key = require('/tmp/.LocalBuzz-ServiceAccountKey.json');
	}

	
	var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, [ 'https://www.googleapis.com/auth/analytics.readonly' ], null);
	
	jwtClient.authorize(function(err, tokens) {
		if (err) {
			console.log(err);
			return;
		}
		else{
			accessToken = tokens.access_token;
		}
		
		console.log("Authorization successful, now calling Analytics API") ;
		console.log("Access Token is: " + accessToken) ;
		
		
		var params = {
			metrics: 'ga:sessions',
			dimensions: 'ga:EventCategory,ga:EventAction',
			'start-date': '70daysAgo',
			'end-date': '65daysAgo',
			ids: 'ga:114481127',
			filters:'ga:EventLabel==' + storeId,
			auth: jwtClient 
		};
		
		var analytics = google.analytics('v3');
		
		analytics.data.ga.get(params, function(err, resp) {
			if (err) {
				console.log(err);
				return;
			}
			
			//console.log(JSON.stringify(resp)) ;
			//return;
			res.setHeader('Content-Type', 'application/json');
			res.status(200).send(JSON.stringify(resp, null, 3));
		});
		
		
	});
};