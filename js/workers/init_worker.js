'use strict';
importScripts('idb.js');

const ReqURL = 'http://localhost:1337/restaurants';
const ReviewsURL = 'http://localhost:1337/reviews';
// Creating & Upgrading the Database
function CreateDataBase() {
  var dbPromise = idb.open('DB-Restaurants', 3, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    switch (upgradeDB.oldVersion) {
      case 0:
        var RestTbl = upgradeDB.createObjectStore('Restaurants', {keyPath: 'id'});
      case 1:
        var RevTbl = upgradeDB.createObjectStore('Reviews', {keyPath: 'id'});
        RevTbl.createIndex('restaurant_id', 'restaurant_id', {unique: false});
      case 0:
        var FavTbl = upgradeDB.createObjectStore('Favorites', {keyPath: 'name'});
    }
  });
}
// Inserting Values to the DataBase
function InsertValuesToDataBase(table,json) {
  var dbPromise = idb.open('DB-Restaurants');
  if (table === 'Restaurants') {
    dbPromise.then(db => {
      var tx = db.transaction(table, 'readwrite');
      for(var i = 0; i < json.length; i++) {
        tx.objectStore(table).put({
          id: json[i].id,
          data: {
            updated: false,
            id: json[i].id,
            updatedAt: json[i].updatedAt,
            name: json[i].name,
            is_favorite: json[i].is_favorite,
            neighborhood: json[i].neighborhood,
            photograph: json[i].photograph,
            address: json[i].address,
            latlng: JSON.stringify(json[i].latlng),
            cuisine_type: json[i].cuisine_type,
            operating_hours: JSON.stringify(json[i].operating_hours)
          }
        });
      }
      return tx.complete;
    });
  } else {
    dbPromise.then(db => {
      var tx = db.transaction(table, 'readwrite');
      for(var i = 0; i < json.length; i++) {
        tx.objectStore(table).put({
          id: json[i].id,
          restaurant_id: json[i].restaurant_id,
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
// Updating json with personal favorite restaurants
function CheckFavorite(json) {
  var dbPromise = idb.open('DB-Restaurants');
  dbPromise.then(function(db) {
    var tx = db.transaction('Favorites', 'readonly');
    var store = tx.objectStore('Favorites');
    return store.getAll();
  }).then(function(DataSet) {
    if (typeof DataSet !== 'undefined') {
      for(var i = 0; i < DataSet.length; i++) {
        for(var j = 0; j < json.length; j++) {
          if (DataSet[i].name === json[j].name) {
            json[j].is_favorite = DataSet[i].is_favorite;
          }
        }
      }
    }
    postMessage(json);
  });
}
// Load Restaurant Data
function LoadRestaurantData() {
  fetch(ReqURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    CreateDataBase();
    CheckFavorite(json);
    InsertValuesToDataBase('Restaurants',json);
  })
  .catch(function(error) {
    CreateDataBase();
    console.log(error,'Online request for '+ReqURL+' failed. Falling back to cached data');
    var dbPromise = idb.open('DB-Restaurants');
    dbPromise.then(function(db) {
      var tx = db.transaction('Restaurants', 'readonly');
      var store = tx.objectStore('Restaurants');
      return store.getAll();
    }).then(function(DataSet) {
      var json = [];
      for (var i = 0; i < DataSet.length; i++) {
        json.push(DataSet[i].data);
      }
      CheckFavorite(json);
    });
  });
}
// Reads and saves the reviews in the DB no post message is needed here.
function LoadRestaurantReviews() {
  fetch(ReviewsURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    CreateDataBase();
    InsertValuesToDataBase('Reviews',json);
  })
  .catch(function(error) {
    console.log(error,'Online request for '+ReviewsURL+' failed. Falling back to cached data');
  });
}
// checking to see if there are any updates to the data and returns either the
// data or a no need to update message
function UpdateRestaurantData() {
  fetch(ReqURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    postMessage(json);
    InsertValuesToDataBase('Restaurants',json);
  })
  .catch(function(error) {
    postMessage('OffLine');
  });
  fetch(ReviewsURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    InsertValuesToDataBase('Reviews',json);
  })
  .catch(function(error) {
    console.log('OffLine reviews only');
  });
}
// The main onmessage function this is where we get the data from the main js file
// and depending on what they are we do the approrpiate work
onmessage = function(Request) {
  var Action = Request.data;
  switch(Action) {
    case 'LoadRestaurantsList':
      LoadRestaurantData();
      LoadRestaurantReviews();
      break;
    case 'UpdateRestaurantsList':
      UpdateRestaurantData();
      break;
  }
}
