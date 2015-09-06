var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Store = require("./store");

var storesList = [] ;

exports.findAllStores = function(req, res) {
	//console.log("GET STORES") ;

	//AWS.config.loadFromPath('./config.json');
	console.log("Loading credentials from EC2 environment");
	AWS.config.credentials = new AWS.EC2MetadataCredentials({
		  httpOptions: { timeout: 10000 } // 10 second timeout
	});

	console.log("Credentials retrieval successful") ;
	// Create an SDB client
	console.log("Creating SDB Client") ;
	var simpleDB = new AWS.SimpleDB() ;
	console.log("SDB Client creation successful") ;
	var	params = {
		SelectExpression: 'select * from MyCustomers', /* required */
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

    res.send({id:req.params.storeName, businessName: "The Name", description: "description"});
};