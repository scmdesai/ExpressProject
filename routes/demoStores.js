var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Store = require("./store");
var multer = require( 'multer' );
var s3 = require( 'multer-storage-s3' );
var upload = multer({ dest: 'uploads/' }) ;

var simpleDB = null ;
var storesList = [] ;
var pictureURL;

exports.findAllStores = function(req, res) {
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
	simpleDB = new AWS.SimpleDB() ;
	console.log("SDB Client creation successful") ;
	var	params = {
		SelectExpression: 'select * from DemoMyCustomers', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
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
			
			
			for(var i=0; i < items.length; i++) {
				var item = items[i] ;	
                console.log(item) ;				
				var attributes = item["Attributes"] ;
				storesList[i] = new Store(attributes) ;
				
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
		console.log("Stores List is: " + storesList);
		var storesJsonOutput = JSON.stringify(storesList) ;
	    
		
		if(cb) {
			res.send( cb + "(" + storesJsonOutput + ");" );
		}
		else {
			res.send(storesJsonOutput) ;
		}
	});
			
};

exports.findByStoreName = function(req, res) {
	console.log("GET STORE BY NAME") ;
	console.log(req.body) ;

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
		SelectExpression: 'select * from DemoMyCustomers where BusinessName = ' + '"' + req.params.storeName + '"', /* required */
		ConsistentRead: true
		//NextToken: 'STRING_VALUE'
	};
	//console.log("Headers received:" + JSON.stringify(req.headers)) ;
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
			
			
			for(var i=0; i < items.length; i++) {
				var item = items[i] ;	
                console.log(item) ;				
				var attributes = item["Attributes"] ;
				storesList[i] = new Store(attributes) ;
				
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
		console.log("Stores List is: " + storesList);
		var storesJsonOutput = JSON.stringify(storesList) ;
	    
		
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
	  DomainName: 'DemoMyCustomers', /* required */
	  ItemName: req.params.id,/* required */
	  Expected: {
		Exists: true,
		Name: 'CustomerId',
		Value: req.params.id
		
	  }
	  
	 
	};

	console.log("Now updating Business Info in DemoMyCustomers domain") ;
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
	  DomainName: 'DemoMyCustomers', /* required */
	  ItemName: req.params.id,/* required */
	  Expected: {
		Exists: true,
		Name: 'CustomerId',
		Value: req.params.id
		
	  }
	  
	 
	};

	console.log("Now updating Business Info in DemoMyCustomers domain") ;
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
exports.updateProfilePicture = function(req, res,next) {
	
	
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
exports.createNewUser = function(req, res) {

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
	
	var pictureURL = "http://images.appsonmobile.com/locallink/stores/" + req.file.path ;
	
	
	

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
		}
	],
	  DomainName: 'DemoMyCustomers', /* required */
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
			res.status(500).send('{ "success": false, "msg": "Error adding user: "' + err + "}") ;
		}
		else  {
			console.log("Record inserted successfully") ;
			console.log(data);           // successful response
            
			req.body.customerId = uuid1;
			
			
			//res.status(200).send('{"success":true,"msg":"User created!"}') ;
			
			
			
		}
	});
	next();
};
