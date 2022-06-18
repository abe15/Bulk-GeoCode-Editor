//Create geofence with radius in Km at active delivery point

import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { PickInfo } from 'deck.gl';
import { Dispatch } from 'react';
import { MapRef } from 'react-map-gl';
import { bbox, bboxPolygon, distance, pointsWithinPolygon } from '@turf/turf';
export const onDragHelper = function (
  info: PickInfo<any>,
  e: MouseEvent,
  setCurrentPixels: React.Dispatch<React.SetStateAction<any[]>>,
  setCurrentCoords: React.Dispatch<React.SetStateAction<any[]>>,
  startPixels: any[],
  currentPixels: any[],
  isDragging: boolean,
  box: HTMLDivElement,
): any {
  if (isDragging) {
    setCurrentPixels([info.x, info.y]);
    //@ts-ignore
    setCurrentCoords([info.coordinate[0], info.coordinate[1]]);
    let minX = Math.min(startPixels[0], currentPixels[0]),
      maxX = Math.max(startPixels[0], currentPixels[0]),
      minY = Math.min(startPixels[1], currentPixels[1]),
      maxY = Math.max(startPixels[1], currentPixels[1]);

    // Adjust width and xy position of the box element ongoing
    let pos = 'translate(' + minX + 'px,' + minY + 'px)';
    box.style.transform = pos;
    //box.style.webkitTransform = pos;
    box.style.width = maxX - minX + 'px';
    box.style.height = maxY - minY + 'px';
  }
};

export const onDragStartHelper = function (
  info: PickInfo<any>,
  e: MouseEvent,
  setDragPan: React.Dispatch<React.SetStateAction<boolean>>,
  setDragRotate: React.Dispatch<React.SetStateAction<boolean>>,

  setStartPixels: React.Dispatch<React.SetStateAction<any[]>>,
  setStartCoords: React.Dispatch<React.SetStateAction<any[]>>,
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>,
): any {
  //console.log(e);
  //@ts-ignore
  if (e.srcEvent.shiftKey) {
    setDragRotate(false);
    setDragPan(false);
    setIsDragging(true);

    setStartPixels([info.x, info.y]);
    //@ts-ignore
    setStartCoords([info.coordinate[0], info.coordinate[1]]);
  }
};

export const onDragEndHelper = function (
  info: PickInfo<any>,
  e: MouseEvent,
  startCoords: any[],
  deck: React.MutableRefObject<any>,
  setDragPan: React.Dispatch<React.SetStateAction<boolean>>,
  setDragRotate: React.Dispatch<React.SetStateAction<boolean>>,

  dispatch: Dispatch<any>,
  setActiveDeliveryPoints: ActionCreatorWithPayload<any, string>,
  isDragging: boolean,
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>,
  box: HTMLDivElement,
  batchGeocodes: any,
): any {
  if (isDragging) {
    box.style.width = '0px';
    box.style.height = '0px';
    let pos = 'translate(0px, 100px)';
    box.style.transform = pos;
    //@ts-ignore
    let minLong = Math.min(startCoords[0], info.coordinate[0]);
    //@ts-ignore
    let maxLong = Math.min(startCoords[0], info.coordinate[0]);
    //@ts-ignore
    let minLat = Math.min(startCoords[1], info.coordinate[1]);
    //@ts-ignore
    let maxLat = Math.min(startCoords[1], info.coordinate[1]);

    let searchWithin = bboxPolygon([
      startCoords[0],
      startCoords[1],
      //@ts-ignore
      info.coordinate[0],
      //@ts-ignore
      info.coordinate[1],
    ]);

    var ptsWithin = pointsWithinPolygon(batchGeocodes, searchWithin);
    console.log(ptsWithin);
    //@ts-ignore
    var positions = ptsWithin.features.map((x) => x.properties.position);
    console.log(positions);

    let activeDP = new Set();

    let activeRP: number[] = [];
    positions.forEach((x) => {
      if (x % 2 === 0) {
        activeDP.add(x);
      } else if (x % 2 === 1) {
        activeDP.add(x - 1);
      }
    });

    dispatch(
      //@ts-ignore
      setActiveDeliveryPoints({ activePointPositions: [...activeDP] }),
    );

    setDragRotate(true);
    setDragPan(true);
    setIsDragging(false);
  }
};

export const onClickHelper = function (
  info: PickInfo<any>,
  e: MouseEvent,
  dispatch: Dispatch<any>,
  moveGeocodes: React.Dispatch<React.SetStateAction<any[]>>,
): any {
  //@ts-ignore
  if (e.srcEvent.ctrlKey) {
    //move delivery point
    //@ts-ignore
    if (e.leftButton) {
      //@ts-ignore
      dispatch(
        moveGeocodes({
          //@ts-ignore
          lngLat: info.coordinate,
          pointType: 'delivery',
        }),
      );
    } //move road entry point
    //@ts-ignore
    else if (e.rightButton) {
      //console.log(e);
      dispatch(
        moveGeocodes({
          //@ts-ignore
          lngLat: info.coordinate,
          pointType: 'roadEntry',
        }),
      );
    }
  }
};
