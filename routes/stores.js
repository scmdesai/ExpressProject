var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Store = require("./store");
var multer = require( 'multer' );
var s3 = require( 'multer-storage-s3' );
var upload = multer({ dest: 'uploads/' }) ;

var simpleDB = null ;
var storesListTmp = [] ;
var storesList = [] ;
var pictureURL;
var snsClient = null ;

exports.findAllStores = function(req, res) {
    var today = new Date();
	
	

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
	simpleDB = new AWS.SimpleDB() ;
	console.log("SDB Client creation successful") ;
	var	params = {
		SelectExpression: 'select * from MyCustomers where SignupStatus="Approved"', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
	var cb = req.query.callback;	
	//console.log("Callback URL is " + cb) ;

	
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
			/*for(var name in data) {
				console.log(name) ;
			}*/
			console.log("Now accessing Items element") ;
			var items = data["Items"] ;
			
			
			if(items){
			for(var i=0,j=0; i < items.length; i++) {
				var item = items[i] ;
                
                var endDate;				
                				
				var attributes = item["Attributes"] ;
				
				    
				
					storesList[i] = new Store(attributes) ;
				/**** Commenting out this logic of filtering merchants who are no longer in trial period or paid customers. 
					For such customers will not be able to post new deals. 
					storesListTmp[i] = new Store(attributes) ;
					endDate = new Date(storesListTmp[i]["endDate"]);
					 if(storesListTmp[i]["planType"]=="Paid" ||(storesListTmp[i]["planType"]=="Free"&& endDate >= today)){
						storesList[j] = new Store(attributes) ;
						j++;
					}
					 
				*/
					 
				
				/*
				//console.log(attributes) ;
				for(var j in attributes) {
					var attr = attributes[j];
					//console.log(attr) ;
					var nameAttr = attr["Name"];
					var valueAttr = attr["Value"];
					//console.log(nameAttr + ": " + valueAttr );
					var storesJsonOutput;
					storesJsonOutput = (nameAttr + ": " + valueAttr + "\n" );
					res.write(storesJsonOutput);
					
				
				}
			
				res.end() ;*/	
				/*var store = new Store() ;
				for(var j=0; j < attributes.length; j++) {
					var attribute = attributes[j] ;
					if(attribute["Name"] == "BusinessName") {
						store.businessName = attribute["Value"] ;
					}
				}
				storesList[i] = store ;*/
				//console.log(attributes) ;
			}
			
		}
		}
		//console.log("Stores List is: " + storesList);
		var storesJsonOutput = JSON.stringify(storesList) ;
	    
		
		if(cb) {
			res.send( cb + "(" + storesJsonOutput + ");" );
		}
		else {
			res.send(storesJsonOutput) ;
		}
	});
			
};

exports.findByLoginEmail = function(req, res) {
	console.log("GET STORE BY NAME") ;
	console.log(req.body) ;
	var storeDetails;

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
		SelectExpression: 'select * from MyCustomers where loginEmail = ' + '"' + req.params.email + '"', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	console.log("params: " + req.params.email) ;
	var cb = req.query.callback;	
	console.log("Callback URL is " + cb) ;

	
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
			
			// loginEmail is unique
			//for(var i=0; i < items.length; i++) {
			if(items){
				var item = items[0] ;	
                console.log(item) ;				
				var attributes = item["Attributes"] ;
				storeDetails = new Store(attributes) ;
				
				/*
				//console.log(attributes) ;
				for(var j in attributes) {
					var attr = attributes[j];
					//console.log(attr) ;
					var nameAttr = attr["Name"];
					var valueAttr = attr["Value"];
					//console.log(nameAttr + ": " + valueAttr );
					var storesJsonOutput;
					storesJsonOutput = (nameAttr + ": " + valueAttr + "\n" );
					res.write(storesJsonOutput);
					
				
				}
			
				res.end() ;*/	
				/*var store = new Store() ;
				for(var j=0; j < attributes.length; j++) {
					var attribute = attributes[j] ;
					if(attribute["Name"] == "BusinessName") {
						store.businessName = attribute["Value"] ;
					}
				}
				storesList[i] = store ;*/
				//console.log(attributes) ;
			}
			
		}
		console.log("Stores List is: " + storeDetails);
		var storesJsonOutput = JSON.stringify(storeDetails) ;
	    
		
		if(cb) {
			res.send( cb + "(" + storesJsonOutput + ");" );
		}
		else {
			res.send(storesJsonOutput) ;
		}
	});
			
   
};

