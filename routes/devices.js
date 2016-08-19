var AWS = require('aws-sdk');
var snsClient = null ;

exports.registerNewDevice = function(req, res) {

	console.log("Registering Device with AWS SNS") ;
	
	console.log("Incoming request is") ;
	
	console.log(req.body);
	
	var json = req.body;
	
	console.log("Device type is:" + json.deviceType) ;
	console.log("Registration ID is:" + json.registrationID) ;
	console.log("User Location is:" + json.userLocation) ;
	
	// Invoke AWS SNS call to create platform endpoint
	// switch to either use local file or AWS credentials depending on where the program is running
	if(process.env.RUN_LOCAL=="TRUE") {
		console.log("Loading local config credentials for accessing AWS");
		AWS.config.loadFromPath('./config.json');
	}
	else {
		console.log("Running on AWS platform. Using EC2 Metadata credentials.");
		AWS.config.credentials = new AWS.EC2MetadataCredentials({
			  httpOptions: { timeout: 10000 } // 10 second timeout
		}); 
		AWS.config.region = "us-west-2" ;
	}

	console.log("Credentials retrieval successful") ;
	// Create an SNS client
	console.log("Creating SNS Client") ;
	if(snsClient == null) {
		console.log("SNS is null, creating new connection") ;
		snsClient = new AWS.SNS() ;
	}
	console.log("SNS Client creation successful") ;

	var platformAppARN = "" ;
	if(json.deviceType=="iOS") {
		platformAppARN = 'arn:aws:sns:us-west-2:861942316283:app/APNS_SANDBOX/LocalLink-iOS-Dev' ;
	}
	else if(json.deviceType=="Android") {
		platformAppARN = 'arn:aws:sns:us-west-2:861942316283:app/GCM/LocalLink_GCM' ;
	}
	var params = {
		PlatformApplicationArn: platformAppARN, /* required */
		Token: json.registrationID , /* required */
		CustomUserData: json.userLocation
	};
	var endPointARN = '' ;
	snsClient.createPlatformEndpoint(params, function(err, data) {
		if (err) {
			console.log("Error creating endpoint, checking if endpoint is already registered with same token") ;
			console.log(err, err.stack); // an error occurred
			
			var pattern1 = new RegExp(".*Endpoint (arn:aws:sns[^ ]+) already exists with the same Token.*"); // retrieve the end-point ARN already present 
			var result = pattern1.test(err.message) ;
			if(result) {
				var pattern2 = new RegExp("arn:aws:sns[^ ]+");
				console.log("Endpoint is already registered with same token") ;
				endPointARN = pattern2.exec(err.message) ;
				console.log(endPointARN);
			}
			else {
				console.log("Endpoint creation Failed") ;
				res.status(500).send('{"success":false,"msg":"Endpoint creation Failed"}') ;
			}
			
		} else {
			console.log("Device registered successfully") ;
			console.log(data);           // successful response
			endPointARN = data.EndpointArn  ;
			//res.status(200).send('{"success":true,"msg":"Device Registered Successfully"}') ;
			xhr = new XMLHttpRequest();
			var url = "http://api.geonames.org/findNearbyPostalCodesJSON?postalcode="+json.userLocation+"&country=US&radius=30&maxRows=500&username=1234_5678";
			xhr.open("GET", url, true);
			//xhr.setRequestHeader("Content-type", "application/json");
			xhr.onreadystatechange = function () { 
				if (xhr.readyState == 4 && xhr.status == 200) {
					var jsonArea = JSON.parse(xhr.responseText);
					console.log(jsonArea.success + ", " + jsonArea.msg) ;
				}
			}
			
			
			  
			
	  
			/*if(json.userLocation=="60540"){
			 topicArn = 'arn:aws:sns:us-west-2:861942316283:LocalBuzzNaperville';
			}
			else {
				topicArn = 'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification';
			}*/
			
		}
	});
	
	
	
	
	
};	

