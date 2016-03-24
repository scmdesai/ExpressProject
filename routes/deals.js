var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Deal = require("./deal");
var multer = require( 'multer' );
var s3 = require( 'multer-storage-s3' );


var upload = multer({ dest: 'uploads/' }) ;

var dealsList = [] ;
var simpleDB = null ;
var snsClient = null ;

exports.findAllDeals = function(req, res) {
	//console.log("GET STORES") ;
	var datetime = new Date();
	var dateString = datetime.toString();
	var date = datetime.getDate();
	var month = datetime.getMonth()+ 1;
	var year = datetime.getFullYear();
	var dateFormat = "'" + month + "/" + date + "/" + year + "'";
	
	
	
	
	
	dealsList=[];

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
		SelectExpression: 'select * from MyDeals where DealStatus ="Active" intersection DealEndDate is not null order by DealEndDate',//+  datetime + "\"", /* required */
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
			console.log(JSON.stringify(data));           // successful response
			console.log("Objects in the AWS data element:" ) ;
			for(var name in data) {
				console.log(name) ;
			}
			console.log("Now accessing Items element") ;
			var items = data["Items"] ;
			//console.log(items) ;
			
			if(items){
				for(var i=0; i < items.length; i++) {
					var item = items[i] ;	
					console.log(item) ;
					var itemName = item["Name"] ;
					console.log("ItemName is " + itemName) ;
					var attributes = item["Attributes"] ;
					dealsList[i] = new Deal(itemName, attributes) ;
			
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
	
	var dealURL = "http://appsonmobile.com/locallink/deals/" + req.file.path ;

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
		  Value: dealURL, /* required */
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
			res.status(500).send('{ "success": false, "msg": "Error adding deal: "' + err + "}") ;
		}
		else  {
			console.log("Record inserted successfully") ;
			console.log(data);           // successful response

			// Create an SNS client
			console.log("Creating SNS Client to notify customers about the new deal") ;
			if(snsClient == null) {
				console.log("SNS is null, creating new connection") ;
				snsClient = new AWS.SNS() ;
			}
			console.log("SNS Client creation successful") ;
			
			var message = {
				"default": "New deal from "+ req.body.businessName,
				"APNS_SANDBOX":"{\"aps\":{\"alert\":\"New deal from " + req.body.businessName + "\"}}", 
				"GCM": "{ \"data\": { \"message\": \"New deal from "  + req.body.businessName + "\"} }"
			};
			
			var params = {
				Message: JSON.stringify(message),
				Subject: 'New Deal from ' +  req.body.BusinessName,
				MessageStructure: 'json',
				//TargetArn: 'TopicArn',
				TopicArn: 'arn:aws:sns:us-west-2:861942316283:LocalLinkNotification'
			};
			snsClient.publish(params, function(err, data) {
				if (err) {
					console.log("Error sending notification on deal") ;
					console.log(err, err.stack); // an error occurred
				}				
				else {
					console.log("Notification sent to topic subscribers") ;
					console.log(data);           // successful response
				}
			});
			
			
			res.status(200).send('{"success":true,"msg":"Buzz Created!"}') ;
			
			
			
		}
	});
};

exports.deleteDeal = function(req, res) {
	console.log("Deleting a deal with uuid: " + req.params.id) ;
	
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
	  /*Attributes: [ 
		
		{
		  Name: 'DealStatus' 
		},
		{
		  Name: 'DealStartDate' 
		},
		{
		  Name: 'DealPictureURL' 
		},
		{
		  Name: 'DealName' 
		},
		{
		  Name: 'DealEndDate' 
		},
		{
		  Name: 'CustID' 
		},
		{
		  Name: 'BusinessName' 
		}
		
	],*/
	  DomainName: 'MyDeals', /* required */
	  ItemName: req.params.id /* required */
	  
	};
	
	console.log("Now deleting a row in MyDeals domain") ;
	simpleDB.deleteAttributes(params, function(err, data) {
	     
		if (err) {
			console.log("Error deleting Buzz") ;
			console.log(err, err.stack); // an error occurred
			res.status(500).send('"success": false, "msg": "Error deleting deal: " + err') ;
			/*res.status(500).send('<script type=\"text/javascript\"> alert( "Error deleting deal:" + err );</script>');*/
		}
		else  {
			console.log("Deal deleted successfully") ;
			console.log(data);           // successful response
			//res.status(201).send('"success": true, "msg": "Deal deleted successfully"') ;
			res.status(200).send('{ "success": true, "msg": "Buzz Deleted" }') ;
			//res.status(200).send('<script type=\"text/javascript\"> alert("Deal deleted successfully") ;</script>' ) ;
			
			
		}
	});

} ;

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
	
	
	upload.single('fileUpload') ;
	console.log("Upload complete...") ;
	
	//if(req.file) {
	
		console.log("Now uploading the file...") ;
		var storage_s3 = s3({
		destination : function( req, file, cb ) {
			cb( null, '' );
		},
		filename    : function( req, file, cb ) {
			cb( null, file.fieldname + '-' + Date.now() + ".jpg" );
		},
		bucket      : 'appsonmobile.com/locallink/deals',
		region      : 'us-west-2'
	});
	var maxSize = 50 * 1024 * 1024;
	var uploadMiddleware = multer({ storage: storage_s3,limits:{ fileSize: maxSize }}).single('fileUpload');
	console.log("Uploading file");
	
	// calling middleware function directly instead of allowing express to call, so we can do error handling. 
	uploadMiddleware(req, res, function(err) {
	
		
		
			console.log('File Size is:' + req.file);
			if(req.file) {
				if(err) {
					console.log("Error uploading file" + err) ;
					//next() ;
					res.status(500).send('{"success": false, "msg": "Error uploading file: "' + err + "}") ;
				}
				else {
					
					//res.set('Content-Type', 'text/html');
					next() ;
					//res.status(200).send("File upload successful") ;
				}
			}
			else {
			
				res.status(500).send('{ "success": false, "msg": "No Image to upload" }') ;
			}
		
	});
	/*}
	else{
	    console.log("Now uploading the file...checked no file") ;
		res.status(500).send('{"success": false, "msg": "No Image to upload"}') ;
	}*/
	
	
	
	
	
};