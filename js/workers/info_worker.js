'use strict';
importScripts('idb.js');

const ReqURL = 'http://localhost:1337/restaurants';

// Inserting Values to the DataBase
function InsertValuesToDataBase(json) {
  var dbPromise = idb.open('DB-Restaurants');
  dbPromise.then(db => {
    var tx = db.transaction('Restaurants', 'readwrite');
    tx.objectStore('Restaurants').put({ // We update the specific entry
      id: json.id,
      data: {
        id: json.id,
        name: json.name,
        neighborhood: json.neighborhood,
        photograph: json.photograph,
        address: json.address,
        latlng: JSON.stringify(json.latlng),
        cuisine_type: json.cuisine_type,
        operating_hours: JSON.stringify(json.operating_hours),
        reviews: JSON.stringify(json.reviews)}
    });
    return tx.complete;
  });
}
// Load Restaurant Data
function LoadRestaurantData(id) {
  if (id !== '') {
    var RequestID = ReqURL+ '/'+id;
    fetch(RequestID)
    .then(function(data) { return data.json(); })
    .then(function(json) {
      InsertValuesToDataBase(json);
      postMessage(json);
    })
    .catch(function(error) {
      console.log(error,'Online request for '+RequestID+' failed. Falling back to cached data');
      var dbPromise = idb.open('DB-Restaurants');
      dbPromise.then(function(db) {
        var tx = db.transaction('Restaurants', 'readonly');
        var store = tx.objectStore('Restaurants');
        id = parseInt(id); // Changing the string to integer
        return store.get(id);
      }).then(function(DataSet) {
        var json = { // We do the reverse of the input above
          'id': DataSet.data.id,
          'name': DataSet.data.name,
          'neighborhood': DataSet.data.neighborhood,
          'photograph': DataSet.data.photograph,
          'address': DataSet.data.address,
          'latlng': JSON.parse(DataSet.data.latlng),
          'cuisine_type': DataSet.data.cuisine_type,
          'operating_hours': JSON.parse(DataSet.data.operating_hours),
          'reviews': JSON.parse(DataSet.data.reviews)
        };
        postMessage(json);
      });
    });
  }
}
// The main onmessage function this is where we get the data from the main js file
// and depending on what they are we do the approrpiate work
onmessage = function(Request) {
  var Action = Request.data[0];
  var id = Request.data[1];
  switch(Action) {
    case 'LoadRestaurantData':
      LoadRestaurantData(id);
      break;
  }

}
