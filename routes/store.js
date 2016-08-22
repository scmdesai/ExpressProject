// Constructor of the store object
// It will take the "attributes" array that we get from the Amazon SimpleDB service


function Store(attributes) {
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
		
		case "BusinessName":
			//console.log("Business Name is: " + valueAttr) ;
			this.businessName = valueAttr ;
			break ;
			
		case "Category":
			this.category = valueAttr ;
			break ;
			
		case "phoneNumber":
			this.phoneNumber = valueAttr ;
			break ;
			
		case "address":
			this.address = valueAttr ;
			break ;
			
		case "email":
			this.emailAddress = valueAttr ;
			break ;
		case "loginEmail":
			this.loginEmail = valueAttr ;
			break ;
			
		case "zipcode":
			this.zipcode = valueAttr ;
			break ;
			
		case "state":
			this.state = valueAttr ;
			break ;
			
		case "city":
			this.city = valueAttr ;
			break ;
			
		case "pictureURL":
			//console.log("Picture URL is: " + valueAttr) ;
			this.pictureURL = valueAttr ;
			break ;
		case "website":
			this.website = valueAttr ;
			break ;
		case "websiteDisplayName":
			this.websiteDisplayName = valueAttr ;
			break ;
		case "StartDate":
			
			this.startDate = valueAttr ;
			break ;
			
		case "EndDate":
			this.endDate = valueAttr ;
			break ;
			
		case "SignupStatus":
		    //console.log("Picture URL is: " + valueAttr) ;
			this.signupStatus = valueAttr ;
			break ;
			
		case "PlanType":
			this.planType = valueAttr ;
			break ;
			
		case "TopicName":
			this.topicName = valueAttr ;
			break ;
		
			
			
		}	
		
	}
	//this.picture = "URL" ;
	//this.isFavorite = "true" ;

}

module.exports = Store ;