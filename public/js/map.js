mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
    zoom: 9, // starting zoom
});

console.log(coordinates)

const marker1 = new mapboxgl.Marker({color:"black"})
    .setLngLat(coordinates)
    .setPopup(
        new mapboxgl.Popup({offset: 25})
    .setHTML(
        `<h3>${listing.location}</h3><p>Exact Location provided after booking</p>`
    )
    .setMaxWidth("300px")
    )
    .addTo(map);

