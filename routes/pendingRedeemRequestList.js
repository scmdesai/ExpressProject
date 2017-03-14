var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var PendingRequestListItem = require("./pendingRequestListItem");






var simpleDB = null ;
var s3Client = null ;
var snsClient = null ;



exports.getPendingRedeemRequestList = function(req, res) {
	
	
	
	var redeemRequestList=[];

	// switch to either use local file or AWS credentials depending on where the program is running
	var customerId = req.query.customerId;
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
	console.log("Customer Id is"+customerId) ;
	// Create an SDB client
	console.log("Creating SDB Client") ;
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	
	console.log("SDB Client creation successful") ;
	
	
	var	params = {
		SelectExpression: 'select * from CouponCodesForLocalBuzz where CustomerId ="'+ customerId+'"', /* required */
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
			console.log(items.length) ;
			
			
			if(items){
				
				for(var i=0; i < items.length; i++) {
					var item = items[i] ;	
					//console.log(item) ;
					var itemName = item["Name"] ;
					console.log("ItemName is " + itemName) ;
					var attributes = item["Attributes"] ;
					console.log("attributes is " + attributes) 
					
					// active buzz found. Add it to he return value
 						redeemRequestList[i] = new PendingRequestListItem(attributes) ;
						
					
				}
			}
			
		}
		
		console.log("Redeem Request List is: " + redeemRequestList);
		var redeemRequestListJsonOutput = JSON.stringify(redeemRequestList) ;
	    
		
		if(cb) {
			res.send( cb + "(" + redeemRequestListJsonOutput + ");" );
		}
		else {
			res.send(redeemRequestListJsonOutput) ;
		}
	});
	
			
};