exports.updateOnlyBusinessInfo = function(req, res) {

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
		  Name: 'CustomerId', /* required */
		  Value: req.body.customerId, /* required */
		  Replace: false
		},
		{
		  Name: 'BusinessName', /* required */
		  Value: req.body.businessName, /* required */
		  Replace: true
		},
		{
		  Name: 'Category', /* required */
		  Value: req.body.category, /* required */
		  Replace: false
		},
		{
		  Name: 'phoneNumber', /* required */
		  Value: req.body.phoneNumber, /* required */
		  Replace: true
		},
		{
		  Name: 'address', /* required */
		  Value: req.body.address, /* required */
		  Replace: true
		},
		{
		  Name: 'email', /* required */
		  Value: req.body.emailAddress, /* required */
		  Replace: false
		},
		{
		  Name: 'loginEmail', /* required */
		  Value: req.body.loginEmail, /* required */
		  Replace: false
		},
		{
		  Name: 'zipcode', /* required */
		  Value: req.body.zipcode, /* required */
		  Replace: false
		},
		{
		  Name: 'state', /* required */
		  Value: req.body.state, /* required */
		  Replace: false
		},
		{
		  Name: 'city', /* required */
		  Value: req.body.city, /* required */
		  Replace: false
		},
		{
		  Name: 'pictureURL', /* required */
		  Value: req.body.pictureURL, /* required */
		  Replace: false
		},
		{
		  Name: 'website', /* required */
		  Value: req.body.website, /* required */
		  Replace: false
		},
		{
		  Name: 'websiteDisplayName', /* required */
		  Value: req.body.websiteDisplayName, /* required */
		  Replace: false
		},
	],
	  DomainName: 'MyCustomers', /* required */
	  ItemName: req.params.id,/* required */
	  Expected: {
		Exists: true,
		Name: 'CustomerId',
		Value: req.params.id
		
	  }
	  
	 
	};

	console.log("Now updating Business Info in MyCustomers domain") ;
	simpleDB.putAttributes(params, function(err, data) {
		if (err) {
			console.log("Error updating record") ;
			console.log(err, err.stack); // an error occurred
			res.status(500).send('{ "success": false, "msg": "Error updating record: "' + err + "}") ;
		}
		else  {
			console.log("Record updated successfully") ;
			console.log(data);           // successful response
			res.status(200).send('{ "success": true, "msg": "Record updated successfully.Please login again to see the changes." }') ;
		}
	});
	
	
};



