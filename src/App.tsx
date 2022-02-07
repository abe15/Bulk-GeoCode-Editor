/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Header } from './Header';
import { useSelector, useDispatch } from 'react-redux';
import {
  importFromFile,
  moveGeocodes,
  calculateGeofences,
  updateTolerance,
  setActiveDeliveryPoints,
  deactivatePoint,
  undoAction,
} from './geocodes';
import {
  LayerStyleText,
  LayerStyleGeoFence,
  LayerStyleActivePoints,
  LayerStyleBasePoints,
} from './Styles';
import { createGeoJSONCircle } from './HelperFunctions';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SVGOverlay } from 'react-map-gl';
import { NotFoundPage } from './NotFoundPage';
import React, { ChangeEvent } from 'react';
import ReactMapGL, { LayerProps, MapEvent } from 'react-map-gl';
import { Source } from 'react-map-gl';
import { Layer } from 'react-map-gl';
import SideMenu from './SideMenu';
import MyMapController from './MyMapController';
import { GeoCodeInfo } from './GeoCodeInfo';
import { RootState } from './store';

let isCursorOverPoint: boolean = false;
let interactiveLayerIds1: Array<string> = ['0', '1', '2'];
const mapController = new MyMapController();

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
  const [viewport, setViewport] = React.useState({
    latitude: 37.7577,
    longitude: -122.4376,
    zoom: 8,
  });

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
          dispatch(
            calculateGeofences({
              activePointPositions: Array.from(Array(temp.features.length).keys()),
            }),
          );

          dispatch(setActiveDeliveryPoints({ activePointPositions: [0] }));

          setViewport({
            latitude: temp.features[0].geometry.coordinates[1],
            longitude: temp.features[0].geometry.coordinates[0],
            zoom: 15,
          });
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

          dispatch(setActiveDeliveryPoints({ activePointPositions: activeDP }));
        }
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
              activePointPositions: activeDeliveryPoints,
              lngLat: e.lngLat,
            }),
          );
          dispatch(
            calculateGeofences({
              activePointPositions: activeDeliveryPoints,
            }),
          );
        } //move road entry point
        else if (e.rightButton) {
          dispatch(
            moveGeocodes({
              activePointPositions: activeRoadPoints,
              lngLat: e.lngLat,
            }),
          );
        }
      }
    },
    [activeDeliveryPoints, activeRoadPoints, dispatch],
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
        activePointPositions: activeDeliveryPoints,
        tolerance: toleranceVal,
      }),
    );
    dispatch(calculateGeofences({ activePointPositions: activeDeliveryPoints }));
  }, [activeDeliveryPoints, dispatch, toleranceVal]);

  const onChange = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setToleranceVal(parseInt(e.target.value));
  }, []);

  const onChangeMapStyle = React.useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    // console.log(e.target.value);
    if (e.target.value === 'streets') {
      setMapStyle('mapbox://styles/mapbox/streets-v11');
    } else if (e.target.value === 'satellite') {
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
        `}
      >
        <Header />
        <SideMenu>
          <div>
            <input type="file" onChange={handleChange} />
          </div>
          <div>
            <button onClick={() => exportFunction()}>Export changes</button>
          </div>
          <select
            id="selectedView"
            onChange={(e) => {
              onChangeMapStyle(e);
            }}
          >
              <option value="streets">Streets View</option> 
            <option value="satellite">Satellite View</option>
          </select>
          <div>
            <input
              type="text"
              value={toleranceVal}
              onChange={(e) => {
                onChange(e);
              }}
            ></input>
            <button onClick={() => updateTolerances()}>Update tolerance</button>
            <button onClick={() => undoUserAction()}>UNDO ACTION</button>
          </div>
          <div>
            <text>{activeDeliveryPoints.length}</text>
          </div>
          <div>
            {activeDeliveryPoints[0] < 0
              ? null
              : activeDeliveryPoints.map((x) => {
                  return (
                    <div>
                      <button
                        onClick={() => {
                          handleClick(x);
                        }}
                      >
                        Click
                      </button>
                      <GeoCodeInfo props={batchGeocodes.features[x].properties} />
                    </div>
                  );
                })}
          </div>
        </SideMenu>
        <ReactMapGL
          css={css``}
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
          onViewportChange={(nextViewport: any) => setViewport(nextViewport)}
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
