var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var snsClient = null ;
var request = require('request');
var simpleDB = null ;
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
	
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	
	console.log("SDB Client creation successful") ;
	
	
	
   /*  createPlatformEndpoint */
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
	snsClient.createPlatformEndpoint(params, function(err, data) 
	{
		if (err) 
		{
		
			console.log("Error creating endpoint, checking if endpoint is already registered with same token") ;
			console.log(err, err.stack); // an error occurred
			
			var pattern1 = new RegExp(".*Endpoint (arn:aws:sns[^ ]+) already exists with the same Token.*"); // retrieve the end-point ARN already present 
			var result = pattern1.test(err.message) ;
			if(result) 
			{
				var pattern2 = new RegExp("arn:aws:sns[^ ]+");
				console.log("Endpoint is already registered with same token") ;
				endPointARN = pattern2.exec(err.message) ;
				console.log(endPointARN);
			}
			else 
			{
				console.log("Endpoint creation Failed") ;
				res.status(500).send('{"success":false,"msg":"Endpoint creation Failed"}') ;
			}
			
		} 
		else
		{
			console.log("Device registered successfully") ;
			console.log(data);           // successful response
			endPointARN = data.EndpointArn  ;
			var listOfTopics = [];
			
			/* List All Topics to get the list of cities that are registered with Local Buzz */
			snsClient.listTopics(params1={}, function(err, dataListTopics)
			{
				if (err) console.log(err, err.stack); // an error occurred
				else  
				{
					console.log(dataListTopics);           // successful response
					//var parseList  = JSON.parse(data);
					var i=0;
					while(dataListTopics.Topics[i]){
						listOfTopics.push(dataListTopics.Topics[i].TopicArn);
						i++;
						//If the list of topics is more than 100,use Next token
					}
				//}
			//});
					/*At this point,we have the endpointARN,query the SDB table to get the associated subscriptions*/
					
					
					/* Get current list of active subscriptions for the endpoint and unsubscribe them*/
					
					var	params2 = 
					{
						SelectExpression: 'select SubscriptionARN from EndpointARNs where EndpointARN = ' + '"' + endPointARN + '"', /* required */
						ConsistentRead: true
						//NextToken: 'STRING_VALUE'
					};
		

		
					console.log("Now retrieving data set from SDB") ;
					simpleDB.select(params2, function(err, dataSDB) {
						if (err) {
							console.log("ERROR calling AWS Simple DB!!!") ;
							console.log(err, err.stack); // an error occurred
						}
						else     
						{
							console.log("SUCCESS from AWS!") ;
							var items = dataSDB["Items"];
							//console.log(dataSDB);
							if(items)
							{
								for(var k=0; k < items.length;k++) {
									var item = items[k] ;	
									console.log(item) ;				
									var attributes = item["Attributes"] ;
									var attr = attributes[0] ; // we are only getting the SubscriptionARN
									var attrName = attr["Name"] ;  // SubscriptionARN
									var attrValue = attr["Value"] ; // value of the SubscriptionARN to pass to unsubscribe call
									
									console.log('SubscriptionARN to unsubscribe is : '+ attrValue);
									var params3 = {
									  SubscriptionArn: attrValue /* required */
									};
									snsClient.unsubscribe(params3, function(err, dataUnsubscribe) {
										if (err) {
											console.log(err, err.stack); // an error occurred
											//res.status(500).send('{"success":false,"msg":"Suscription to Topic Failed"}') ;
											
										}	
										else {
											//console.log(dataUnsubscribe);           // successful response
											//res.status(200).send('{"success":true,"msg":"Subscribed to Topic Successfully"}') ;
										}
										
									});
									
								}
							}
						}
					});
					
				/* Find the list of cities within 30 miles of the user */
					request("http://api.geonames.org/findNearbyPostalCodesJSON?postalcode=60504&country=US&radius=30&maxRows=500&username=1234_5678", 
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
							
								var jsonArea = JSON.parse(body); // Show the HTML for the Google homepage.
							
								for(var m=0;m<500;m++){
								  if(jsonArea.postalCodes[m]){
								 // console.log(jsonArea.postalCodes[i].placeName);
								  topicArn = 'arn:aws:sns:us-west-2:861942316283:LocalBuzz'+ jsonArea.postalCodes[m].placeName + 
								  jsonArea.postalCodes[m].adminCode1;
								  //console.log("Endpoint ARN is: " + endPointARN) ;
								  
								  
								  /* Subscribe the user to the cities that are registered with Local Buzz */
								   for(var n=0;n< listOfTopics.length ;n++)
									{
										if( topicArn == listOfTopics[n])
										{
											var params = {
											Protocol: 'application', /* required */
											TopicArn: topicArn,//'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification', /* required */
											Endpoint: data.EndpointArn
										 };
										//console.log('Subscribing to: ' + 'LocalBuzz'+ jsonArea.postalCodes[i].placeName + jsonArea.postalCodes[i].adminCode1) ;
											snsClient.subscribe(params, function(err, dataSubscribe)
											{
												if (err) {
													console.log(err, err.stack); // an error occurred
													//res.status(500).send('{"success":false,"msg":"Suscription to Topic Failed"}') ;
													
												}	
												else 
												{
													console.log('Subscription ARN is : ' + dataSubscribe.SubscriptionArn);           // successful response
													//res.status(200).send('{"success":true,"msg":"Subscribed to Topic Successfully"}') ;
													/* Insert the endpoint and subscription into the SDB table ***/
													var uuid1 = uuid.v1();
													console.log("Generated uuid for itemName " + uuid1) ;
													var params1 = {
													  Attributes: [ /* required */
														{
														  Name: 'EndpointARN', /* required */
														  Value: endPointARN, /* required */
														  Replace: false
														},
														{
														  Name: 'SubscriptionARN', /* required */
														  Value: dataSubscribe.SubscriptionArn, /* required */
														  Replace: false
														}
													],
													  DomainName: 'EndpointARNs', /* required */
													  ItemName: uuid1, /* required */
													  Expected: {
														Exists: false,
														Name: 'EndpointARN',
														
													  }
													};
							
													console.log("Now inserting new row into EndpointARNs domain") ;
													simpleDB.putAttributes(params1, function(err, dataInsertSDB) 
													{
														if (err) {
															console.log("Error inserting record") ;
															console.log(err, err.stack); // an error occurred
															//res.status(500).send('{ "success": false, "msg": "Error adding buzz: "' + err + "}") ;
														}
														else  
														{
															console.log("Record inserted successfully") ;
															console.log(dataInsertSDB);           // successful response

															
															
															
															
														}
													});
												/**************************************************************************/
												
												}
										
											});
											
										}
										
									}
							  
								}
						  
							}
							
						}
						  
					});
	
			
				}
			});
		}
		
	});
	res.status(200).send('{"success":true,"msg":"Subscribed to Topic Successfully"}') ;
};	

