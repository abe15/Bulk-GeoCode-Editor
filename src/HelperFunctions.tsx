//Create geofence with radius in Km at active delivery point

export const createGeoJSONCircle = function (
  center: [number, number],
  radiusInKm: number,
  points: number,
): any {
  if (!points) points = 64;

  var coords = {
    latitude: center[0],
    longitude: center[1],
  };

  var km = radiusInKm * 0.001;

  let ret: [number, number][] = [];
  //new Array<[number, number]>(); // = [[]];
  var distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  var distanceY = km / 110.574;

  var theta, x, y: number;
  for (var i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
  };
};
