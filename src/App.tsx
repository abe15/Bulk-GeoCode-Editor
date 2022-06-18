/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

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
import { bbox, bboxPolygon, distance, pointsWithinPolygon } from '@turf/turf';

import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from 'deck.gl';
import React, { ChangeEvent } from 'react';
import StaticMap, { Layer, LayerProps, Source } from 'react-map-gl';
import {
  onDragStartHelper,
  onDragHelper,
  onDragEndHelper,
  onClickHelper,
} from './HelperFunctions';
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
import localforage from 'localforage';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import hexRgb from 'hex-rgb';

var md5 = require('md5');
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass =
  require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;
let isCursorOverPoint: boolean = false;

// Variable to hold the starting xy coordinates
// when `mousedown` occured.
// Variable for the draw box element.
let box: HTMLDivElement = document.createElement('div');
document.body.appendChild(box);
const boxdraw = css`
  background: rgba(56, 135, 190, 0.1);
  border: 2px solid #3887be;
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
`;
box.classList.add('boxdraw');
function exportFunction() {
  var a = document.createElement('a');
  localforage.getItem('geocodes').then((x) => {
    var file = new Blob([x as BlobPart], {
      type: 'text/plain',
    });
    a.href = URL.createObjectURL(file);
    a.download = 'json.txt';
    a.click();
  });
}
function App() {
  const batchGeocodes = useSelector(
    (state: RootState) => state.geocodesReducer.points,
  );
  let [textData, setTextData] = React.useState<any[]>([]);
  React.useEffect(() => {
    // storing input name
    localforage.setItem('geocodes', JSON.stringify(batchGeocodes));

    let tempData = [];

    batchGeocodes.features.forEach((element) => {
      tempData.push({
        //@ts-ignore
        moduli: element.properties.moduli.toString(),
        //@ts-ignore
        coordinates: element.geometry.coordinates,
      });
    });
    setTextData(tempData);
  }, [batchGeocodes]);

  // Variable to hold the current xy coordinates
  // when `mousemove` or `mouseup` occurs.

  let [currentPixels, setCurrentPixels] = React.useState<any[]>([0, 0]);
  let [startPixels, setStartPixels] = React.useState<any[]>([0, 0]);
  let [currentCoords, setCurrentCoords] = React.useState<any[]>([0, 0]);
  let [startCoords, setStartCoords] = React.useState<any[]>([0, 0]);
  let [isDragging, setIsDragging] = React.useState<boolean>(false);
  const activeDeliveryPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeDeliveryPoints.positions,
  );
  const activeRoadPoints = useSelector(
    (state: RootState) => state.geocodesReducer.activeRoadPoints.positions,
  );

  const geoFences = useSelector(
    (state: RootState) => state.geocodesReducer.geofences,
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
  let [data, setData] = React.useState<any>({});

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

  const onHover = React.useCallback(
    (info: any, e: any) => {
      if (!e.srcEvent.ctrlKey) {
        if (info.layer && info.layer.id && info.layer.id === 'geoPoints') {
          if (info.object !== undefined) {
            // console.log(info.object);
            if (info.object && info.object.properties.type === 'roadEntry') {
              dispatch(
                setActiveDeliveryPoints({
                  activePointPositions: [info.index - 1],
                }),
              );
            } else if (
              info.object &&
              info.object.properties.type === 'deliveryPoint'
            ) {
              dispatch(
                setActiveDeliveryPoints({
                  activePointPositions: [info.index],
                }),
              );
            }
          }

          isCursorOverPoint = true;
        }
      }
    },
    [dispatch],
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

  let layer = [
    new GeoJsonLayer({
      //@ts-ignore
      data: geoFences,
      id: 'geofences',
      pointType: 'circle',
      //circle settings
      getFillColor: (d: any) =>
        d.properties.type === 'deliveryPoint'
          ? [38, 247, 253, 100]
          : [247, 0, 39, 100],
      getLineWidth: 1,
      getLineColor: (d: any) =>
        d.properties.type === 'deliveryPoint'
          ? [38, 247, 253, 100]
          : [247, 0, 39, 100],
      getPointRadius: (d: any) => {
        //console.log(d);
        if (
          activeDeliveryPoints
            .concat(activeRoadPoints)
            .includes(d.properties.position)
        ) {
          return d.properties.type === 'deliveryPoint' ? d.properties.tolerance : 8;
        }
        return 0;
      },
      pointRadiusUnits: 'meters',
      pointRadiusScale: 1,
      autoHighlight: true,
      pickable: false,
      pointBillboard: false,
      filled: true,
      updateTriggers: {
        getPointRadius: activeDeliveryPoints,
      },
      parameters: {
        depthTest: false,
        blend: true,
        desynchronized: false,
        antialias: true,
        stencil: true,
      },
    }),

    new GeoJsonLayer({
      //@ts-ignore
      data: batchGeocodes,
      id: 'geoPoints',
      pointType: 'circle+text',

      pointAntialiasing: true,
      getLineWidth: 2,
      //circle settings
      getFillColor: (d: any) => {
        if (d.properties.type === 'deliveryPoint') {
          return [38, 247, 253, 255];
        } else {
          return [247, 0, 39, 255];
        }
      },
      getLineColor: (d: any) => {
        if (d.properties.type === 'deliveryPoint') {
          var numberPattern = /\d+/g;

          var t1 = d.properties.addressLine1.match(numberPattern);
          if (t1) {
            var l = hexRgb(md5(t1[0]).substring(0, 6));
            return [0, l.blue, l.green, 255];
            //return [1, 1, 1, 255];
          }
          return [38, 247, 253, 255];
        } else {
          return [247, 0, 39, 255];
        }
      },
      getPointRadius: (d: any) => (d.properties.type === 'deliveryPoint' ? 8 : 8),
      pointRadiusUnits: 'pixels',
      pointRadiusScale: 1,
      autoHighlight: false,
      pickable: true,
      pointBillboard: false,
      filled: true,
      //text settings
      textFontWeight: 'normal',

      getText: (d: any) => {
        var numberPattern = /\d+/g;
        var t1 = d.properties.addressLine1.match(numberPattern);
        var t2 = d.properties.addressLine2.match(numberPattern);
        if (t1 && t1.length === 2) {
          return 'APT' + t1[1];
        }
        if (t2) {
          return 'APT' + t2[0];
        }
        return d.properties.moduli.toString();
      },
      getTextColor: (d: any) => [0, 0, 0, 255],
      textFontFamily: 'Helvetica Neue',
      textSizeUnits: 'pixels',

      textBillboard: true,
      textBackground: false,
      textCharacterSet: 'auto',
      getTextSize: (d: any) => (d.properties.type === 'deliveryPoint' ? 16 : 16),
      textSizeScale: 1,
      textOutlineWidth: 1,
      textSizeMaxPixels: 42,
      elevationScale: 100,
      getElevation: 10,
      textFontSettings: {
        buffer: 5,
        sdf: true,
        cutoff: 0.5,
        radius: 0,
        smoothing: 0.4,
      },

      opacity: 1,
      parameters: {
        depthTest: false,
        blend: false,
        desynchronized: true,
        antialias: true,
        stencil: true,
        powerPreference: 'high-performance',
      },
    }),
  ];

  return (
    <div>
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
                : activeDeliveryPoints.map((x, idx) => {
                    return (
                      <>
                        <ListItem
                          button
                          key={idx.toString()}
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

        <div onContextMenu={(evt) => evt.preventDefault()}>
          <DeckGL
            initialViewState={viewport}
            //@ts-ignorets-ignore
            controller={{ dragPan: dragPan, dragRotate: dragRotate }}
            width="100vw"
            height="100vh"
            ref={mapRef}
            onHover={(info, e) => onHover(info, e)}
            onClick={(info, e) => onClickHelper(info, e, dispatch, moveGeocodes)}
            onDragStart={(info, e) => {
              //console.log(e.srcEvent);
              onDragStartHelper(
                info,
                e,
                setDragPan,
                setDragRotate,
                setStartPixels,
                setStartCoords,
                setIsDragging,
              );
            }}
            onDrag={(info, e) => {
              onDragHelper(
                info,
                e,
                setCurrentPixels,
                setCurrentCoords,
                startPixels,
                currentPixels,
                isDragging,
                box,
              );
            }}
            onDragEnd={(info, e) => {
              onDragEndHelper(
                info,
                e,
                startCoords,
                mapRef,
                setDragPan,
                setDragRotate,
                dispatch,
                setActiveDeliveryPoints,
                isDragging,
                setIsDragging,
                box,
                batchGeocodes,
              );
            }}
            layers={layer}
          >
            <StaticMap
              reuseMaps
              mapStyle={mapStyle}
              mapboxAccessToken={
                'pk.eyJ1Ijoic2NocmFtZXIiLCJhIjoiZE1xaHJ0VSJ9.fWza13i01BBb7o7VjFu6hA'
              }
            ></StaticMap>
          </DeckGL>
        </div>
      </div>
    </div>
  );
}
export default App;
