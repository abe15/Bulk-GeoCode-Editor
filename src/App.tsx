/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Header } from './Header';
import { useSelector, useDispatch } from 'react-redux';
import {
  importFromFile,
  moveGeocodes,
  updateTolerance,
  setActiveDeliveryPoints,
  deactivatePoint,
  undoAction,
  setViewPort,
} from './geocodes';
import {
  LayerStyleText,
  LayerStyleGeoFence,
  LayerStyleActivePoints,
  LayerStyleBasePoints,
} from './Styles';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import React, { ChangeEvent } from 'react';
import ReactMapGL, { MapEvent } from 'react-map-gl';
import { Source } from 'react-map-gl';
import { Layer } from 'react-map-gl';
import SideMenu from './SideMenu';

import { GeoCodeInfo } from './GeoCodeInfo';
import { RootState } from './store';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import UpdateIcon from '@material-ui/icons/Update';

import Typography from '@material-ui/core/Typography';

import InfoIcon from '@material-ui/icons/InfoOutlined';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass =
  require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;
let isCursorOverPoint: boolean = false;

// Variable to hold the starting xy coordinates
// when `mousedown` occured.

let start = [0, 0];
let isDragging: boolean = false;
// Variable to hold the current xy coordinates
// when `mousemove` or `mouseup` occurs.
let current = [0, 0];

