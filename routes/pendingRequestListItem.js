// Constructor of the store object
// It will take the "attributes" array that we get from the Amazon SimpleDB service


function PendingRequestListItem(attributes) {
	console.log("Now constructing PendingRequestListItem object") ;
	
	for(var j in attributes) {
		var attr = attributes[j];
		//console.log(attr) ;
		var nameAttr = attr["Name"];
		var valueAttr = attr["Value"];
		console.log(nameAttr);
		switch (nameAttr) {
		case "CustomerId":
			this.customerId = valueAttr ;			
			break ;
		
		case "CouponCode":
			this.couponCode = valueAttr ;
			break ;
		
		case "TimeStamp":
			this.timeStamp = valueAttr ;
			break ;
		
		case "itemName":
			this.itemName = valueAttr ;
			break ;
		
		
		
		
			
			
		}	
		
	}
	//this.picture = "URL" ;
	//this.isFavorite = "true" ;

}

module.exports = PendingRequestListItem ;