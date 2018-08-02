/* Service Worker Registration */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js')
  .then(function() {
    console.log('Service Worker Registration OK for index');
  })
  .catch(function() {
    console.log('!!!!!!!!! ALERT Service Worker for index DID NOT Register !!!!!!!!!');
  });
}
/* -------------------------------------------------------------------------- */
/* The initialization of the page */
window.onload = function() {
	if (window.Worker) {
		var myWorker = new Worker("js/workers/init_worker.js");
    // Posting the request message to the web worker
		myWorker.postMessage('LoadRestaurantsList');
    // Getting a response from web worker
		myWorker.onmessage = function(response) {
			OldData = response.data;
      // Creating Neighborhoods Options
      fetchRestaurantsOptions('neighborhoods',response.data);
      // Creating Cuisines Options
      fetchRestaurantsOptions('cuisines',response.data);
      fetchRestaurantsEntries(response.data);
      initMap(response.data);
      var bLazy = new Blazy();
		};
	}
};
/* -------------------------------------------------------------------------- */
// Runs every 1 minute and checks what (if any) new info must be displayed.
setInterval(function() {
  if (window.Worker) {
		var myWorker = new Worker("js/workers/init_worker.js");
    // Posting the request message to the web worker
		myWorker.postMessage('UpdateRestaurantsList');
    // Getting a response from web worker
		myWorker.onmessage = function(response) {
      if (response.data !== 'OffLine') {
        var d = new Date();
        console.log('last updated at ',d.toDateString());
        document.getElementById('UpdateInfoDiv').style.display = "block";
      }else {
        console.log('OffLine use for now!');
      }
		};
	}
}, 60000); // Every 1 minute
/* -------------------------------------------------------------------------- */
/*
 * Creates the options for the select elements of the index.html with minimal
 * spaggeti code.
 *
 */
function fetchRestaurantsOptions(type, restaurants) {
  switch (type) {
    case 'neighborhoods':
      // Get all neighborhoods from all restaurants
      var OptList = restaurants.map((v, i) => restaurants[i].neighborhood)
      var OptElem = 'neighborhoods-select';
      break;
    case 'cuisines':
      // Get all neighborhoods from all restaurants
      var OptList = restaurants.map((v, i) => restaurants[i].cuisine_type)
      var OptElem = 'cuisines-select';
      break;
  }
  // Remove duplicates from neighborhoods
  var uniqueList = OptList.filter((v, i) => OptList.indexOf(v) == i)
  // Creating the options of the select fields
  var select = document.getElementById(OptElem);
  uniqueList.forEach(ListItem => {
    var option = document.createElement('option');
    option.innerHTML = ListItem;
    option.value = ListItem;
    select.append(option);
  });
}
/* -------------------------------------------------------------------------- */
/*
 * Creates the Restaurants Entries based on the filters we passed. As always I
 * try to be as straight forward as I can
 *
 */
function fetchRestaurantsEntries(restaurants, fltrHood='all', fltrCuisine='all') {
  if (fltrCuisine != 'all') { // filter by cuisine
    restaurants = restaurants.filter(r => r.cuisine_type == fltrCuisine);
  }
  if (fltrHood != 'all') { // filter by neighborhood
    restaurants = restaurants.filter(r => r.neighborhood == fltrHood);
  }
  var ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
  var first = true;
  restaurants.forEach(restaurant => {
    var li = document.createElement('li');
    li.setAttribute('tabindex', '-1');

    var image = document.createElement('img');
    if (first) {
      image.className = 'restaurant-img';
      image.src = `img/${restaurant.photograph}.jpg`;
    } else {
      image.className = 'restaurant-img b-lazy';
      image.src = `data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==`;
      image.dataset.src= `img/${restaurant.photograph}.jpg`;
    }
    image.alt = restaurant.name;
    image.setAttribute('tabindex', '0');
    var lbl = restaurant.name+', type '+restaurant.cuisine_type+', '+restaurant.neighborhood+', '+restaurant.address;
    image.setAttribute('aria-label', lbl);
    li.append(image);

    var name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    var neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    var address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    var more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = `./restaurant.html?id=${restaurant.id}`;
    li.append(more);
    ul.append(li);
    first = false;
  });
}
/* -------------------------------------------------------------------------- */
/*
 * Gets the values of the neighborhoods and cuisines selectors and recreates the
 * restaurant list based on those filters
 *
 */
function FilterRestaurants() {
  if (window.Worker) {
		var myWorker = new Worker("js/workers/init_worker.js");
    // Posting the request message to the web worker
		myWorker.postMessage('LoadRestaurantsList');
    // Getting a response from web worker
		myWorker.onmessage = function(response) {
      // Getting the required elements
      var cSelect = document.getElementById('cuisines-select');
      var nSelect = document.getElementById('neighborhoods-select');
      // Getting the required values
      var cIndex = cSelect.selectedIndex;
      var nIndex = nSelect.selectedIndex;

      var cuisine = cSelect[cIndex].value;
      var neighborhood = nSelect[nIndex].value;

      fetchRestaurantsEntries(response.data, neighborhood, cuisine);
		};
	}
}
/* -------------------------------------------------------------------------- */
/**
 * Initialize Google map, called from HTML.
 */
function initMap(restaurants) {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  if (window.Worker) {
		var myWorker = new Worker("js/workers/init_worker.js");
    // Posting the request message to the web worker
		myWorker.postMessage('LoadGoogleMapView');
    // Getting a response from web worker
		myWorker.onmessage = function(response) {
      // Creating Neighborhoods Options
      console.log(response.data);
		};
	}
}
/* -------------------------------------------------------------------------- */
/**
 * Refreshing the page to get the new data
 */
document.getElementById('UpdateInfoBtn').onclick = function(){
	window.location.reload();
};
/* -------------------------------------------------------------------------- */
