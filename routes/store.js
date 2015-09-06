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
		case "BusinessName":
			console.log("Business Name is: " + valueAttr) ;
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
			console.log("Picture URL is: " + valueAttr) ;
			this.picture = valueAttr ;
			break ;
			
		}	
		
	}
	//this.picture = "URL" ;
	this.isFavorite = "true" ;

}

module.exports = Store ;