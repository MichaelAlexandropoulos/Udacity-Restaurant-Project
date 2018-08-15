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
      if (json instanceof Array) {
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
      } else {
        if (json.createdAt === '') { json.updated = true; }
        tx.objectStore(table).put({
          id: json.id,
          data: {
            updated: json.updated,
            id: json.id,
            restaurant_id: json.restaurant_id,
            name: json.name,
            createdAt: '',
            updatedAt: '',
            rating: json.rating,
            comments: json.comments
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
// Updating json with personal favorite restaurants
function CheckFavorite(RestData,json) {
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
    var RtrnData = new Array(RestData, json);
    postMessage(RtrnData);
  });
}
// Loading the reviews for the Restaurant.
function LoadRestaurantReviews(id,RestData) {
  var RequestID = ReviewsURL+ '/?restaurant_id='+id;
  fetch(RequestID)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    CheckFavorite(RestData,json);
    InsertValuesToDataBase('Reviews',json);
  })
  .catch(function(error) {
    var dbPromise = idb.open('DB-Restaurants');
    dbPromise.then(function(db) {
      var tx = db.transaction('Reviews', 'readonly');
      var store = tx.objectStore('Reviews');
      return store.getAll();
    }).then(function(DataSet) {
      var json = [];
      for (var i = 0; i < DataSet.length; i++) {
        if (DataSet[i].data.restaurant_id == id) { json.push(DataSet[i].data); }
      }
      CheckFavorite(RestData,json);
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
// Updates the review list of the restaurant based on the entry we send.
function UpdateRestaurantsReviews(RevData) {
  fetch(ReviewsURL+'/', { method: 'post', body: JSON.stringify(RevData)})
  .then(function(response) { return response.json(); })
  .then(function(json) {
    InsertValuesToDataBase('Reviews',json);
  })
  .catch(function(error) {
    var dbPromise = idb.open('DB-Restaurants');
    dbPromise.then(function(db) {
      var tx = db.transaction('Reviews', 'readonly');
      var store = tx.objectStore('Reviews');
      return store.getAll();
    }).then(function(DataSet) {
      var newid = 0;
      for (var i = 0; i < DataSet.length; i++) {
        newid = DataSet[i].data.id;
      }
      RevData.id = newid + 1;
      RevData.updated = true;
      InsertValuesToDataBase('Reviews',RevData);
    });
  });

// http://localhost:1337/reviews/{ method: 'post', body: {"restaurant_id": "1", "name": "mike", "rating": "3", "comments": "Test comment"}}
}
// checking to see if there are any updates to the data and returns either the
// data or a no need to update message
function UpdateRestaurantPageReviews(RestID) {
  var dbPromise = idb.open('DB-Restaurants');
  dbPromise.then(function(db) {
    var tx = db.transaction('Reviews', 'readonly');
    var store = tx.objectStore('Reviews');
    return store.getAll();
  }).then(function(DataSet) {
    var check = false;
    var json = [];
    for (var i = 0; i < DataSet.length; i++) {
      if (DataSet[i].data.updated == true) {
        var review = {
          "restaurant_id": DataSet[i].data.restaurant_id,
          "name": DataSet[i].data.name,
          "rating": DataSet[i].data.rating,
          "comments": DataSet[i].data.comments
        }
        json.push(review);
        check = true;
      }
    }
    if (check) {
      fetch(ReviewsURL+'/', { method: 'post', body: JSON.stringify(json)})
      .then(function(response) { return response.json(); })
      .then(function(json) {
        if (RestID === 'NONE') { postMessage(json); }
          else { LoadRestaurantData(RestID); }
      })
      .catch(function(error) {
        if (RestID === 'NONE') { postMessage('Offline'); }
          else { LoadRestaurantData(RestID); }
      });
    } else {
      if (RestID === 'NONE') { postMessage('Offline'); }
        else { LoadRestaurantData(RestID); }
    }
  });
}
// The main onmessage function this is where we get the data from the main js file
// and depending on what they are we do the approrpiate work
onmessage = function(Request) {
  var Action = Request.data[0];
  var id = Request.data[1];
  switch(Action) {
    case 'LoadRestaurantData':
      UpdateRestaurantPageReviews(id);
      break;
    case 'UpdateRestaurantPage':
      UpdateRestaurantPageReviews('NONE');
      break;
    case 'UpdateReviews':
      UpdateRestaurantsReviews(id);
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
