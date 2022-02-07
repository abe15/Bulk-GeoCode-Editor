import { createSlice, current } from '@reduxjs/toolkit';
import GeoJSON from 'geojson';
import { createGeoJSONCircle } from './HelperFunctions';
import storage from 'redux-persist/lib/storage';
import persistReducer from 'redux-persist/es/persistReducer';
import { undoable } from './undo';
const persistConfig = {
  key: 'root',
  storage,
};
const initialState = {
  points: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  geofences: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
  activeDeliveryPoints: { positions: [] as number[] },
  activeRoadPoints: { positions: [] as number[] },
  pastPoints: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  pastActiveDeliveryPoints: { positions: [] as number[] },
  pastActiveRoadPoints: { positions: [] as number[] },
  pastGeofences: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
};

export const geoCodeSlice = createSlice({
  name: 'geocodes',
  initialState,
  reducers: {
    importFromFile: (state, action) => {
      state.points = action.payload.r;
    },
    moveGeocodes: (state, action) => {
      //console.log(current(state));
      state.pastActiveDeliveryPoints = { positions: [] as number[] };
      state.pastPoints = JSON.parse(JSON.stringify(state.points));
      // state.pastPoints = Object.assign(state.points);
      action.payload.activePointPositions.forEach((x) => {
        state.points.features[x].geometry.coordinates = action.payload.lngLat;
      });
    },
    updateTolerance: (state, action) => {
      state.pastPoints = JSON.parse(JSON.stringify(state.points));
      // state.pastPoints = Object.assign(state.points);
      action.payload.activePointPositions.forEach((x) => {
        state.points.features[x].properties!.tolerance = action.payload.tolerance;
      });
    },
    setActiveDeliveryPoints: (state, action) => {
      let tempDelivery: number[] = [];
      let tempRoad: number[] = [];
      state.pastPoints = {
        type: 'FeatureCollection',
        features: [],
      };
      state.pastActiveDeliveryPoints.positions =
        state.activeDeliveryPoints.positions;
      state.pastActiveRoadPoints.positions = state.activeRoadPoints.positions;
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
      if (state.pastActiveDeliveryPoints.positions.length !== 0) {
        state.activeRoadPoints.positions = state.pastActiveRoadPoints.positions;
        state.activeDeliveryPoints.positions =
          state.pastActiveDeliveryPoints.positions;
        state.pastActiveDeliveryPoints = { positions: [] as number[] };
        state.pastActiveRoadPoints = { positions: [] as number[] };
      }
      console.log(current(state));
    },
    calculateGeofences: (state, action) => {
      let geoFencesArr = state.geofences.features;
      if (geoFencesArr.length === 0) {
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
      }
      state.geofences.features = geoFencesArr;
    },
  },
});

//const undoableReducer = undoable(geoCodeSlice.reducer);
//const persistedReducer = persistReducer(persistConfig, undoableReducer.reducer);
// Action creators are generated for each case reducer function
export const {
  importFromFile,
  moveGeocodes,
  updateTolerance,
  calculateGeofences,
  setActiveDeliveryPoints,
  deactivatePoint,
  undoAction,
} = geoCodeSlice.actions;
//export const { undoAction } = undoableReducer.actions;

export default geoCodeSlice.reducer;
