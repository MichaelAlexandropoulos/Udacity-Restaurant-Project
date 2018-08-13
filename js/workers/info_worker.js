'use strict';
importScripts('idb.js');

const ReqURL = 'http://localhost:1337/restaurants';
const ReviewsURL = 'http://localhost:1337/reviews';
// Inserting Values to the DataBase
function InsertValuesToDataBase(table,json) {
  var dbPromise = idb.open('DB-Restaurants');
  if (table === 'Restaurants') {
    dbPromise.then(db => {
      var tx = db.transaction(table, 'readwrite');
      tx.objectStore(table).put({
        id: json.id,
        data: {
          updated: false,
          id: json.id,
          updatedAt: json.updatedAt,
          name: json.name,
          is_favorite: json.is_favorite,
          neighborhood: json.neighborhood,
          photograph: json.photograph,
          address: json.address,
          latlng: JSON.stringify(json.latlng),
          cuisine_type: json.cuisine_type,
          operating_hours: JSON.stringify(json.operating_hours)
        }
      });
      return tx.complete;
    });
  } else {
    dbPromise.then(db => {
      var tx = db.transaction(table, 'readwrite');
      for(var i = 0; i < json.length; i++) {
        tx.objectStore(table).put({
          id: json[i].id,
          data: {
            updated: false,
            id: json[i].id,
            restaurant_id: json[i].restaurant_id,
            name: json[i].name,
            createdAt: json[i].createdAt,
            updatedAt: json[i].updatedAt,
            rating: json[i].rating,
            comments: json[i].comments
          }
        });
      }
      return tx.complete;
    });
  }
}
// Load Restaurant Data
function LoadRestaurantData(id) {
  if (id !== '') {
    var RequestID = ReqURL+ '/'+id;
    fetch(RequestID)
    .then(function(data) { return data.json(); })
    .then(function(json) {
      var dbPromise = idb.open('DB-Restaurants');
      dbPromise.then(function(db) {
        var tx = db.transaction('Favorites', 'readonly');
        var store = tx.objectStore('Favorites');
        id = parseInt(id); // Changing the string to integer
        return store.get(json.name);
      }).then(function(DataSet) {
        if (typeof DataSet !== 'undefined') {
          json.is_favorite = DataSet.is_favorite;
        }
        LoadRestaurantReviews(id,json);
        InsertValuesToDataBase('Restaurants',json);
      });
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
          'updatedAt': DataSet.data.updatedAt,
          'is_favorite': DataSet.data.is_favorite,
          'name': DataSet.data.name,
          'neighborhood': DataSet.data.neighborhood,
          'photograph': DataSet.data.photograph,
          'address': DataSet.data.address,
          'latlng': JSON.parse(DataSet.data.latlng),
          'cuisine_type': DataSet.data.cuisine_type,
          'operating_hours': JSON.parse(DataSet.data.operating_hours)
        };
        LoadRestaurantReviews(id,json);
      });
    });
  }
}
// Loading the reviews for the Restaurant.
function LoadRestaurantReviews(id,RestData) {
  var RequestID = ReviewsURL+ '/?restaurant_id='+id;
  fetch(RequestID)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    var RtrnData = new Array(RestData, json);
    postMessage(RtrnData);
    InsertValuesToDataBase('Reviews',json);
  })
  .catch(function(error) {
    console.log(error,'Online request for '+RequestID+' failed. Falling back to cached data');
    var dbPromise = idb.open('DB-Restaurants');
    dbPromise.then(function(db) {
      var tx = db.transaction('Reviews', 'readonly');
      var store = tx.objectStore('Reviews');
      return store.getAll();
    }).then(function(DataSet) {
      var json = [];
      for (var i = 0; i < DataSet.length; i++) {
        if (DataSet[i].data.restaurant_id === id) { json.push(DataSet[i].data); }
      }
      var RtrnData = new Array(RestData, json);
      postMessage(RtrnData);
    });
  });
}
function UpdateFavorites(name,is_fav) {
  var dbPromise = idb.open('DB-Restaurants');
  dbPromise.then(db => {
    var tx = db.transaction('Favorites', 'readwrite');
    tx.objectStore('Favorites').put({
      name: name, is_favorite: is_fav
    });
    return tx.complete;
  });
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
    case 'AddFavoriteRestaurant':
      var dbPromise = idb.open('DB-Restaurants');
      dbPromise.then(function(db) {
        var tx = db.transaction('Restaurants', 'readonly');
        var store = tx.objectStore('Restaurants');
        id = parseInt(id); // Changing the string to integer
        return store.get(id);
      }).then(function(DataSet) {
        postMessage('OK');
        var json = { // We do the reverse of the input above
          'id': DataSet.data.id,
          'updatedAt': DataSet.data.updatedAt,
          'is_favorite': true,
          'name': DataSet.data.name,
          'neighborhood': DataSet.data.neighborhood,
          'photograph': DataSet.data.photograph,
          'address': DataSet.data.address,
          'latlng': JSON.parse(DataSet.data.latlng),
          'cuisine_type': DataSet.data.cuisine_type,
          'operating_hours': JSON.parse(DataSet.data.operating_hours)
        };
        InsertValuesToDataBase('Restaurants',json);
        UpdateFavorites(DataSet.data.name,true);
      });
      break;
    case 'RemoveFavoriteRestaurant':
      postMessage('OK');
      var dbPromise = idb.open('DB-Restaurants');
      dbPromise.then(function(db) {
        var tx = db.transaction('Restaurants', 'readonly');
        var store = tx.objectStore('Restaurants');
        id = parseInt(id); // Changing the string to integer
        return store.get(id);
      }).then(function(DataSet) {
        var json = { // We do the reverse of the input above
          'id': DataSet.data.id,
          'updatedAt': DataSet.data.updatedAt,
          'is_favorite': false,
          'name': DataSet.data.name,
          'neighborhood': DataSet.data.neighborhood,
          'photograph': DataSet.data.photograph,
          'address': DataSet.data.address,
          'latlng': JSON.parse(DataSet.data.latlng),
          'cuisine_type': DataSet.data.cuisine_type,
          'operating_hours': JSON.parse(DataSet.data.operating_hours)
        };
        InsertValuesToDataBase('Restaurants',json);
        UpdateFavorites(DataSet.data.name,false);
      });
      break;
  }
}