exports.updateBusinessInfo = function(req, res) {

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
	
	
	
	pictureURL = "http://images.appsonmobile.com/locallink/stores/" + req.file.path ;
	
		
   
	var params = {
	  Attributes: [ /* required */
	   {
		  Name: 'CustomerId', /* required */
		  Value: req.body.customerId, /* required */
		  Replace: false
		},
		{
		  Name: 'BusinessName', /* required */
		  Value: req.body.businessName, /* required */
		  Replace: true
		},
		{
		  Name: 'Category', /* required */
		  Value: req.body.category, /* required */
		  Replace: false
		},
		{
		  Name: 'phoneNumber', /* required */
		  Value: req.body.phoneNumber, /* required */
		  Replace: true
		},
		{
		  Name: 'address', /* required */
		  Value: req.body.address, /* required */
		  Replace: true
		},
		{
		  Name: 'email', /* required */
		  Value: req.body.emailAddress, /* required */
		  Replace: false
		},
		{
		  Name: 'loginEmail', /* required */
		  Value: req.body.loginEmail, /* required */
		  Replace: false
		},
		{
		  Name: 'zipcode', /* required */
		  Value: req.body.zipcode, /* required */
		  Replace: false
		},
		{
		  Name: 'state', /* required */
		  Value: req.body.state, /* required */
		  Replace: false
		},
		{
		  Name: 'city', /* required */
		  Value: req.body.city, /* required */
		  Replace: false
		},
		{
		  Name: 'pictureURL', /* required */
		  Value: pictureURL,//req.body.pictureURL, /* required */
		  Replace: false
		},
		{
		  Name: 'website', /* required */
		  Value: req.body.website, /* required */
		  Replace: false
		},
		{
		  Name: 'websiteDisplayName', /* required */
		  Value: req.body.websiteDisplayName, /* required */
		  Replace: false
		},
		
	],
	  DomainName: 'MyCustomers', /* required */
	  ItemName: req.params.id,/* required */
	  Expected: {
		Exists: true,
		Name: 'CustomerId',
		Value: req.params.id
		
	  }
	  
	 
	};

	console.log("Now updating Business Info in MyCustomers domain") ;
	simpleDB.putAttributes(params, function(err, data) {
		if (err) {
			console.log("Error updating record") ;
			console.log(err, err.stack); // an error occurred
			res.status(500).send('{ "success": false, "msg": "Error updating record: "' + err + "}") ;
		}
		else  {
			console.log("Record updated successfully") ;
			console.log(data);           // successful response
			res.status(200).send('{ "success": true, "msg": "Record updated successfully" }') ;
		}
	});
	
	
};
exports.uploadStoreImage = function(req, res,next) {
	
	
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
	console.log("Now uploading the file...") ;
	
	upload.single('fileUpload') ;
	console.log("Upload complete...") ;
	
	
	var storage_s3 = s3({
		destination : function( req, file, cb ) {
			cb( null, '' );
		},
		filename    : function( req, file, cb ) {
			cb( null, req.body.businessName + ".jpg" );
		},
		bucket      : 'images.appsonmobile.com/locallink/stores',
		region      : 'us-west-2'
	});
	var uploadMiddleware = multer({ storage: storage_s3 }).single('fileUpload');
	console.log("Uploading file");
	
	// calling middleware function directly instead of allowing express to call, so we can do error handling. 
	uploadMiddleware(req, res, function(err) {
		if(err) {
			console.log("Error uploading file" + err) ;
			//next() ;
			res.status(500).send('{ "success": false, "msg": "Error adding image: "' + err + "}") ;
		}
		else {
			console.log("File upload successful") ;
			next();
			//res.status(200).send("File upload successful") ;
		}
	});
	
	
	
};
exports.uploadStoreImage = function(req, res,next) {
	
	
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
	console.log("Now uploading the file...") ;
	
	upload.single('fileUpload') ;
	console.log("Upload complete...") ;
	
	
	var storage_s3 = s3({
		destination : function( req, file, cb ) {
			cb( null, '' );
		},
		filename    : function( req, file, cb ) {
			cb( null, req.body.businessName + ".jpg" );
		},
		bucket      : 'images.appsonmobile.com/locallink/stores',
		region      : 'us-west-2'
	});
	var uploadMiddleware = multer({ storage: storage_s3 }).single('fileUpload');
	console.log("Uploading file");
	
	// calling middleware function directly instead of allowing express to call, so we can do error handling. 
	uploadMiddleware(req, res, function(err) {
		if(err) {
			console.log("Error uploading file" + err) ;
			//next() ;
			res.status(500).send('{ "success": false, "msg": "Error adding image: "' + err + "}") ;
		}
		else {
			console.log("File upload successful") ;
			next();
			//res.status(200).send("File upload successful") ;
		}
	});
	
	
	
};
exports.createNewStore = function(req, res) {

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
	
	// Create an SNS client
	console.log("Creating SNS Client to create a topic") ;
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
	
	var uuid1 = uuid.v1();
	console.log("Generated uuid for itemName " + uuid1) ;
	
	var pictureURL;// = "http://images.appsonmobile.com/locallink/stores/" + req.file.path ;
	if(req.file){
		pictureURL = "http://images.appsonmobile.com/locallink/stores/" + req.file.path ;
	}
	else {
		pictureURL = "http://images.appsonmobile.com/locallink/stores/DefaultStoreImage.jpg";  
	}
	
	var cityName = req.body.city;
	var tmpArray = [];
	var city ;
	var stateName = req.body.state;
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
	
	var paramsTopic = {
		Name: topicName /* required */
	};
	snsClient.createTopic(paramsTopic, function(err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else     console.log(data);           // successful response
	});
	

	var params = {
	  Attributes: [ /* required */
		 {
		  Name: 'CustomerId', /* required */
		  Value: uuid1,//req.body.customerId, /* required */
		  Replace: false
		},
		{
		  Name: 'BusinessName', /* required */
		  Value: req.body.businessName, /* required */
		  Replace: true
		},
		{
		  Name: 'Category', /* required */
		  Value: req.body.category, /* required */
		  Replace: false
		},
		{
		  Name: 'phoneNumber', /* required */
		  Value: req.body.phoneNumber, /* required */
		  Replace: true
		},
		{
		  Name: 'address', /* required */
		  Value: req.body.address +" " + req.body.city + " " + req.body.state + " " + req.body.zipcode, /* required */
		  Replace: true
		},
		{
		  Name: 'email', /* required */
		  Value: req.body.emailAddress, /* required */
		  Replace: false
		},
		{
		  Name: 'loginEmail', /* required */
		  Value: req.body.loginEmail, /* required */
		  Replace: false
		},
		{
		  Name: 'zipcode', /* required */
		  Value: req.body.zipcode, /* required */
		  Replace: false
		},
		{
		  Name: 'state', /* required */
		  Value: req.body.state, /* required */
		  Replace: false
		},
		{
		  Name: 'city', /* required */
		  Value: req.body.city, /* required */
		  Replace: false
		},
		{
		  Name: 'pictureURL', /* required */
		  Value: pictureURL,//req.body.pictureURL, /* required */
		  Replace: false
		},
		{
		  Name: 'website', /* required */
		  Value: "http://" + req.body.websiteDisplayName, //req.body.website, /* required */
		  Replace: false
		},
		{
		  Name: 'websiteDisplayName', /* required */
		  Value: req.body.websiteDisplayName, /* required */
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
		  Replace: true
		},
		{
		  Name: 'EndDate', /* required */
		  Value: endDate.toString(), /* required */
		  Replace: true
		},
		{
		  Name: 'PlanType', /* required */
		  Value: 'Free',
		  Replace: true
		},
		{
		  Name: 'TopicName', /* required */
		  Value: topicName,
		  Replace: true
		}
	],
	  DomainName: 'MyCustomers', /* required */
	  ItemName: uuid1, /* required */
	  Expected: {
		Exists: false,
		Name: 'BusinessName'
	  }
	};
	
	console.log("Now inserting new row into MyCustomers domain") ;
	simpleDB.putAttributes(params, function(err, data) {
		if (err) {
			console.log("Error inserting record") ;
			console.log(err, err.stack); // an error occurred
			res.status(500).send('{ "success": false, "msg": "Error adding new store: "' + err + "}") ;
		}
		else  {
			console.log("Record inserted successfully") ;
			console.log(data);           // successful response
            
			//req.body.customerId = uuid1;
			//next();
			
			
			//send confirmation email about registration to facebook email address
			var sendToEmail = req.body.loginEmail ;
			console.log("Now sending email to: " + sendToEmail) ;
			// load AWS SES
			var ses = new AWS.SES({apiVersion: '2010-12-01'});

			// send to list
			var to = [sendToEmail] ;

			// this must relate to a verified SES account
			var from = "info@appsonmobile.com" ;


			// this sends the email
			ses.sendEmail( { 
			   Source: from, 
			   Destination: { ToAddresses: to },
			   Message: {	
				   Subject: {
					  Data: 'Local Buzz registration request received'
				   },
				   Body: {
					   Html: {
						   Data: 'Dear <b>' + req.body.businessName + '</b> Team, <br>' 
						   + 'Thank you for registering using the <i>Local Buzz for Merchants App</i>. <br> We have received your registration request and we will email you a confirmation in the next two business days. In the meantime, if you have any questions, please feel free to write to us at info@appsonmobile.com or leave us a note <a href="http://www.appsonmobile.com/contact-us">here</a>. <br><br>' 
						   + 'Best Regards,<br> Local Buzz Team <br> Visit us at http://www.appsonmobile.com <br>'						   
					   }
					}
			   }
			}
			, function(err, data) {
				if(err) {
					console.log("Error sending email") ;
					console.log(err, err.stack) ;
				} else {
					console.log('Email sent:');
					console.log(data);
				}
			 });
			
			
			res.status(200).send('{"success":true,"msg":"New store created!"}') ;
			
			
			
		}
	});
	
};

