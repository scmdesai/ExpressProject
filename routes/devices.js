var AWS = require('aws-sdk');

exports.registerNewDevice = function(req, res) {

	console.log("Registering Device with AWS SNS") ;
	
	console.log("Incoming request is") ;
	
	console.log(req.body);
	
	var json = req.body;
	
	console.log("Device type is:" + json.deviceType) ;
	console.log("Registration ID is:" + json.registrationID) ;
	
	res.status(200).send('{"success":true,"msg":"Device Registered Successfully"}') ;
	
};	

