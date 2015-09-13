var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Deal = require("./deal");

var dealsList = [] ;

exports.findAllDeals = function(req, res) {
	//console.log("GET STORES") ;

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
	var simpleDB = new AWS.SimpleDB() ;
	console.log("SDB Client creation successful") ;
	var	params = {
		SelectExpression: 'select * from MyDeals where DealStatus="Active"', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
	var cb = req.query.callback;	
	console.log("Callback URL is " + cb) ;

	var customerId = req.query.customerId;	
	console.log("Customer ID is " + customerId) ;

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
			
			
			for(var i=0; i < items.length; i++) {
				var item = items[i] ;	
                console.log(item) ;				
				var attributes = item["Attributes"] ;
				dealsList[i] = new Deal(attributes) ;
		
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

