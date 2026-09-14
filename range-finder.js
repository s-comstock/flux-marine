/*--------------------
Range Finder JS
--------------------*/

const MAPBOX_ACCESS_TOKEN ='MAPBOX TOKEN HERE';

const RANGE_CIRCLE_SEGMENTS = 128;
const EARTH_RADIUS_METERS = 6371000;

// Spherical "destination point" formula: given a start point, bearing, and
// distance, returns the resulting [lng, lat]. Used to plot the range circle
// in real geographic coordinates so it stays accurate at any zoom/latitude.
function destinationPoint(lng, lat, bearingDegrees, distanceMeters) {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearingRad = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
}

function initRangeFinder() {
  const mapComponents = document.querySelectorAll('[data-range-finder-component]');
  if (!mapComponents.length) return;

  if (!window.mapboxgl) {
    console.error('Mapbox GL JS is not loaded. Make sure mapbox-gl.js is added in Webflow.');
    return;
  }

  if (!window.MapboxGeocoder) {
    console.error(
      'Mapbox Geocoder is not loaded. Make sure mapbox-gl-geocoder.min.js is added in Webflow.'
    );
    return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  mapComponents.forEach((component, componentIndex) => {
    const speedInput = component.querySelector('[data-rangefinder-speed]');

    if (!speedInput) {
      console.warn('Range finder speed display not found inside component:', component);
      return;
    }

    const mapElement =
      component.querySelector('[data-rangefinder-map]') ||
      component.querySelector('#map') ||
      document.getElementById('map');

    if (!mapElement) {
      console.warn('Range finder map element not found.');
      return;
    }

    const BASE_RANGE_MILES = 80; // Adjust max range in miles
    const RANGE_LOSS_PER_SPEED_UNIT = 1.6597; // Miles lost per mph increase
    const MILE_TO_METERS = 1609.344;
    const ROUND_TRIP_RANGE_RATIO = 0.5; // Round-trip circle is half the one-way radius

    const rangeShapeSourceId = `range-shape-source-${componentIndex}`;
    const rangeShapeLayerId = `range-shape-layer-${componentIndex}`;
    const roundTripShapeSourceId = `round-trip-shape-source-${componentIndex}`;
    const roundTripShapeLayerId = `round-trip-shape-layer-${componentIndex}`;
    const rangeLabelSourceId = `range-label-source-${componentIndex}`;
    const rangeLabelLayerId = `range-label-layer-${componentIndex}`;

    let currentLocation = [-71.279335, 41.66843];
    let lastSearchedLocation = [...currentLocation];
    let currentSpeed = getSpeedFromDisplay();
    let map;

    function getSpeedFromDisplay() {
      const speedText = speedInput.textContent.trim();
      const speedMatch = speedText.match(/-?\d+(\.\d+)?/);
      const speedNumber = speedMatch ? Number(speedMatch[0]) : 0;

      return Number.isFinite(speedNumber) ? speedNumber : 0;
    }

    function calculateRangeMiles(speed) {
      const range = BASE_RANGE_MILES - speed * RANGE_LOSS_PER_SPEED_UNIT;

      return Math.max(range, 0);
    }

    function calculateRangeMeters(speed) {
      return calculateRangeMiles(speed) * MILE_TO_METERS;
    }

    function calculateRoundTripRangeMeters(speed) {
      return calculateRangeMeters(speed) * ROUND_TRIP_RANGE_RATIO;
    }

    // Shared by both circles: center point, spoke out to the east edge, then
    // the rest of the circle traced back around to that same edge point.
    function createRangeCircleCoordinates(rangeMeters) {
      const [lng, lat] = currentLocation;
      const coordinates = [currentLocation];

      for (let i = 0; i <= RANGE_CIRCLE_SEGMENTS; i++) {
        const bearing = 90 + (360 / RANGE_CIRCLE_SEGMENTS) * i;
        coordinates.push(destinationPoint(lng, lat, bearing, rangeMeters));
      }

      return coordinates;
    }

    function createRangeShapeGeoJSON() {
      return {
        type: 'FeatureCollection',
        features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: createRangeCircleCoordinates(calculateRangeMeters(currentSpeed))
          },
          properties: {}
        }]
      };
    }

    function createRoundTripShapeGeoJSON() {
      return {
        type: 'FeatureCollection',
        features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: createRangeCircleCoordinates(calculateRoundTripRangeMeters(
              currentSpeed))
          },
          properties: {}
        }]
      };
    }

    function createRangeLabelGeoJSON() {
      const rangeMiles = calculateRangeMiles(currentSpeed);
      const rangeMeters = calculateRangeMeters(currentSpeed);
      const [lng, lat] = currentLocation;
      const edgePoint = destinationPoint(lng, lat, 90, rangeMeters);

      return {
        type: 'FeatureCollection',
        features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: edgePoint
          },
          properties: {
            label: `${Math.round(rangeMiles)} mi`
          }
        }]
      };
    }

    function getRangeBounds(location = currentLocation) {
      const rangeMeters = calculateRangeMeters(currentSpeed);
      const [lng, lat] = location;

      const north = destinationPoint(lng, lat, 0, rangeMeters);
      const east = destinationPoint(lng, lat, 90, rangeMeters);
      const south = destinationPoint(lng, lat, 180, rangeMeters);
      const west = destinationPoint(lng, lat, 270, rangeMeters);

      return [
        [west[0], south[1]],
        [east[0], north[1]]
      ];
    }

    function getRangeViewPadding() {
      // Tune these to taste — right is larger to leave room for the "XX mi" label.
      return window.matchMedia('(max-width: 991px)').matches ? {
        top: 40,
        bottom: 40,
        left: 40,
        right: 100
      } : { top: 60, bottom: 60, left: 60, right: 140 };
    }

    // Animates the camera to frame the range circle around `location`.
    // Uses cameraForBounds (a pure calculation) instead of fitBounds so
    // Mapbox's padding never becomes persistent map state — persistent
    // padding continuously shifts rendering away from the true center,
    // which is where the fixed center pin always sits.
    function easeToRangeBounds(location) {
      if (!map) return;

      const camera = map.cameraForBounds(getRangeBounds(location), {
        padding: getRangeViewPadding()
      });

      if (!camera) return;

      map.easeTo({
        center: camera.center,
        zoom: camera.zoom,
        duration: 800
      });
    }

    function updateRangeShape() {
      if (!map) return;

      const rangeShapeSource = map.getSource(rangeShapeSourceId);

      if (rangeShapeSource) {
        rangeShapeSource.setData(createRangeShapeGeoJSON());
      }

      const roundTripShapeSource = map.getSource(roundTripShapeSourceId);

      if (roundTripShapeSource) {
        roundTripShapeSource.setData(createRoundTripShapeGeoJSON());
      }

      const rangeLabelSource = map.getSource(rangeLabelSourceId);

      if (rangeLabelSource) {
        rangeLabelSource.setData(createRangeLabelGeoJSON());
      }
    }

    // The pin is fixed at the visual center of the map — this keeps
    // currentLocation (and everything derived from it) in sync with
    // wherever that center actually is, whether it moved from a drag,
    // a zoom, a search, or the recenter button.
    function syncLocationToMapCenter() {
      const center = map.getCenter();
      currentLocation = [center.lng, center.lat];
      updateRangeShape();
    }

    // Mapbox's own default marker SVG, extracted from a throwaway
    // `new mapboxgl.Marker({color})` instance — reused here as a plain,
    // fixed (non-geo-anchored) element so the visual look matches what
    // was there before. Anchored by its tip (y=35.25 in the 41px-tall
    // viewBox, measured via getBBox()) rather than its visual center, so
    // the pin's point — not its middle — sits exactly where the circle
    // and line are centered.
    function createCenterMarkerElement() {
      const centerMarker = document.createElement('div');

      centerMarker.style.position = 'absolute';
      centerMarker.style.top = '50%';
      centerMarker.style.left = '50%';
      centerMarker.style.transform = 'translate(-50%, -35.25px)';
      centerMarker.style.pointerEvents = 'none';
      centerMarker.style.zIndex = '1';
      centerMarker.innerHTML =
        '<svg display="block" height="41px" width="27px" viewBox="0 0 27 41">' +
        `<defs><radialGradient id="rf-marker-shadow-${componentIndex}"><stop offset="10%" stop-opacity="0.4"></stop><stop offset="100%" stop-opacity="0.05"></stop></radialGradient></defs>` +
        `<ellipse cx="13.5" cy="34.8" rx="10.5" ry="5.25" fill="url(#rf-marker-shadow-${componentIndex})"></ellipse>` +
        '<path fill="#05090c" d="M27,13.5C27,19.07 20.25,27 14.75,34.5C14.02,35.5 12.98,35.5 12.25,34.5C6.75,27 0,19.22 0,13.5C0,6.04 6.04,0 13.5,0C20.96,0 27,6.04 27,13.5Z"></path>' +
        '<path opacity="0.25" d="M13.5,0C6.04,0 0,6.04 0,13.5C0,19.22 6.75,27 12.25,34.5C13,35.52 14.02,35.5 14.75,34.5C20.25,27 27,19.07 27,13.5C27,6.04 20.96,0 13.5,0ZM13.5,1C20.42,1 26,6.58 26,13.5C26,15.9 24.5,19.18 22.22,22.74C19.95,26.3 16.71,30.14 13.94,33.91C13.74,34.18 13.61,34.32 13.5,34.44C13.39,34.32 13.26,34.18 13.06,33.91C10.28,30.13 7.41,26.31 5.02,22.77C2.62,19.23 1,15.95 1,13.5C1,6.58 6.58,1 13.5,1Z"></path>' +
        '<circle fill="white" cx="13.5" cy="13.5" r="5.5"></circle>' +
        '</svg>';

      return centerMarker;
    }

    function createRecenterControl() {
      return {
        onAdd: function () {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('aria-label', 'Re-center map');
          button.title = 'Re-center map';
          const icon = document.createElement('span');
          icon.textContent = '⌖';

          icon.style.display = 'block';
          icon.style.lineHeight = '1';
          icon.style.transform = 'translateY(-2px)';

          button.appendChild(icon);

          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
          button.style.padding = '0';
          button.style.fontSize = '20px';
          button.style.fontWeight = '700';

          button.addEventListener('click', () => {
            easeToRangeBounds(lastSearchedLocation);
          });

          container.appendChild(button);

          return container;
        },

        onRemove: function () {
          // Mapbox requires this method for custom controls.
        }
      };
    }

    function updateStoredSpeed() {
      currentSpeed = getSpeedFromDisplay();
      updateRangeShape();
    }

    updateStoredSpeed();

    const speedObserver = new MutationObserver(() => {
      updateStoredSpeed();
    });

    speedObserver.observe(speedInput, {
      childList: true,
      characterData: true,
      subtree: true
    });

    map = new mapboxgl.Map({
      container: mapElement,
      style: 'mapbox://styles/flux-marine/cmu17qq4500c301ssh6n69h0e',
      bounds: getRangeBounds(),
      fitBoundsOptions: {
        padding: getRangeViewPadding()
      }
    });

    // The constructor's bounds/fitBoundsOptions fit leaves padding stored
    // as persistent map state, which would keep shifting rendering away
    // from the true center. Clear it immediately — this does not move the
    // camera or change zoom, it only stops that ongoing render offset.
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });

    map.scrollZoom.disable();

    map.addControl(
      new mapboxgl.NavigationControl(),
      'bottom-right'
    );

    map.addControl(
      createRecenterControl(),
      'bottom-right'
    );

    mapElement.appendChild(createCenterMarkerElement());

    map.on('move', syncLocationToMapCenter);
    syncLocationToMapCenter();

    map.on('load', () => {
      map.addSource(rangeShapeSourceId, {
        type: 'geojson',
        data: createRangeShapeGeoJSON()
      });

      map.addLayer({
        id: rangeShapeLayerId,
        type: 'line',
        source: rangeShapeSourceId,
        paint: {
          'line-color': '#05090c',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      map.addSource(roundTripShapeSourceId, {
        type: 'geojson',
        data: createRoundTripShapeGeoJSON()
      });

      map.addLayer({
        id: roundTripShapeLayerId,
        type: 'line',
        source: roundTripShapeSourceId,
        paint: {
          'line-color': '#05090c',
          'line-width': 2,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2]
        }
      });

      map.addSource(rangeLabelSourceId, {
        type: 'geojson',
        data: createRangeLabelGeoJSON()
      });

      map.addLayer({
        id: rangeLabelLayerId,
        type: 'symbol',
        source: rangeLabelSourceId,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 18,
          'text-anchor': 'left',
          'text-offset': [0.5, 0],
          'text-font': ['Inter Regular'],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#05090c',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    });

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: 'Bristol, RI, 02809',
      flyTo: false
    });

    geocoder.on('result', (event) => {
      const result = event.result;

      if (!result || !result.center) return;

      const lng = Number(result.center[0]);
      const lat = Number(result.center[1]);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      lastSearchedLocation = [lng, lat];
      currentLocation = lastSearchedLocation;
      updateRangeShape();

      easeToRangeBounds(currentLocation);
    });

    map.addControl(geocoder, 'top-right');
  });
}

