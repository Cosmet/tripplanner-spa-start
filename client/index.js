const mapboxgl = require("mapbox-gl");
const buildMarker = require("./marker.js");
const { fetchChoices, fetchAddBtns, fetchItinerary } = require('./fetch');

mapboxgl.accessToken = "pk.eyJ1IjoiamVzc2ViYXJyb24iLCJhIjoiY2o4YzM4YW94MDVoczJ3bzA4d3djY3ZyaiJ9.GiBaJzlZ-8bna3DtYlkVyQ";

// const fullstackCoords = [-74.009, 40.705] // NY
const fullstackCoords = [-87.6320523, 41.8881084] // CHI

const map = new mapboxgl.Map({
  container: "map",
  center: fullstackCoords, // FullStack coordinates
  zoom: 12, // starting zoom
  style: "mapbox://styles/mapbox/streets-v10" // mapbox has lots of different map styles available.
});

const marker = buildMarker("activities", fullstackCoords);
marker.addTo(map);

let mapMarkers = {};

fetch('/api/attractions')
.then(res => res.json())
.then(data => {
  populator(data);
})
.catch(console.error);

document.addEventListener("DOMContentLoaded", () => {
  addToItineraryListeners();

  const itinerary = document.getElementById('itinerary');
  itinerary.addEventListener('click', event => {
    if (event.target.tagName === 'BUTTON') {
      deleteButton(event.target);
    }
  });
});

function populator(data) {
  const categories = fetchChoices();
  const markerType = [null, 'hotels', 'restaurants', 'activities'];

  for (let i = 1; i < categories.length; i++) {
    data[i].forEach((attraction) => {
      const attractionOption = optionBuilder(attraction, markerType[i]);
      categories[i].appendChild(attractionOption);
    });
  }
}

function addToItineraryListeners() {
  const categories = fetchChoices();
  const addButtons = fetchAddBtns();
  const itinerary = fetchItinerary();

  for (let i = 1; i < categories.length; i++) {
    addButtons[i].addEventListener('click', () => {
      appendToItinerary(itinerary[i], categories[i]);
    })
  }
}

function appendToItinerary(itinerary, category) {
  const itineraryChild = itineraryChildBuilder(category);
  const children = [].slice.call(itinerary.children)

  if (!duplicateChecker(children, itineraryChild)) {
    itinerary.appendChild(itineraryChild);
    markerBuilder(itineraryChild);
  }
}

function duplicateChecker(children, itineraryChild) {
  let dupeOrNot = false;
  children.forEach(child => {
    if (child.innerHTML === itineraryChild.innerHTML) {
      dupeOrNot = true;
    }
  });
  return dupeOrNot;
}

function optionBuilder(attraction, markerType) {
  const attractionOption = document.createElement('option');
  attractionOption.innerHTML = attraction.name;
  attractionOption.value = attraction.name;
  attractionOption.dataset.coords = attraction.place.location;
  attractionOption.dataset.type = markerType;
  attractionOption.id = attraction.id;

  return attractionOption;
}

function itineraryChildBuilder(category){
  const itineraryChild = document.createElement('li');
  const optionID = category.selectedOptions[0].id;
  const categoryType = category.selectedOptions[0].dataset.type;
  const coords = category.selectedOptions[0].dataset.coords;

  itineraryChild.dataset.coords = coords;
  itineraryChild.dataset.type = categoryType;
  itineraryChild.id = categoryType + '-' + optionID;
  itineraryChild.innerHTML = category.value + `<button class='delete-btn' id="${categoryType}-${optionID}-btn">x</button>`;

  return itineraryChild;
}

function markerBuilder(itineraryChild) {
  const coords = itineraryChild.dataset.coords.split(',');
  const type = itineraryChild.dataset.type;
  const newMarker = buildMarker(type, coords);
  const attractionID = itineraryChild.id;
  newMarker.addTo(map);
  map.flyTo({
    center: coords,
    curve: 2.5,
    zoom: 15,
    speed: 0.5
  });
  mapMarkers[attractionID] = newMarker;
}

function deleteButton(buttonClicked) {
  const labelID = buttonClicked.id.slice(0, -4);
  const label = document.getElementById(labelID);
  const labelParent = label.parentElement;
  labelParent.removeChild(label);
  mapMarkers[labelID].remove();
  delete mapMarkers[labelID];
}

