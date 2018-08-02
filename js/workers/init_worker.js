'use strict';
importScripts('idb.js');

const ReqURL = 'http://localhost:1337/restaurants';

// Creating & Upgrading the Database
function CreateDataBase() {
  var dbPromise = idb.open('DB-Restaurants', 1, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('Restaurants', {keyPath: 'id'});
    }
  });
}
// Inserting Values to the DataBase
function InsertValuesToDataBase(json) {
  var dbPromise = idb.open('DB-Restaurants');
  dbPromise.then(db => {
    var tx = db.transaction('Restaurants', 'readwrite');
    for(var i = 0; i < json.length; i++) {
      tx.objectStore('Restaurants').put({
        id: json[i].id,
        data: {
          id: json[i].id,
          name: json[i].name,
          neighborhood: json[i].neighborhood,
          photograph: json[i].photograph,
          address: json[i].address,
          latlng: JSON.stringify(json[i].latlng),
          cuisine_type: json[i].cuisine_type,
          operating_hours: JSON.stringify(json[i].operating_hours),
          reviews: JSON.stringify(json[i].reviews)}
      });
    }
    return tx.complete;
  });
}
// Load Restaurant Data
function LoadRestaurantData() {
  fetch(ReqURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    postMessage(json);
    CreateDataBase();
    InsertValuesToDataBase(json);
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
      postMessage(json);
    });
  });
}
// checking to see if there are any updates to the data and returns either the
// data or a no need to update message
function UpdateRestaurantData() {
  fetch(ReqURL)
  .then(function(data) { return data.json(); })
  .then(function(json) {
    postMessage(json);
    InsertValuesToDataBase(json);
  })
  .catch(function(error) {
    postMessage('OffLine');
  });
}
// Loading map for offline use
function LoadGoogleMapView() {
  postMessage('Google Map View Loaded OK!!!');
}

// The main onmessage function this is where we get the data from the main js file
// and depending on what they are we do the approrpiate work
onmessage = function(Request) {
  var Action = Request.data;
  switch(Action) {
    case 'LoadRestaurantsList':
      LoadRestaurantData();
      break;
    case 'UpdateRestaurantsList':
      UpdateRestaurantData();
      break;
    case 'LoadGoogleMapView':
      LoadGoogleMapView();
      break;
  }
}
