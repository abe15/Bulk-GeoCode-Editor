import { createSlice } from '@reduxjs/toolkit';
import GeoJSON from 'geojson';
import { createGeoJSONCircle } from './HelperFunctions';
const initialState = {
  points: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>,
  geofences: {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
};

export const geoCodeSlice = createSlice({
  name: 'geocodes',
  initialState,
  reducers: {
    importFromFile: (state, action) => {
      state.points = action.payload;
    },
    moveGeocodes: (state, action) => {
      action.payload.activePointPositions.forEach((x) => {
        state.points.features[x].geometry.coordinates = action.payload.lngLat;
      });
      //localStorage.setItem('geocodes', JSON.stringify(state));
    },
    updateTolerance: (state, action) => {
      action.payload.activePointPositions.forEach((x) => {
        state.points.features[x].properties!.tolerance = action.payload.tolerance;
      });
      //localStorage.setItem('geocodes', JSON.stringify(state));
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

// Action creators are generated for each case reducer function
export const { importFromFile, moveGeocodes, updateTolerance, calculateGeofences } =
  geoCodeSlice.actions;

export default geoCodeSlice.reducer;
