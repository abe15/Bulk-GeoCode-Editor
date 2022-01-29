/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Header } from './Header';

import {
  fontFamily,
  fontSize,
  gray2,
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
import { batch, Provider } from 'react-redux';
import ReactMapGL, { LayerProps, MapEvent, MapRef } from 'react-map-gl';
import { Source } from 'react-map-gl';
import { Layer } from 'react-map-gl';
import SideMenu from './SideMenu';
import MyMapController from './MyMapController';
import { features } from 'process';
import { GeoCodeInfo } from './GeoCodeInfo';
import InteractiveMap from 'react-map-gl';
import mapboxgl, { Map } from 'mapbox-gl';
import { getSourceMapRange } from 'typescript';
let isCursorOverPoint: boolean = false;
let interactiveLayerIds1: Array<string> = ['0', '1', '2'];
const mapController = new MyMapController();

// Variable to hold the starting xy coordinates
// when `mousedown` occured.
let eglobal;
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
  //Set up states for component
  const mapRef = React.useRef<any>();
  const [viewport, setViewport] = React.useState({
    latitude: 37.7577,
    longitude: -122.4376,
    zoom: 8,
  });
  let [batchGeocodes, setBatchGeocodes] = React.useState<
    GeoJSON.FeatureCollection<GeoJSON.Point>
  >({
    type: 'FeatureCollection',
    features: [],
  });

  let [geoFence, setGeoFence] = React.useState<
    GeoJSON.FeatureCollection<GeoJSON.Polygon>
  >({
    type: 'FeatureCollection',
    features: [],
  });
  let [activeDeliveryPoint, setActiveDeliveryPoint] = React.useState<number[]>([-1]);

  let [activeRoadPoint, setActiveRoadPoint] = React.useState<number[]>([-1]);

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
      fileReader.readAsText(e.target.files![0], 'UTF-8');
      fileReader.onload = (e) => {
        let temp: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
          JSON.parse(JSON.stringify(e.target!.result)),
        );

        setBatchGeocodes(temp);
        localStorage.setItem('geocodes', JSON.stringify(temp));
        setActiveDeliveryPoint([0]);
        setActiveRoadPoint([1]);
        // console.log(JSON.parse(JSON.stringify(e.target!.result)));
      };
    },
    [],
  );

  //Set layer styles for different map elements
  let [layerStyle3, setLayerStyle3] = React.useState<LayerProps>(
    LayerStyleActivePoints,
  );
  let [layerStyle, setLayerStyle] = React.useState<LayerProps>(LayerStyleBasePoints);
  let [layerStyle2, setLayerStyle2] = React.useState<LayerProps>(LayerStyleText);
  let [layerStyleGeoFence, setLayerStyleGeoFence] =
    React.useState<LayerProps>(LayerStyleGeoFence);

  //Controls
  const onMouseEnter = React.useCallback(
    (e: MapEvent) => {
      if (!e.srcEvent.ctrlKey) {
        if (e.features !== undefined) {
          let dPoint = -1;
          let rPoint = -1;
          if (e.features[0].properties.type === 'roadEntry') {
            setActiveDeliveryPoint([e.features[0].properties.position - 1]);
            setActiveRoadPoint([e.features[0].properties.position]);
            dPoint = e.features[0].properties.position - 1;
            rPoint = e.features[0].properties.position;
          } else if (e.features[0].properties.type === 'deliveryPoint') {
            setActiveDeliveryPoint([e.features[0].properties.position]);
            setActiveRoadPoint([e.features[0].properties.position + 1]);
            dPoint = e.features[0].properties.position;
            rPoint = e.features[0].properties.position + 1;
          }
          //console.log(batchGeocodes);
          let tempGeo = {
            ...geoFence,
            features: [
              createGeoJSONCircle(
                [
                  batchGeocodes.features[dPoint]?.geometry.coordinates[1],
                  batchGeocodes.features[dPoint]?.geometry.coordinates[0],
                ],
                batchGeocodes.features[dPoint].properties?.tolerance,
                64,
              ),
            ],
          };

          setGeoFence(tempGeo);
          let temp = { ...layerStyle3, filter: ['in', 'position', dPoint, rPoint] };
          setLayerStyle3(temp);
        }

        isCursorOverPoint = true;
      }
    },
    [batchGeocodes, layerStyle3, geoFence],
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
          let geoFencesArr: any = [];
          activeDP.forEach((x) =>
            geoFencesArr.push(
              createGeoJSONCircle(
                [
                  batchGeocodes.features[x]?.geometry.coordinates[1],
                  batchGeocodes.features[x]?.geometry.coordinates[0],
                ],
                batchGeocodes.features[x].properties?.tolerance,
                64,
              ),
            ),
          );

          let tempGeo = {
            ...geoFence,
            features: geoFencesArr,
          };

          setGeoFence(tempGeo);

          setActiveDeliveryPoint(activeDP);
          setActiveRoadPoint(activeRP);
          let temp = { ...layerStyle3, filter: filter };
          setLayerStyle3(temp);
        }
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        }).then(() => {
          setDragRotate(true);
          setDragPan(true);
        });
      }
    },
    [batchGeocodes, geoFence, layerStyle3],
  );

  const onClick = React.useCallback(
    (e: MapEvent) => {
      console.log(e);

      if (e.srcEvent.ctrlKey) {
        let tempArr: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
          JSON.stringify(batchGeocodes),
        );

        let idx = [-1];
        //move delivery point
        if (e.leftButton) {
          idx = activeDeliveryPoint;
        } //move road entry point
        else if (e.rightButton) {
          idx = activeRoadPoint;
        }
        idx.forEach((x) => {
          tempArr.features[x].geometry.coordinates = e.lngLat;
          console.log(tempArr.features[x].geometry.coordinates);
        });

        let geoFencesArr: any = [];
        activeDeliveryPoint.forEach((x) =>
          geoFencesArr.push(
            createGeoJSONCircle(
              [
                tempArr.features[x].geometry.coordinates[1],
                tempArr.features[x].geometry.coordinates[0],
              ],
              tempArr.features[x].properties?.tolerance,
              64,
            ),
          ),
        );

        let tempGeo = {
          ...geoFence,
          features: geoFencesArr,
        };

        setGeoFence(tempGeo);

        setBatchGeocodes(tempArr);
        localStorage.setItem('geocodes', JSON.stringify(tempArr));
      }
    },
    [activeDeliveryPoint, activeRoadPoint, batchGeocodes, geoFence],
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
            //canvas.appendChild(box);
            console.log(box);
            console.log('inhere');
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
      let activeDP: number[] = activeDeliveryPoint.filter((n) => n !== x);
      let activeRP: number[] = activeRoadPoint.filter((n) => n !== x + 1);
      let tempArr: LayerProps = JSON.parse(JSON.stringify(layerStyle3));

      tempArr.filter = tempArr.filter?.filter((n) => {
        return !((n !== x && !(n !== x + 1)) || (!(n !== x) && n !== x + 1));
      });
      console.log(tempArr.filter);
      setActiveDeliveryPoint(activeDP);
      setActiveRoadPoint(activeRP);
      setLayerStyle3(tempArr);
    },
    [activeDeliveryPoint, activeRoadPoint, layerStyle3],
  );

  const updateTolerances = React.useCallback(() => {
    let tempArr: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
      JSON.stringify(batchGeocodes),
    );
    let geoFencesArr: any = [];

    activeDeliveryPoint.forEach((x) => {
      if (tempArr.features[x].properties) {
        tempArr.features[x].properties!.tolerance = toleranceVal;

        geoFencesArr.push(
          createGeoJSONCircle(
            [
              tempArr.features[x]?.geometry.coordinates[1],
              tempArr.features[x]?.geometry.coordinates[0],
            ],
            toleranceVal,
            64,
          ),
        );
      }
    });

    let tempGeo = {
      ...geoFence,
      features: geoFencesArr,
    };
    setGeoFence(tempGeo);
    setBatchGeocodes(tempArr);
    localStorage.setItem('geocodes', JSON.stringify(tempArr));
  }, [activeDeliveryPoint, batchGeocodes, geoFence, toleranceVal]);

  const onChange = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    setToleranceVal(parseInt(e.target.value));
  }, []);
  const onChangeMapStyle = React.useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    if (e.target.value === 'streets') {
      setMapStyle('mapbox://styles/mapbox/streets-v11');
    } else if (e.target.value === 'satellite') {
      setMapStyle('mapbox://styles/mapbox/satellite-v9');
    }
  }, []);

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
          </div>
          <div>
            <text>{activeDeliveryPoint.length}</text>
          </div>
          <div>
            {activeDeliveryPoint[0] < 0
              ? null
              : activeDeliveryPoint.map((x) => {
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
              <Layer {...layerStyle3} id="2" />
              <Layer {...layerStyle} id="0" />
              <Layer {...layerStyle2} id="1" />
            </Source>
          )}
          <Source type="geojson" data={geoFence}>
            <Layer {...layerStyleGeoFence} id="3" />
          </Source>
        </ReactMapGL>
      </div>
    </BrowserRouter>
  );
}

export default App;
