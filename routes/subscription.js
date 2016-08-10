// Constructor of the Subscription object
// It will take the "attributes" array that we get from the Amazon SimpleDB service


function Subscription(attributes) {
	console.log("Now constructing Store object") ;
	for(var j in attributes) {
		var attr = attributes[j];
		//console.log(attr) ;
		var nameAttr = attr["Name"];
		var valueAttr = attr["Value"];
		switch (nameAttr) {
		case "CustomerId":
			this.customerId = valueAttr ;
			break ;
		
		case "StartDate":
			console.log("Business Name is: " + valueAttr) ;
			this.startDate = valueAttr ;
			break ;
			
		case "EndDate":
			this.endDate = valueAttr ;
			break ;
			
		case "SignupStatus":
			this.signupStatus = valueAttr ;
			break ;
			
		case "PlanType":
			this.planType = valueAttr ;
			break ;
			
		
	}
	

}

module.exports = Subscription ;