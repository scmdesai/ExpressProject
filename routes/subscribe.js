var stripe = require("stripe")(
  "sk_test_TwDJ5wEl8x2vzxJCEiH74Rli"
);



exports.enableSubscription = function(req, res) { 

	stripe.customers.create({
		  description: 'Local Buzz Merchant',
		  source: req.body.stripeToken,// obtained with Stripe.js
		  email: req.body.stripeEmail,
		  plan: "StandardPlan"
		}, function(err, customer) {
		  // asynchronously called
		if(err){
			console.log('Could not create customer in Stripe');
		}
		else {
			console.log('Success! New customer created!');
			console.log('Customer is subscribed to : ' + customer.subscriptions);
			res.status(200).send('{ "success": true, "msg": "Customer subscribed successfully" }') ;
		}
	});
	
};