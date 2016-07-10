// Constructor of the store object
// It will take the "attributes" array that we get from the Amazon SimpleDB service
function Deal(itemName,attributes) {
	console.log("Now constructing Deal object") ;
	this.itemName = itemName ;
	var today = new Date();
	var d = new Date(); // Today!
	d.setDate(d.getDate() + 1); // Tomorrow!
	for(var j in attributes) {
		var attr = attributes[j];
		//console.log(attr) ;
		var nameAttr = attr["Name"];
		var valueAttr = attr["Value"];
		//console.log("Name Attribute is: " + nameAttr) ;
	if(nameAttr=='DealEndDate') {
       if(new Date(valueAttr) < new Date(d)){
			this.dealStatus = "Expired";
			
	   }
	  } 
		
		//console.log("Value is: " + valueAttr) ;
		switch (nameAttr) {
		case "customerId":
			this.customerId = valueAttr ;
			break ;
		
		case "businessName":
			//console.log("Business Name is: " + valueAttr) ;
			this.businessName = valueAttr ;
			break ;
			
		case "DealStatus":
			this.dealStatus = valueAttr ;
			break ;
			
		case "DealName":
			this.dealName = valueAttr ;
			break ;
			
		case "DealStartDate":
		
		    //console.log(valueAttr);
			this.dealStartDate = valueAttr ;
			
			
			break ;
			
		case "DealEndDate":
		    
			this.dealEndDate = valueAttr ;
			break ;
			
		case "DealPictureURL":
			this.dealPictureURL = valueAttr ;
			break ;
			
		
        case "DealDescription":
			this.dealDescription = valueAttr ;
			break ;
		
        case "DealImageURL":
			this.dealImageURL = valueAttr ;
			break ;		
		}		
	}
}

module.exports = Deal ;