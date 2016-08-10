var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Subscription = require("./subscription");
var multer = require( 'multer' );
var s3 = require( 'multer-storage-s3' );
var upload = multer({ dest: 'uploads/' }) ;

var simpleDB = null ;
var storesList = [] ;

exports.createNewSubscription= function(req, res){


  var startDate = new Date();
  var endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + 92);
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
	var uuid1 = uuid.v1();
	if(simpleDB == null) {
		console.log("SimpleDB is null, creating new connection") ;
		simpleDB = new AWS.SimpleDB() ;
	}
	console.log("SDB Client creation successful") ;
	console.log("CustomerID is" + req.body.customerId);
	
	var params = {
	  Attributes: [ /* required */
		 {
		  Name: 'CustomerId', /* required */
		  Value: req.body.customerId,//req.body.customerId, /* required */
		  Replace: false
		},
		{
		  Name: 'SignupStatus', /* required */
		  Value: 'Pending', /* required */
		  Replace: true
		},
		{
		  Name: 'StartDate', /* required */
		  Value: startDate.toString(), /* required */
		  Replace: false
		},
		{
		  Name: 'EndDate', /* required */
		  Value: endDate.toString(), /* required */
		  Replace: false
		},
		{
		  Name: 'PlanType', /* required */
		  Value: 'Free',
		  Replace: true
		}
		
	],
	  DomainName: 'DemoMySubscriptions', /* required */
	  ItemName: uuid1, /* required */
	  Expected: {
		Exists: false,
		Name: 'CustomerId'
	  }
	};
	
	console.log("Now inserting new row into DemoMySubscriptions domain") ;
	simpleDB.putAttributes(params, function(err, data) {
		if (err) {
			console.log("Error inserting record") ;
			console.log(err, err.stack); // an error occurred
			res.status(500).send('{ "success": false, "msg": "Error adding user: "' + err + "}") ;
		}
		else  {
			console.log("Record inserted successfully") ;
			console.log(data);           // successful response

			res.status(200).send('{"success":true,"msg":"User created!"}') ;
			
			
			
		}
	});

};
exports.getSubscriptionStatus= function(req, res){

console.log("GET STORE BY NAME") ;
	console.log(req.body) ;
	var today = new Date();

   //res.send({id:req.params.storeName, businessName: "The Name", description: req.body});
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
		SelectExpression: 'select * from DemoMySubscriptions where CustomerId = ' + '"' + req.params.id + '"', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
	//var cb = req.query.callback;	
	//console.log("Callback URL is " + cb) ;

	
	//console.log("Now retrieving data set from SDB") ;
	simpleDB.select(params, function(err, data) {
		if (err) {
			console.log("ERROR calling AWS Simple DB!!!") ;
			console.log(err, err.stack); // an error occurred
		}
		else     {
			console.log("SUCCESS from AWS!") ;
			console.log(JSON.stringify(data));           // successful response
			console.log("Objects in the AWS data element:" ) ;
			
			
			
			
			var items = data["Items"] ;
			
				var item = items[0];	
                				
				var attributes = item["Attributes"] ;
				var subscriptionStatus = new Subscription(attributes) ;
				
                    console.log(subscriptionStatus["signupStatus"]);
					if(subscriptionStatus["signupStatus"]=="Approved" && subscriptionStatus["planType"]=="Free"  ){
						res.send("Approved and Free Tier");
					}
					else if(subscriptionStatus["signupStatus"]=="Approved" && subscriptionStatus["planType"]=="Paid"  ){
						res.send("Approved and Paid Tier");
					}
               
			}
        
	});		

};


