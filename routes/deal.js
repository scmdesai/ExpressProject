// Constructor of the store object
// It will take the "attributes" array that we get from the Amazon SimpleDB service
function Deal(itemName,attributes) {
	console.log("Now constructing Deal object") ;
	this.itemName = itemName ;
	for(var j in attributes) {
		var attr = attributes[j];
		//console.log(attr) ;
		var nameAttr = attr["Name"];
		console.log("Name Attribute is: " + nameAttr) ;
		var valueAttr = attr["Value"];
		console.log("Value is: " + valueAttr) ;
		switch (nameAttr) {
		case "customerId":
			this.customerId = valueAttr ;
			break ;
		
		case "businessName":
			console.log("Business Name is: " + valueAttr) ;
			this.businessName = valueAttr ;
			break ;
			
		case "DealStatus":
			this.dealStatus = valueAttr ;
			break ;
			
		case "DealName":
			this.dealName = valueAttr ;
			break ;
			
		case "DealStartDate":
			this.dealStartDate = valueAttr ;
			break ;
			
		case "DealEndDate":
			this.dealEndDate = valueAttr ;
			break ;
			
		case "DealPictureURL":
			this.dealPictureURL = valueAttr ;
			break ;
			
		}	
	}
}

module.exports = Deal ;