
/*
 * GET users listing.
 */

exports.render = function(req, res){
  storeId = req.params.storeId ;
  res.send(
  "<!DOCTYPE html>
<html>
<head>
  <title>Embed API Demo</title>
</head>
<body>

<!-- Step 1: Create the containing elements. -->

<section id="auth-button"></section>
<section id="view-selector"></section>
<section id="timeline"></section>

<!-- Step 2: Load the library. -->

<script>
(function(w,d,s,g,js,fjs){
  g=w.gapi||(w.gapi={});g.analytics={q:[],ready:function(cb){this.q.push(cb)}};
  js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
  js.src='https://apis.google.com/js/platform.js';
  fjs.parentNode.insertBefore(js,fjs);js.onload=function(){g.load('analytics')};
}(window,document,'script'));
</script>

<script>
gapi.analytics.ready(function() {

  // Step 3: Authorize the user.

  var CLIENT_ID = '226322216862-o6b8qenieed8v0ml37oo42rfnhqv3sfo.apps.googleusercontent.com';

  gapi.analytics.auth.authorize({
    container: 'auth-button',
    clientid: CLIENT_ID,
  });

  // Step 4: Create the view selector.

  var viewSelector = new gapi.analytics.ViewSelector({
    container: 'view-selector'
  });

  // Step 5: Create the timeline chart.

  var timeline = new gapi.analytics.googleCharts.DataChart({
    /*reportType: 'ga',
    query: {
      'dimensions': 'ga:date',
      'metrics': 'ga:sessions',
      'start-date': '30daysAgo',
      'end-date': 'today',
    },
    chart: {
      type: 'LINE',
      container: 'timeline'
    }*/
	
	
	reportType: 'ga',
	 query: {
      metrics: 'ga:sessions',
      dimensions: 'ga:EventCategory',
      'start-date': '30daysAgo',
      'end-date': 'today',
	   filters:'ga:EventLabel==q',
      'max-results': 6,
      sort: '-ga:sessions'
    },
    chart: {
      container: 'timeline',
      type: 'PIE',
      options: {
        width: '100%',
        pieHole: 4/9
      }
    }
  });

  // Step 6: Hook up the components to work together.

  gapi.analytics.auth.on('success', function(response) {
    viewSelector.execute();
  });

  viewSelector.on('change', function(ids) {
    var newIds = {
      query: {
        ids: ids
      }
    }
    timeline.set(newIds).execute();
  });
});
</script>
</body>
</html>"
  
  );
};