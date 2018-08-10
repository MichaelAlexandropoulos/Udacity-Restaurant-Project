/* Service Worker Registration */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js')
  .then(function() {
    console.log('Service Worker Registration OK for Info');
  })
  .catch(function() {
    console.log('!!!!!!!!! ALERT Service Worker for Info DID NOT Register !!!!!!!!!');
  });
}
/* -------------------------------------------------------------------------- */
/* The initialization of the page */
window.onload = function() {
  var id = getParameterByName('id');
  if (!id) { // no id found in URL
    console.log('No restaurant id in URL');
  } else {
    if (window.Worker) {
  		var myWorker = new Worker("js/workers/info_worker.js");
      // Posting the request message to the web worker
  		myWorker.postMessage(['LoadRestaurantData',id]);
      // Getting a response from web worker
  		myWorker.onmessage = function(response) {
        // Creating Breadcrumb
        fillBreadcrumb(response.data);
        // Creating the restaurant information
        displayRestaurantInfo(response.data);
        initMap(response.data);
  		};
  	}
  }
};
/* -------------------------------------------------------------------------- */
/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/* -------------------------------------------------------------------------- */
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant) {
  var breadcrumb = document.getElementById('breadcrumb');
  var li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}
/* -------------------------------------------------------------------------- */
/**
 * Creates the display of the restaurant information page.
 */
function displayRestaurantInfo(restaurant) {
  // creating basic info
  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  var address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  var image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = `img/${restaurant.photograph}.jpg`;
  image.alt = restaurant.name;
  image.setAttribute('tabindex', '0');
  var lbl = restaurant.name+', type '+restaurant.cuisine_type+', '+restaurant.neighborhood+', '+restaurant.address;
  image.setAttribute('aria-label', lbl);
  var cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  // filling operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
  // filling reviews
  fillReviewsHTML(restaurant.reviews);
}
/* -------------------------------------------------------------------------- */
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours) {
  var TimeString = '';
  var hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    var row = document.createElement('tr');

    var day = document.createElement('td');
    day.innerHTML = key;
    day.classList.add('day-col');
    row.appendChild(day);

    var time = document.createElement('td');
    TimeString = operatingHours[key]
    time.innerHTML = TimeString.replace(',','<br>');
    time.classList.add('time-col');
    row.appendChild(time);

    hours.appendChild(row);
  }
}
/* -------------------------------------------------------------------------- */
/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews) {
  var container = document.getElementById('reviews-container');
  var title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}
/* -------------------------------------------------------------------------- */
/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
  var li = document.createElement('li');
  li.classList.add('review-card');
  li.setAttribute('tabindex', '0');

  var resizer = document.createElement('div'); // Name and date wrapper
  resizer.classList.add('DivResizer');

  var infodiv = document.createElement('div'); // Name and date wrapper
  infodiv.classList.add('review-head');

  var name = document.createElement('p');
  name.innerHTML = review.name;
  infodiv.appendChild(name);

  var date = document.createElement('span');
  date.classList.add('review-date');
  date.innerHTML = review.date;
  infodiv.appendChild(date);
  infodiv.appendChild(resizer);

  var datadiv = document.createElement('div'); // rating and review wrapper
  datadiv.classList.add('review-data');

  var rating = document.createElement('p');
  rating.classList.add('review-rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  datadiv.appendChild(rating);

  var comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-comments');
  datadiv.appendChild(comments);

  li.appendChild(infodiv);
  li.appendChild(datadiv);

  return li;
}
/* -------------------------------------------------------------------------- */
/**
 * Initialize Google map, called from HTML.
 */
function initMap(restaurant) {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  var markers = [];
  // Add marker to the map
  var marker = mapMarkerForRestaurant(restaurant, self.map);
  google.maps.event.addListener(marker, 'click', () => {
    window.location.href = marker.url
  });
  markers.push(marker);
}
function mapMarkerForRestaurant(restaurant, map) {
  var marker = new google.maps.Marker({
    position: restaurant.latlng,
    title: restaurant.name,
    url: `./restaurant.html?id=${restaurant.id}`,
    map: map,
    animation: google.maps.Animation.DROP}
  );
  return marker;
}
/* -------------------------------------------------------------------------- */
// Get the modal
var modal = document.getElementById('myModal');
// Get the button that opens the modal
var btn = document.getElementById("AddReviewBtn");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// for controling the tab sequense of the modal
var nmFld = document.getElementById("NameField");
var svBtn = document.getElementById("AcceptBtn");
// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
  nmFld.focus();
}
// When the user clicks on <span> (x), close the modal
span.onclick = function() { modal.style.display = "none"; }
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) { modal.style.display = "none"; }
}
// controling the tab sequense of the modal
nmFld.addEventListener('keydown', function(e) {
  if (e.shiftKey && e.keyCode == 9) {
    e.preventDefault();
    svBtn.focus();
  }
});
svBtn.addEventListener('keydown', function(e) {
  if (!e.shiftKey && e.keyCode == 9) {
    e.preventDefault();
    nmFld.focus();
  }
});
/* -------------------------------------------------------------------------- */
