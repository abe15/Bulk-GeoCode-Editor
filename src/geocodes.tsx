import { createSlice, current } from '@reduxjs/toolkit';
import GeoJSON from 'geojson';

import storage from 'redux-persist/lib/storage';
import persistReducer from 'redux-persist/es/persistReducer';

const initialState = {
  points: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,

  pointsData: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  geofences: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  activeDeliveryPoints: { positions: [] as number[] },
  activeRoadPoints: { positions: [] as number[] },
  pastPoints: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  pastGeofences: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
  viewport: {
    latitude: 37.8 as number,
    longitude: -96 as number,
    altitude: 1.5,
    bearing: 0 as number,
    height: 100 as number,
    maxPitch: 85 as number,
    maxZoom: 24 as number,
    minPitch: 0 as number,
    minZoom: 0 as number,
    pitch: 0 as number,
    transitionDuration: 0 as number,
    width: 100 as number,
    transitionInterruption: 1 as number,
    zoom: 3 as number,
  },
};

export const geoCodeSlice = createSlice({
  name: 'geocodes',
  initialState,
  reducers: {
    importFromFile: (state, action) => {
      state.points = action.payload.r;

      let activePointPositions = Array.from(
        Array(action.payload.r.features.length).keys(),
      );
      state.geofences = {
        type: 'FeatureCollection',
        features: [],
      } as GeoJSON.FeatureCollection<GeoJSON.Point>;
      let geoFencesArr = state.geofences.features;
      activePointPositions.forEach((x) => {
        geoFencesArr.push({
          type: 'Feature',
          properties: {
            tolerance: state.points.features[x].properties?.tolerance,
            type: state.points.features[x].properties?.type,
            position: x,
            active: 0,
          },
          geometry: {
            type: 'Point',
            coordinates: state.points.features[x]?.geometry.coordinates,
          },
        });
      });
    },

    moveGeocodes: (state, action) => {
      //console.log(current(state));
      //state.pastActiveDeliveryPoints = { positions: [] as number[] };
      state.pastPoints = JSON.parse(JSON.stringify(state.points));
      state.pastGeofences = JSON.parse(JSON.stringify(state.geofences));
      // state.pastPoints = Object.assign(state.points);

      if (action.payload.pointType === 'delivery') {
        state.activeDeliveryPoints.positions.forEach((x) => {
          state.points.features[x].geometry.coordinates = action.payload.lngLat;
          state.geofences.features[x].geometry.coordinates = action.payload.lngLat;
        });
      } else {
        state.activeRoadPoints.positions.forEach((x) => {
          state.points.features[x].geometry.coordinates = action.payload.lngLat;
          state.geofences.features[x].geometry.coordinates = action.payload.lngLat;
        });
      }
    },
    updateTolerance: (state, action) => {
      state.pastPoints = JSON.parse(JSON.stringify(state.points));
      state.pastGeofences = JSON.parse(JSON.stringify(state.geofences));
      // state.pastPoints = Object.assign(state.points);
      state.activeDeliveryPoints.positions.forEach((x) => {
        state.geofences.features[x].properties!.tolerance = action.payload.tolerance;
      });
    },
    setActiveDeliveryPoints: (state, action) => {
      let tempDelivery: number[] = [];
      let tempRoad: number[] = [];

      action.payload.activePointPositions.forEach((x) => {
        tempDelivery.push(x);

        tempRoad.push(x + 1);
      });
      state.activeDeliveryPoints.positions = tempDelivery;
      state.activeRoadPoints.positions = tempRoad;
    },
    deactivatePoint: (state, action) => {
      state.activeDeliveryPoints.positions =
        state.activeDeliveryPoints.positions.filter(
          (n) => n !== action.payload.whichPoint,
        );
      state.activeRoadPoints.positions = state.activeRoadPoints.positions.filter(
        (n) => n !== action.payload.whichPoint + 1,
      );
    },
    setViewPort: (state, action) => {
      state.viewport.latitude = action.payload.latitude;
      state.viewport.longitude = action.payload.longitude;
      state.viewport.zoom = action.payload.zoom;
      state.viewport.altitude = action.payload.altitude;
      state.viewport.bearing = action.payload.bearing;
      state.viewport.maxPitch = action.payload.maxPitch;
      state.viewport.maxZoom = action.payload.maxZoom;
      state.viewport.minPitch = action.payload.minPitch;
      state.viewport.zoom = action.payload.zoom;
      state.viewport.transitionDuration = action.payload.transitionDuration;
      //state.viewport.transitionInterruption = action.payload.transitionInterruption;
    },
    undoAction: (state, action) => {
      console.log(current(state));
      if (state.pastPoints.features.length !== 0) {
        const previous = state.pastPoints;
        state.points = previous;
        state.pastPoints = {
          type: 'FeatureCollection',
          features: [],
        };
      }
      if (state.pastGeofences.features.length !== 0) {
        const previous = state.pastGeofences;
        state.geofences = previous;
        state.pastGeofences = {
          type: 'FeatureCollection',
          features: [],
        };
      }

      console.log(current(state));
    },
    calculateGeofences: (state, action) => {
      let geoFencesArr = state.geofences.features;
      /* if (geoFencesArr.length === 0) {
        action.payload.activePointPositions.forEach((x) => {
          geoFencesArr.push(
            createGeoJSONCircle(
              [
                state.points.features[x]?.geometry.coordinates[1],
                state.points.features[x]?.geometry.coordinates[0],
              ],
              state.points.features[x].properties?.tolerance,
              64,
            ),
          );

          geoFencesArr[x].properties!['position'] = x;
        });
      } else {
        action.payload.activePointPositions.forEach((x) => {
          geoFencesArr[x] = createGeoJSONCircle(
            [
              state.points.features[x]?.geometry.coordinates[1],
              state.points.features[x]?.geometry.coordinates[0],
            ],
            state.points.features[x].properties?.tolerance,
            64,
          );
          geoFencesArr[x].properties!['position'] = x;
        });
      }*/
      // state.geofences.features = geoFencesArr;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  importFromFile,
  moveGeocodes,
  updateTolerance,
  calculateGeofences,
  setActiveDeliveryPoints,
  deactivatePoint,
  undoAction,
  setViewPort,
} = geoCodeSlice.actions;

export default geoCodeSlice.reducer;
//export default persistReducer(persistConfig, geoCodeSlice.reducer);
