const J2000ms = 946728000000; // J2000 in UTC
const J2000dy = 10957.5;  // J2000 / msPerDay
const msPerDay = 86400000;// (1000 * 60 * 60 * 24);

const earth = {
  semiMajorAxis: 1.00000, 
  ecc: 0.01671,
  inc: 0.0,
  perihelionArg: 288.064,
  ascNodeLong: 174.873,
  meanAnomalyInit: 	357.529,
  perihelionLong: 102.937,
  longPerDay: 0.985608,
  eccArg: 0.99972,
};
const planets = {
  mercury: {
    semiMajorAxis: 0.38710, //a
    ecc: 0.20563, //e
    inc: 7.005, //i
    perihelionArg: 29.125,  //w
    ascNodeLong: 48.331,  //Ω
    meanAnomalyInit: 	174.795, //M[0]
    perihelionLong: 77.456, // Π perihelionArg + ascNodeLong
    longPerDay: 4.092317, //n
    eccArg: 0.37073,
  },
  venus: {
    semiMajorAxis: 0.72333, 
    ecc: 0.00677,
    inc: 3.395,
    perihelionArg: 54.884,
    ascNodeLong: 76.680,
    meanAnomalyInit: 	50.416,
    perihelionLong: 131.564,
    longPerDay: 1.602136,
    eccArg: 0.72330,
  },
  mars: {
    semiMajorAxis: 1.52368, 
    ecc: 0.09340,
    inc: 1.850,
    perihelionArg: 286.502,
    ascNodeLong: 49.558,
    meanAnomalyInit: 	19.373,
    perihelionLong: 336.060,
    longPerDay: 0.524039,
    eccArg: 1.51039,
  },
  jupiter: {
    semiMajorAxis: 5.20260, 
    ecc: 0.04849,
    inc: 1.303,
    perihelionArg: 273.867,
    ascNodeLong: 100.464,
    meanAnomalyInit: 	20.020,
    perihelionLong: 14.331,
    longPerDay: 0.083056,
    eccArg: 5.19037,
  },
  saturn: {
    semiMajorAxis: 9.55491, 
    ecc: 0.05551,
    inc: 2.489,
    perihelionArg: 339.391,
    ascNodeLong: 113.666,
    meanAnomalyInit: 	317.021,
    perihelionLong: 93.057,
    longPerDay: 0.033371,
    eccArg: 9.52547,
  },
};


const toDeg = (180 / Math.PI); 
const toRad = (Math.PI / 180);
const dayDiff = d =>  +((Math.round(d.getTime() / msPerDay * 4)/4).toFixed(2)) - J2000dy;
const mod = (n, m) => ((n % m) + m) % m;
const sin = (n) =>  Math.sin(n*toRad);
const cos = (n) => Math.cos(n*toRad);
const tan = (n) => Math.tan(n*toRad);
const asin = (n) => Math.asin(n)*toDeg;
const atan2 = (a,b) => circled(Math.atan2(a,b)*toDeg);
const circled = (angle) => mod(angle, 360);
function kep3(m, e){
  let m1 = sin(m);
  let m2 = sin(2*m);
  let m3 = sin(3*m);
  let a1 = 2 * m1;
  let a2 = 1.25 * m2;
  let a3 = -0.25 * m1 + 13/12*m3;
  return m + toDeg * e * (a1 + e * (a2 + e * a3));
}
function kep5(m, e){
  let s1 = sin(m);
  let s2 = sin(2*m);
  let s3 = sin(3*m);
  let s4 = sin(4*m);
  let s5 = sin(5*m);
  let a1 = 2 * s1;
  let a2 = 1.25 * s2;
  let a3 = 1.0833333333 * s3 - 0.25 * s1;
  let a4 = 1.0729166667 * s4 - .4583333333 * s2;
  let a5 = 0.0520833333 * s1 - .671875 * s3 + 1.142708333 * s5;
  return m + toDeg * e * (a1 + e * (a2 + e * (a3 + e * (a4 + e * a5))));
}
function sunBasedPosition(body, day){
  let meanAnomaly = circled(body.meanAnomalyInit + body.longPerDay * day);
  let trueAnomaly = body.ecc > 0.06 ? kep3(meanAnomaly, body.ecc) : kep5(meanAnomaly, body.ecc);
  let distanceSun = body.eccArg / (1 + body.ecc * cos(trueAnomaly));
  const w_v = body.perihelionArg + trueAnomaly;
  return {
    long: trueAnomaly,
    distance: distanceSun,
    x: distanceSun * (cos(body.ascNodeLong)*cos(w_v) - sin(body.ascNodeLong)*cos(body.inc)*sin(w_v)),
    y: distanceSun * (sin(body.ascNodeLong)*cos(w_v) + cos(body.ascNodeLong)*cos(body.inc)*sin(w_v)),
    z: distanceSun * sin(body.inc) * sin(w_v),
  };
}
function earthBasedPosition(body, earth, obliquity=23.4397){
  const x = body.x - earth.x;
  const y = body.y - earth.y;
  const z = body.z - earth.z;
  const dist = Math.sqrt(x*x + y*y + z*z);
  const lat = asin(z/dist);
  const long = atan2(y, x);
  return {
    ra: atan2(sin(long)*cos(obliquity) - tan(lat)*sin(obliquity), cos(long)),
    dec: asin(sin(lat)*cos(obliquity) + cos(lat)*sin(obliquity)*sin(long)),
    dist: dist
  };
}

function moonPosition(day){
  const moon = {
    long: [218.316,	13.176396],
    meanAnomaly: [134.963,	13.064993],
    distance: [93.272,	13.229350],
  };
  const distance = circled(moon.distance[0] + moon.distance[1] * day);
  const meanAnomaly = circled(moon.meanAnomaly[0] + moon.meanAnomaly[1] * day);
  const longitude = circled(moon.long[0] + moon.long[1] * day);
  return {
    ra: longitude + 6.289 * sin(meanAnomaly),
    dec: 5.128 * sin(distance),
    dist: 385001 - 20905 * cos(meanAnomaly),
  }
}