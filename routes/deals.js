var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Deal = require("./deal");
var multer = require( 'multer' );
var s3 = require( 'multer-storage-s3' );
var swearjar = require('swearjar');
var cc = require('coupon-code');


var upload = multer({ dest: 'uploads/' }) ;

var dealsList = [] ;
var simpleDB = null ;
var s3Client = null ;
var snsClient = null ;

var dealURL = null;


exports.findAllDeals = function(req, res) {
	//console.log("GET STORES") ;
	var today = new Date();
	/*var dateString = datetime.toString();
	var date = datetime.getDate();
	var month = datetime.getMonth()+ 1;
	var year = datetime.getFullYear();
	var dateFormat = "'" + month + "/" + date + "/" + year + "'";
	
	
	console.log(datetime.toLocaleString());
	*/
	
	dealsList=[];
	
	console.log('Query is ' + req.query.customerId);

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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	
	// Split the customer id
	if(req.query.customerId){
		var customerIdList = req.query.customerId.split(",") ;
		var customerIdStr = "" ;
		for (i = 0; i < customerIdList.length; i++) {
			if(i != customerIdList.length -1) 
				customerIdStr += "'" + customerIdList[i] + "',";
			else
				customerIdStr += "'" + customerIdList[i] + "'";
		}
		console.log("Customer ID list is: " + customerIdStr) ;
	}
	
	console.log("SDB Client creation successful") ;
	var	params;
	if(req.query.customerId){
		var customerId = req.query.customerId;
		params = {
		SelectExpression: "select * from MyDeals where DealStatus ='Active' and customerId in (" + customerIdStr + ") and DealEndDate is not null order by DealEndDate", /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	}
	else {
		params = {
		SelectExpression: 'select * from MyDeals where DealStatus ="Active" and DealEndDate is not null order by DealEndDate', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	}
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
	var cb = req.query.callback;	
	console.log("Callback URL is " + cb) ;

	//var customerId = req.query.customerId;	
	//console.log("Customer ID is " + customerId) ;

	//res.send("End of deals") ;
	
	console.log("Now retrieving data set from SDB") ;
	simpleDB.select(params, function(err, data) {
	
	
		if (err) {
			console.log("ERROR calling AWS Simple DB!!!") ;
			console.log(err, err.stack); // an error occurred
		}
		else     {
			console.log("SUCCESS from AWS!") ;
			//console.log(JSON.stringify(data));           // successful response
			console.log("Objects in the AWS data element:" ) ;
			for(var name in data) {
				console.log(name) ;
			}
			console.log("Now accessing Items element") ;
			var items = data["Items"] ;
			//console.log(items) ;
			
			
			if(items){
				var j=0 ;
				for(var i=0; i < items.length; i++) {
					var item = items[i] ;	
					//console.log(item) ;
					var itemName = item["Name"] ;
					//console.log("ItemName is " + itemName) ;
					var attributes = item["Attributes"] ;
					
					var tempDeal = new Deal(itemName, attributes) ;
					if(tempDeal.dealStatus == "Expired") {
						console.log("Expired buzz found:" + tempDeal.dealName) ;
						console.log("Updating its status in AWS SDB so that it does not show up next time") ;
						
						var deleteParams = {
							DomainName: 'MyDeals', /* required */
							ItemName: tempDeal.itemName, /* required */
						};
						simpleDB.deleteAttributes(deleteParams, function(err, data) {
							if (err) {
								console.log("Error deleting expired buzz") ;
								console.log(err, err.stack); // an error occurred
							} else {
								console.log("Buzz deleted successfully") ;
								console.log(data); // successful response
							}								
						});
						
						continue ;
					}
					else { // active buzz found. Add it to he return value
 						dealsList[j] = tempDeal ;
						j++ ;
					}
				}
			}
			
		}
		
		console.log("Deals List is: " + dealsList);
		var dealsJsonOutput = JSON.stringify(dealsList) ;
	    
		
		if(cb) {
			res.send( cb + "(" + dealsJsonOutput + ");" );
		}
		else {
			res.send(dealsJsonOutput) ;
		}
	});
	
			
};

exports.findDealsByCustomerId = function(req, res) {
	//console.log("GET STORES") ;
	var today = new Date();
	/*var dateString = datetime.toString();
	var date = datetime.getDate();
	var month = datetime.getMonth()+ 1;
	var year = datetime.getFullYear();
	var dateFormat = "'" + month +  "/" + date + "/" + year + "'";
	
	
	console.log(datetime.toLocaleString());
	*/
	
	var dealsList=[];

	// switch to either use local file or AWS credentials depending on where the program is running
	var customerId = req.params.id;
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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	
	console.log("SDB Client creation successful") ;
	
	
	var	params = {
		SelectExpression: 'select * from MyDeals where DealStatus ="Active" and customerId ="'+ customerId+'"intersection DealEndDate is not null order by DealEndDate', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
	var cb = req.query.callback;	
	console.log("Callback URL is " + cb) ;

	//var customerId = req.query.customerId;	
	//console.log("Customer ID is " + customerId) ;

	//res.send("End of deals") ;
	
	console.log("Now retrieving data set from SDB") ;
	simpleDB.select(params, function(err, data) {
	
	
		if (err) {
			console.log("ERROR calling AWS Simple DB!!!") ;
			console.log(err, err.stack); // an error occurred
		}
		else     {
			console.log("SUCCESS from AWS!") ;
			//console.log(JSON.stringify(data));           // successful response
			console.log("Objects in the AWS data element:" ) ;
			for(var name in data) {
				console.log(name) ;
			}
			console.log("Now accessing Items element") ;
			var items = data["Items"] ;
			//console.log(items) ;
			
			
			if(items){
				var j=0 ;
				for(var i=0; i < items.length; i++) {
					var item = items[i] ;	
					//console.log(item) ;
					var itemName = item["Name"] ;
					//console.log("ItemName is " + itemName) ;
					var attributes = item["Attributes"] ;
					
					var tempDeal = new Deal(itemName, attributes) ;
					if(tempDeal.dealStatus == "Expired") {
						console.log("Expired buzz found:" + tempDeal.dealName) ;
						console.log("Updating its status in AWS SDB so that it does not show up next time") ;
						
						var deleteParams = {
							DomainName: 'MyDeals', /* required */
							ItemName: tempDeal.itemName, /* required */
						};
						simpleDB.deleteAttributes(deleteParams, function(err, data) {
							if (err) {
								console.log("Error deleting expired buzz") ;
								console.log(err, err.stack); // an error occurred
							} else {
								console.log("Buzz deleted successfully") ;
								console.log(data); // successful response
							}								
						});
						
						continue ;
					}
					else { // active buzz found. Add it to he return value
 						dealsList[j] = tempDeal ;
						j++ ;
					}
				}
			}
			
		}
		
		console.log("Deals List is: " + dealsList);
		var dealsJsonOutput = JSON.stringify(dealsList) ;
	    
		
		if(cb) {
			res.send( cb + "(" + dealsJsonOutput + ");" );
		}
		else {
			res.send(dealsJsonOutput) ;
		}
	});
	
			
};

exports.createNewDeal = function(req, res) {

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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	console.log("SDB Client creation successful") ;
	
	var uuid1 = uuid.v1();
	console.log("Generated uuid for itemName " + uuid1) ;
	var dealType = "Announcement";
	
	//var dealURL = "http://appsonmobile.com/locallink/deals/" + req.file.path ;
	if(req.body.DealType)
	dealType = req.body.DealType;
	
	
	//check for profanity to ensure that offensive content is rejected
	if(swearjar.profane(req.body.DealName)==true || swearjar.profane(req.body.DealDescription)==true) {
		console.log("Offensive words found in Deal Name or Description: " + req.body.DealName + " or " + req.body.DealDescription) ;
		res.send('{"msg":"Content rejected due to inappropriate words and violation of usage terms"}') ;
	}
	else {

		var params = {
		  Attributes: [ /* required */
			{
			  Name: 'DealStatus', /* required */
			  Value: req.body.DealStatus, /* required */
			  Replace: false
			},
			{
			  Name: 'DealType', /* required */
			  Value: dealType, /* required */
			  Replace: false
			},
			{
			  Name: 'DealStartDate', /* required */
			  Value: req.body.DealStartDate, /* required */
			  Replace: false
			},
			{
			  Name: 'DealPictureURL', /* required */
			  Value: req.body.DealPictureURL, /* required */
			  Replace: false
			},
			{
			  Name: 'DealName', /* required */
			  Value: req.body.DealName, /* required */
			  Replace: false
			},
			{
			  Name: 'DealEndDate', /* required */
			  Value: req.body.DealEndDate, /* required */
			  Replace: false
			},
			{
			  Name: 'customerId', /* required */
			  Value: req.body.customerId, /* required */
			  Replace: false
			},
			{
			  Name: 'businessName', /* required */
			  Value: req.body.businessName, /* required */
			  Replace: false
			},
			{
			  Name: 'DealDescription', /* required */
			  Value: req.body.DealDescription, /* required */
			  Replace: false
			},
			{
			  Name: 'DealImageURL', /* required */
			  Value: req.body.DealImageURL, /* required */
			  Replace: false
			},
			{
			  Name: 'city', /* required */
			  Value: req.body.city, /* required */
			  Replace: false
			},
			{
			  Name: 'state', /* required */
			  Value: req.body.state, /* required */
			  Replace: false
			}
			
		],
		  DomainName: 'MyDeals', /* required */
		  ItemName: uuid1, /* required */
		  Expected: {
			Exists: false,
			Name: 'DealName'
		  }
		};
		
		console.log("Now inserting new row into MyDeals domain") ;
		simpleDB.putAttributes(params, function(err, data) {
			if (err) {
				console.log("Error inserting record") ;
				console.log(err, err.stack); // an error occurred
				res.send('{"msg": "Error adding buzz. Please try again"}') ;
			}
			else  {
				console.log("Record inserted successfully") ;
				console.log(data);           // successful response

				// Create an SNS client
				console.log("Creating SNS Client to notify customers about the new buzz") ;
				if(snsClient == null) {
					console.log("SNS is null, creating new connection") ;
					snsClient = new AWS.SNS() ;
				}
				console.log("SNS Client creation successful") ;
				
				
				var message = {
					"default": "New buzz from "+ req.body.businessName +" : " + req.body.DealName,
					"APNS_SANDBOX":"{\"aps\":{\"alert\":\"New buzz from " + req.body.businessName + " : " + req.body.DealName + "\"}}", 
					"GCM": "{ \"data\": { \"message\": \"New buzz from "  + req.body.businessName + " : " + req.body.DealName + "\"} }"
				};
				var cityName = (req.body.city).toString();
				console.log('Place Name is ' + cityName); 
				var tmpArray = [];
				var city ;
				var stateName = (req.body.state).toString();
				console.log('Place Name is ' + stateName); 
				var state ;
				var regexp = /[a-zA-Z]+\s+[a-zA-Z]+/g;
				if (regexp.test(cityName)) {
					// at least 2 words consisting of letters
					tmpArray = cityName.split(' ');
					city = tmpArray[0]+tmpArray[1];
					
				}
				else
				city=cityName;
				
				if (regexp.test(stateName)) {
					// at least 2 words consisting of letters
					tmpArray = stateName.split(' ');
					state = tmpArray[0]+tmpArray[1];
					
				}
				else
				state = stateName;
				var place = city + state ;
				console.log('City Name is ' + city); 
				console.log('State Name is ' + state); 
				console.log('Place Name is ' + place); 
				 
				
				var topicName = 'LocalBuzz' + place ;
				var topicArn = 'arn:aws:sns:us-west-2:861942316283:' + topicName ;
				//var topicArn= 'arn:aws:sns:us-west-2:861942316283:LocalBuzz'+(req.body.city).toString() + (req.body.state).toString() ;
				
				var params = {
					Message: JSON.stringify(message),
					Subject: 'New Buzz from ' +  req.body.businessName,
					MessageStructure: 'json',
					//TargetArn: 'TopicArn',
					//TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification'
					TopicArn: topicArn
				};
				snsClient.publish(params, function(err, data) {
					if (err) {
						console.log("Error sending notification on buzz") ;
						console.log(err, err.stack); // an error occurred
					}				
					else {
						console.log("Notification sent to topic subscribers") ;
						console.log(data);           // successful response
					}
				});
				
				
				res.status(200).send('{"success":true,"msg":"Buzz created!"}') ;
				
				
				
			}
		});
	}
};

exports.editDeal = function(req, res) {

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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	console.log("SDB Client creation successful") ;

	var params = {
	  Attributes: [ /* required */
	    {
		  Name: 'DealName', /* required */
		  Value: req.body.DealName, /* required */
		  Replace: false
		},
	   {
		  Name: 'DealStatus', /* required */
		  Value: req.body.DealStatus, /* required */
		  Replace: true
		},
		
		{
		  Name: 'DealDescription', /* required */
		  Value: req.body.DealDescription, /* required */
		  Replace: true
		},
		{
		  Name: 'DealStartDate', /* required */
		  Value: req.body.DealStartDate, /* required */
		  Replace: true
		},
		{
		  Name: 'DealEndDate', /* required */
		  Value: req.body.DealEndDate, /* required */
		  Replace: true
		},
		{
		  Name: 'customerId', /* required */
		  Value: req.body.customerId, /* required */
		  Replace: false
		},
		{
		  Name: 'businessName', /* required */
		  Value: req.body.businessName, /* required */
		  Replace: false
		},
		{
		  Name: 'DealImageURL', /* required */
		  Value: req.body.DealImageURL, /* required */
		  Replace: false
		}
	],
	  DomainName: 'MyDeals', /* required */
	  ItemName: req.params.id, /* required */
	  Expected: {
		Exists: true,
		Name: 'DealName',
		Value: req.body.DealName
		
	  }
	  
	 
	};

	console.log("Now updating Business Info in MyCustomers domain") ;
	simpleDB.putAttributes(params, function(err, data) {
		if (err) {
			console.log("Error updating record") ;
			console.log(err, err.stack); // an error occurred
			res.send('{"msg": "Error updating record. Please try again"}') ;
		}
		else  {
			console.log("Record updated successfully") ;
			console.log(data);           // successful response
			res.status(200).send('{ "success": true, "msg": "Buzz updated successfully" }') ;
		}
	});
	
	
};

exports.deleteDeal = function(req, res) {
	console.log("Deleting a buzz with uuid: " + req.params.id) ;
	
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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	

	console.log("SDB Client creation successful") ;
	
	//*** Get dealImageURL of the deal to delete, to first delete the deal from S3 
	
	var getParams = {
		DomainName: 'MyDeals', /* required */
		ItemName: req.params.id, /* required */
		AttributeNames: [
		'DealImageURL'
		/* more items */
		],
		ConsistentRead: true 
	};
	
	console.log("Now retrieving data set of deal to delete from SDB") ;
	simpleDB.getAttributes(getParams, function(err, data) {
		if (err) {
			console.log("ERROR calling AWS Simple DB!!!") ;
			console.log(err, err.stack); // an error occurred
		}
		else {
			console.log("SUCCESS from AWS!") ;
			console.log("JSON Stringify is: " + JSON.stringify(data));           // successful response
			console.log("Now accessing Items element") ;
			var attributes = data["Attributes"] ;
			console.log(attributes) ;
			
			if(attributes){
				// we know there is only one attribute in this array and it is DealImageURL
				attributes.forEach(function(listAttr, index){
					var attrName = listAttr["Name"] ;
					console.log("In for loop, attrName is " + attrName) ;
					var dealImageURL = listAttr["Value"] ;
					console.log("Deleting image from S3: " + dealImageURL) ;
					if(dealImageURL != "") {				
					
						console.log("Deal image URL is not empty") ;
						
						if(s3Client == null) {
							console.log("S3 Client is null, creating new S3 Client") ;
							s3Client = new AWS.S3() ;
						}

						// Extract deal image URL as the "Key" parameter
						var dealS3Key = dealImageURL.substring(dealImageURL.lastIndexOf("/")+1) ;
						console.log("Deal S3 Key is " + dealS3Key) ;
						
						var s3DeleteParams = {
							Bucket: 'images.appsonmobile.com/locallink/deals', /* required */
							Key: dealS3Key, /* required */
						};
						s3Client.deleteObject(s3DeleteParams, function(err, data) {
							if (err)  {
								console.log(err, err.stack); // an error occurred
								console.log("Error deleting S3 object"); 
							}							
							else     {
								console.log("Successfully deleted S3 deal image") ;
								console.log(data);           // successful response
							}
						});
						
					}
					else { // active buzz found. Add it to he return value
 						console.log("No S3 deal image to delete") ;
						
					}
					
					console.log("S3 deletion complete, now deleting SDB record") ;
	
					var params = {
					  DomainName: 'MyDeals', /* required */
					  ItemName: req.params.id /* required */
					  
					};
					
					console.log("Now deleting a row in MyDeals domain") ;
					var simpleDB2 = new AWS.SimpleDB() ;
					simpleDB2.deleteAttributes(params, function(err, data) {
						 
						if (err) {
							console.log("Error deleting Buzz") ;
							console.log(err, err.stack); // an error occurred
							res.send('{"msg": "Error deleting buzz. Please try again"}') ;
							/*res.status(500).send('<script type=\"text/javascript\"> alert( "Error deleting buzz:" + err );</script>');*/
						}
						else  {
							console.log("Buzz deleted successfully") ;
							console.log(data);           // successful response
							//res.status(201).send('"success": true, "msg": "Buzz deleted successfully"') ;
							res.status(200).send('{ "success": true, "msg": "Buzz Deleted" }') ;
							//res.status(200).send('<script type=\"text/javascript\"> alert("Buzz deleted successfully") ;</script>' ) ;
							
						}
					});

				});
			}
			
		}
	
	} ) ;
	

} ;


function makeid()
{
    var text = "";
    var possible = "ABCDEF0123456789";

    for( var i=0; i < 4; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.uploadDealImage = function(req, res, next) {
	
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
	
	
	
	
	//if(req.file) {
	
		console.log("Now uploading the file...") ;
		var storage_s3 = s3({
		destination : function( req, file, cb ) {
			cb( null, '' );
		},
		filename    : function( req, file, cb ) {
		    console.log('File mimetype is : ' + file.mimetype);
			cb( null, makeid() + '-' + file.fieldname + '-' + Date.now() + ".jpg" );
			//cb( null, req.params.id + '-' + Date.now() + ".jpg" );
		},
		bucket      : 'images.appsonmobile.com/locallink/deals',
		region      : 'us-west-2'
	});
	var maxSize = 50 * 1024 * 1024;
	var uploadMiddleware = multer({ storage: storage_s3,limits:{ fileSize: maxSize }}).single('fileUpload');
	console.log("Uploading file");
	
	// calling middleware function directly instead of allowing express to call, so we can do error handling. 
	uploadMiddleware(req, res, function(err) {
	
		
		
			console.log('File Size is:' + req.file);
			
				if(err) {
					console.log("Error uploading file" + err) ;
					//next() ;
					res.send('{"msg": "Error uploading file. Please try again"}') ;
				}
				else {
					
					//res.set('Content-Type', 'text/html');
					next() ;
					
					//res.status(200).send('{ "success": true, "msg": "http://appsonmobile.com/locallink/deals/fileUpload-1467781697704.jpg" }') ;
				}
			
			
		
	});
	/*}
	else{
	    console.log("Now uploading the file...checked no file") ;
		res.status(500).send('{"success": false, "msg": "No Image to upload"}') ;
	}*/
	
	
	
	
	
};

exports.dealImageURLUpdate = function(req, res) {

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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	console.log("SDB Client creation successful") ;

	//check for profanity to ensure that offensive content is rejected
	if(swearjar.profane(req.body.DealName)==true || swearjar.profane(req.body.DealDescription)==true) {
		console.log("Offensive words found in Deal Name or Description: " + req.body.DealName + " or " + req.body.DealDescription) ;
		res.send('{"msg":"Content rejected due to inappropriate words and violation of usage terms"}') ;
	}
	else {
		
		var uuid1 = uuid.v1();
		console.log("Generated uuid for itemName " + uuid1) ;
		
		
		var	dealURL = "http://images.appsonmobile.com/locallink/deals/" + req.file.path ;
		

		var params = {
		  Attributes: [ /* required */
			{
			  Name: 'DealStatus', /* required */
			  Value: req.body.DealStatus, /* required */
			  Replace: false
			},
			{
			  Name: 'DealStartDate', /* required */
			  Value: req.body.DealStartDate, /* required */
			  Replace: false
			},
			{
			  Name: 'DealPictureURL', /* required */
			  Value: req.body.DealPictureURL, /* required */
			  Replace: false
			},
			{
			  Name: 'DealName', /* required */
			  Value: req.body.DealName, /* required */
			  Replace: false
			},
			{
			  Name: 'DealEndDate', /* required */
			  Value: req.body.DealEndDate, /* required */
			  Replace: false
			},
			{
			  Name: 'customerId', /* required */
			  Value: req.body.customerId, /* required */
			  Replace: false
			},
			{
			  Name: 'businessName', /* required */
			  Value: req.body.businessName, /* required */
			  Replace: false
			},
			{
			  Name: 'DealDescription', /* required */
			  Value: req.body.DealDescription, /* required */
			  Replace: false
			},
			{
			  Name: 'DealImageURL', /* required */
			  Value: dealURL, /* required */
			  Replace: false
			},
			{
			  Name: 'city', /* required */
			  Value: req.body.city, /* required */
			  Replace: false
			},
			{
			  Name: 'state', /* required */
			  Value: req.body.state, /* required */
			  Replace: false
			}
		],
		  DomainName: 'MyDeals', /* required */
		  ItemName: uuid1, /* required */
		  Expected: {
			Exists: false,
			Name: 'DealName'
		  }
		};
		
		console.log("Now inserting new row into MyDeals domain") ;
		simpleDB.putAttributes(params, function(err, data) {
			if (err) {
				console.log("Error inserting record") ;
				console.log(err, err.stack); // an error occurred
				res.send('{"msg": "Error adding buzz. Please try again"}') ;
			}
			else  {
				console.log("Record inserted successfully") ;
				console.log(data);           // successful response

				// Create an SNS client
				console.log("Creating SNS Client to notify customers about the new buzz") ;
				if(snsClient == null) {
					console.log("SNS is null, creating new connection") ;
					snsClient = new AWS.SNS() ;
				}
				console.log("SNS Client creation successful") ;
				
				var cityName = (req.body.city).toString();
				var tmpArray = [];
				var city ;
				var stateName = (req.body.state).toString();
				var state ;
				var regexp = /[a-zA-Z]+\s+[a-zA-Z]+/g;
				if (regexp.test(cityName)) {
					// at least 2 words consisting of letters
					tmpArray = cityName.split(' ');
					city = tmpArray[0]+tmpArray[1];
					
				}
				else
				city=cityName;
				
				if (regexp.test(stateName)) {
					// at least 2 words consisting of letters
					tmpArray = stateName.split(' ');
					state = tmpArray[0]+tmpArray[1];
					
				}
				else
				state = stateName;
				var place = city + state ;
				console.log(place); 
				 
				
				var topicName = 'LocalBuzz' + place ;
				var topicArn = 'arn:aws:sns:us-west-2:861942316283:' + topicName ;
				
				//var topicArn= 'arn:aws:sns:us-west-2:861942316283:LocalBuzz'+(req.body.city).toString() + (req.body.state).toString() ;
				
				
				
				var message = {
					"default": "New buzz from "+ req.body.businessName +" : " + req.body.DealName,
					"APNS_SANDBOX":"{\"aps\":{\"alert\":\"New buzz from " + req.body.businessName + " : " + req.body.DealName + "\"}}", 
					"GCM": "{ \"data\": { \"message\": \"New buzz from "  + req.body.businessName + " : " + req.body.DealName + "\"} }"
				};
				
				var params = {
					Message: JSON.stringify(message),
					Subject: 'New Buzz from ' +  req.body.businessName,
					MessageAttributes: {
						businessName: {
							DataType: 'String', /* required */
							StringValue: req.body.businessName
						}
					},
					MessageStructure: 'json',
					//TargetArn: 'TopicArn',
					//TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification'
					//TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalBuzzGeoFencing'
					TopicArn: topicArn
				};
				snsClient.publish(params, function(err, data) {
					if (err) {
						console.log("Error sending notification on buzz") ;
						console.log(err, err.stack); // an error occurred
					}				
					else {
						console.log("Notification sent to topic subscribers") ;
						console.log(data);           // successful response
					}
				});
				
				
				res.status(200).send('{"success":true,"msg":"Buzz created!"}') ;
				
				
				
			}
		});
	}
};

exports.createOfferCode = function(req, res) {

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
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	console.log("SDB Client creation successful") ;
	
	var code_test = cc.generate();
	var code = code_test.toString();
	
	console.log("Generated offer code   " + code) ;
	var date = (new Date()).toString();
	
	var params = {
		  Attributes: [ /* required */
			
			
			{
			  Name: 'CouponCode', /* required */
			  Value: code, /* required */
			  Replace: true
			},
			{
			  Name: 'TimeStamp', /* required */
			  Value: date, /* required */
			  Replace: true
			},
			{
		      Name: 'CustomerId',
			  Value: req.body.CustomerId,
			  Replace: true
			  
			},
			{
		      Name: 'Status',
			  Value: 'Pending',
			  Replace: true
			  
			},
			{
		      Name: 'dealItemName',
			  Value: req.params.id,
			  Replace: true
			  
			},
			{
		      Name: 'deviceId',
			  Value: req.body.deviceId,
			  Replace: false
			  
			}
			
		],
		  DomainName: 'CouponCodesForLocalBuzz', /* required */
		  ItemName: req.body.deviceId,
		   Expected: {
			Exists: false,
			Name: 'deviceId'
			
			
		  }
		  
		};
		
		console.log("Now inserting new row into MyDeals domain") ;
		simpleDB.putAttributes(params, function(err, data) {
			if (err) {
				console.log("Error inserting record") ;
				console.log(err, err.stack); // an error occurred
				//res.send('{"msg": "Error! Please try again","err":"'+err+'"}') ;
				res.send('{"success":false,"msg":"'+err.toString().split(" ").splice(0,1)+'"}');
			}
			else  {
				
				if(snsClient == null) {
					console.log("SNS is null, creating new connection") ;
					snsClient = new AWS.SNS() ;
				}
				console.log("SNS Client creation successful") ;
				
				var topicArn = req.body.topicArn ;
				console.log(topicArn);
				
				//var topicArn= 'arn:aws:sns:us-west-2:861942316283:LocalBuzz'+(req.body.city).toString() + (req.body.state).toString() ;
				
				
				
				var message = {
					"default": "New redeem request for : "+ req.body.dealName,
					"APNS_SANDBOX":"{\"aps\":{\"alert\":\"New redeem request for :  "+ req.body.dealName + "\"}}", 
					"GCM": "{ \"data\": { \"message\": \"New redeem request for :  " + req.body.dealName + "\"} }"
				};
				
				var params = {
					Message: JSON.stringify(message),
					Subject: 'New redeem request for '+ req.body.dealName,
					MessageAttributes: {
						dealName: {
							DataType: 'String', /* required */
							StringValue: req.body.dealName
						}
					},
					MessageStructure: 'json',
					//TargetArn: 'TopicArn',
					//TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification'
					//TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalBuzzGeoFencing'
					TopicArn: topicArn
				};
				snsClient.publish(params, function(err, data) {
					if (err) {
						console.log("Error sending notification on buzz") ;
						console.log(err, err.stack); // an error occurred
					}				
					else {
						console.log("Notification sent to topic subscribers") ;
						console.log(data);           // successful response
					}
				});
				
				
				
				res.status(200).send('{"success":"true","msg":"'+code_test+'<br>Show this code at the counter to redeem this offer"}') ;
				}
			});
				
				
				
			
	
};