// Variable for the draw box element.
let box: HTMLDivElement | null;
function exportFunction() {
  var a = document.createElement('a');
  var file = new Blob([localStorage.getItem('geocodes') as BlobPart], {
    type: 'text/plain',
  });
  a.href = URL.createObjectURL(file);
  a.download = 'json.txt';
  a.click();
}
function App() {
  const batchGeocodes = useSelector(
    (state: RootState) => state.geocodesReducer.points,
  );
  localStorage.setItem('geocodes', JSON.stringify(batchGeocodes));
  const activeDeliveryPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeDeliveryPoints.positions,
  );
  const activeRoadPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeRoadPoints.positions,
  );

  const geoFence = useSelector(
    (state: RootState) => state.geocodesReducer.geofences,
  );

  const activeDPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeDeliveryPoints.positions,
  );
  const activeRPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeRoadPoints.positions,
  );

  const dispatch = useDispatch();
  //Set up states for component
  const mapRef = React.useRef<any>();
  const viewport = useSelector((state: RootState) => state.geocodesReducer.viewport);

  let [dragPan, setDragPan] = React.useState<boolean>(true);
  let [dragRotate, setDragRotate] = React.useState<boolean>(true);
  let [mapStyle, setMapStyle] = React.useState<string>(
    'mapbox://styles/mapbox/streets-v11',
  );

  let [toleranceVal, setToleranceVal] = React.useState<number>(25);
  //load new GeoJson file
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileReader = new FileReader();
      try {
        fileReader.readAsText(e.target.files![0], 'UTF-8');
      } catch (e) {}
      fileReader.onload = (e) => {
        try {
          let temp: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
            JSON.parse(JSON.stringify(e.target!.result)),
          );
          dispatch(importFromFile({ r: temp }));

          //dispatch(setActiveDeliveryPoints({ activePointPositions: [0] }));

          dispatch(
            setViewPort({
              latitude: temp.features[0].geometry.coordinates[1],
              longitude: temp.features[0].geometry.coordinates[0],
              zoom: 15,
            }),
          );
        } catch (e) {
          // console.log(e);
        }
      };
    },
    [dispatch],
  );

  //Controls
  const onMouseEnter = React.useCallback(
    (e: MapEvent) => {
      if (!e.srcEvent.ctrlKey) {
        if (e.features !== undefined) {
          if (e.features[0].properties.type === 'roadEntry') {
            dispatch(
              setActiveDeliveryPoints({
                activePointPositions: [e.features[0].properties.position - 1],
              }),
            );
          } else if (e.features[0].properties.type === 'deliveryPoint') {
            dispatch(
              setActiveDeliveryPoints({
                activePointPositions: [e.features[0].properties.position],
              }),
            );
          }
        }

        isCursorOverPoint = true;
      }
    },
    [dispatch],
  );

  const mousePos = React.useCallback((e: [number, number]) => {
    let canvas = mapRef.current.getMap().getCanvasContainer();
    const rect = canvas.getBoundingClientRect();

    return [
      e[0], //- rect.left, //- canvas.clientLeft,
      e[1], //- rect.top, //- canvas.clientTop,
    ];
  }, []);

  const onMouseLeave = React.useCallback((e: MapEvent) => {
    if (!e.srcEvent.ctrlKey) {
      isCursorOverPoint = false;
      setDragPan(true);
    }
  }, []);

  const onMouseDown = React.useCallback(
    (e: MapEvent) => {
      if (!isCursorOverPoint && e.srcEvent.shiftKey) {
        if (e.srcEvent instanceof MouseEvent) {
          setDragRotate(false);
          setDragPan(false);
          start = mousePos([e.srcEvent.clientX, e.srcEvent.clientY]);

          isDragging = true;
        }
      }
    },
    [mousePos],
  );

  let onMouseUp = React.useCallback(
    (e: MapEvent) => {
      if (isDragging === true) {
        if (e.srcEvent instanceof MouseEvent) {
          if (box) {
            box.parentNode?.removeChild(box);
            box = null;
          }

          isDragging = false;
          const features = mapRef.current.queryRenderedFeatures(
            [
              [start[0], start[1]],
              [current[0], current[1]],
            ],
            {
              layers: ['0', '1'],
            },
          );
          let filter = ['in', 'position'];
          let activeDP: number[] = [];

          let activeRP: number[] = [];

          if (features.length !== 0) {
            console.log(features);
            filter = features.reduce(
              function (memo, x) {
                if (!memo.includes(x.properties.position)) {
                  memo.push(x.properties.position);
                  if (x.properties.type === 'roadEntry') {
                    activeDP.push(x.properties.position - 1);
                    activeRP.push(x.properties.position);
                    memo.push(x.properties.position - 1);
                  } else if (x.properties.type === 'deliveryPoint') {
                    activeDP.push(x.properties.position);
                    activeRP.push(x.properties.position + 1);
                    memo.push(x.properties.position + 1);
                  }
                }

                return memo;
              },
              ['in', 'position'],
            );
          }
          console.log(activeDP);
          dispatch(setActiveDeliveryPoints({ activePointPositions: activeDP }));
        }
        //  setDragPan(true);
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        }).then(() => {
          setDragRotate(true);
          setDragPan(true);
        });
      }
    },
    [dispatch],
  );

  const onClick = React.useCallback(
    (e: MapEvent) => {
      if (e.srcEvent.ctrlKey) {
        //move delivery point
        if (e.leftButton) {
          dispatch(
            moveGeocodes({
              lngLat: e.lngLat,
              pointType: 'delivery',
            }),
          );
        } //move road entry point
        else if (e.rightButton) {
          dispatch(
            moveGeocodes({
              lngLat: e.lngLat,
              pointType: 'roadEntry',
            }),
          );
        }
      }
    },
    [dispatch],
  );

  const onMouseMove = React.useCallback(
    (e: MapEvent) => {
      if (isDragging) {
        if (e.srcEvent instanceof MouseEvent) {
          current = mousePos([e.srcEvent.clientX, e.srcEvent.clientY]);

          if (!box) {
            box = document.createElement('div');
            box.classList.add('boxdraw');
            document.body.appendChild(box);
          }

          let minX = Math.min(start[0], current[0]),
            maxX = Math.max(start[0], current[0]),
            minY = Math.min(start[1], current[1]),
            maxY = Math.max(start[1], current[1]);

          // Adjust width and xy position of the box element ongoing
          let pos = 'translate(' + minX + 'px,' + minY + 'px)';
          box.style.transform = pos;
          //box.style.webkitTransform = pos;
          box.style.width = maxX - minX + 'px';
          box.style.height = maxY - minY + 'px';
        }
      }
    },
    [mousePos],
  );

  const handleClick = React.useCallback(
    (x: number) => {
      dispatch(deactivatePoint({ whichPoint: x }));
    },
    [dispatch],
  );

  const updateTolerances = React.useCallback(() => {
    dispatch(
      updateTolerance({
        tolerance: toleranceVal,
      }),
    );
  }, [dispatch, toleranceVal]);

  const onChange = React.useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setToleranceVal(parseInt(e.target.value));
    },
    [],
  );

  const onChangeMapStyle = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === 'mapbox://styles/mapbox/streets-v11') {
      setMapStyle('mapbox://styles/mapbox/streets-v11');
    } else if (e.target.value === 'mapbox://styles/mapbox/satellite-v9') {
      setMapStyle('mapbox://styles/mapbox/satellite-v9');
    }
  }, []);
  const undoUserAction = React.useCallback(() => {
    dispatch(undoAction({}));
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div
        css={css`
          display: block;
          overflow: hidden;
        `}
      >
        <SideMenu>
          <div style={{ position: 'sticky' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6"> Bulk GeoCode Data Editor</Typography>

              <Button onClick={() => {}}>
                <InfoIcon />
              </Button>
            </div>
            <div style={{ display: 'block' }}>
              <FormControl style={{ float: 'left' }}>
                <RadioGroup
                  aria-label="mapview"
                  color="primary"
                  name="mapview"
                  value={mapStyle}
                  onChange={(event, s) => {
                    onChangeMapStyle(event);
                  }}
                >
                  <FormControlLabel
                    value="mapbox://styles/mapbox/streets-v11"
                    control={<Radio color="primary" />}
                    label="Street View"
                  />
                  <FormControlLabel
                    value="mapbox://styles/mapbox/satellite-v9"
                    control={<Radio color="primary" />}
                    label="Satellite"
                  />
                </RadioGroup>
              </FormControl>
              <Button
                style={{ float: 'right' }}
                variant="outlined"
                component="label"
              >
                Import File
                <input type="file" hidden onChange={handleChange} />
              </Button>
              <Button
                style={{ float: 'right' }}
                variant="outlined"
                onClick={() => exportFunction()}
              >
                Export
              </Button>
            </div>

            <div style={{ paddingTop: '10vh', alignContent: 'center' }}>
              <TextField
                id="standard-secondary"
                label="Tolerance"
                value={toleranceVal}
                variant="outlined"
                onChange={(e) => {
                  onChange(e);
                }}
              ></TextField>
              <Button size="large" onClick={() => updateTolerances()}>
                <UpdateIcon />
              </Button>

              <Button
                style={{ textAlign: 'right' }}
                onClick={() => undoUserAction()}
              >
                UNDO LAST ACTION
              </Button>
            </div>

            <div style={{ textAlign: 'center', float: 'inline-end' }}>
              <Typography variant="subtitle1">
                {activeDeliveryPoints.length + ' Active Delivery Points'}
              </Typography>
            </div>
          </div>
          <div style={{ display: 'flex', overflowY: 'scroll', overflowX: 'hidden' }}>
            <List component="nav">
              {activeDeliveryPoints[0] < 0
                ? null
                : activeDeliveryPoints.map((x) => {
                    return (
                      <>
                        <ListItem
                          button
                          onClick={() => {
                            handleClick(x);
                          }}
                        >
                          <GeoCodeInfo
                            props={batchGeocodes.features[x].properties}
                          />
                        </ListItem>
                        <Divider />
                      </>
                    );
                  })}
            </List>
          </div>
        </SideMenu>
        <ReactMapGL
          css={css`
            overflow: hidden;
          `}
          {...viewport}
          width="100vw"
          height="100vh"
          interactiveLayerIds={['0']}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClick={onClick}
          dragPan={dragPan}
          dragRotate={dragRotate}
          mapStyle={mapStyle}
          onViewportChange={(nextViewport: any) =>
            dispatch(
              setViewPort({
                latitude: nextViewport!.latitude,
                longitude: nextViewport!.longitude,
                altitude: nextViewport!.altitude,
                bearing: nextViewport!.bearing,
                height: nextViewport!.height,
                maxPitch: nextViewport!.maxPitch,
                maxZoom: nextViewport!.maxZoom,
                minPitch: nextViewport!.minPitch,
                minZoom: nextViewport!.minZoom,
                pitch: nextViewport!.pitch,
                transitionDuration: nextViewport!.transitionDuration,
                width: nextViewport!.width,
                transitionInterruption: nextViewport!.transitionInterruption,
                zoom: nextViewport!.zoom,
              }),
            )
          }
          mapboxApiAccessToken="pk.eyJ1Ijoic2NocmFtZXIiLCJhIjoiZE1xaHJ0VSJ9.fWza13i01BBb7o7VjFu6hA"
          ref={mapRef}
        >
          {batchGeocodes && (
            <Source type="geojson" data={batchGeocodes}>
              <Layer
                {...{
                  ...LayerStyleActivePoints,
                  filter: ['in', 'position', ...activeDPoints, ...activeRPoints],
                }}
                id="2"
              />
              <Layer {...LayerStyleBasePoints} id="0" />
              <Layer {...LayerStyleText} id="1" />
            </Source>
          )}
          <Source type="geojson" data={geoFence}>
            <Layer
              {...{
                ...LayerStyleGeoFence,
                filter: ['in', 'position', ...activeDPoints],
              }}
              id="3"
            />
          </Source>
        </ReactMapGL>
      </div>
    </BrowserRouter>
  );
}

export default App;
