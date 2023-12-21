import './style.css'
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import { debounceFactory } from './debounce';

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwODU5OWYyYy1jZmY3LTQxMmQtODc0OC02MTJlZThkYWJiYjQiLCJpZCI6MTg1NTIzLCJpYXQiOjE3MDMwNzQ3MTh9.eXHMDBi4AGAHJInMfIGt3AL22k1fQCBXovfhHx4-TQg';

const viewer = new Cesium.Viewer('map', {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    timeline: false,
    animation: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
});

const wfsUrl = new URL('https://kartta.hel.fi/ws/geoserver/avoindata/wfs');
wfsUrl.searchParams.append('SERVICE', 'WFS');
wfsUrl.searchParams.append('REQUEST', 'GetFeature');
wfsUrl.searchParams.append('VERSION', '2.0.0');
wfsUrl.searchParams.append('TYPENAMES', 'avoindata:Aluevuokraus_alue');
wfsUrl.searchParams.append('SRSNAME', 'EPSG:4326');
wfsUrl.searchParams.append('OUTPUTFORMAT', 'application/json');
wfsUrl.searchParams.append('COUNT', '2000');

Cesium.GeoJsonDataSource.load(wfsUrl.toString(), {
    stroke: Cesium.Color.HOTPINK,
    fill: Cesium.Color.PINK,
    clampToGround: true,
    strokeWidth: 3,
    markerSymbol: '?'
}).then((ds) => {
    ds.entities.values.forEach((entity) => {
        if (entity.polygon !== undefined) {
            entity.polygon.extrudedHeight = new Cesium.ConstantProperty(60)
        }
    });
    viewer.dataSources.add(ds);
});


// Helsinki 3D tiles
/*
Cesium.Cesium3DTileset.fromUrl('https://kartta.hel.fi/3d/datasource-data/2bcc0c80-51b8-412b-af72-b3ecc7007a18/tileset.json').then((tileset) => {
    viewer.scene.primitives.add(tileset);
});
*/

// Google 3D tiles
Cesium.Cesium3DTileset.fromIonAssetId(2275207, {}).then((tileset) => {
    viewer.scene.primitives.add(tileset);
});

const devicePositionDebouncer = debounceFactory();

function flyTo(lat : number, lon : number, altitude : number) {
    devicePositionDebouncer.call('flyTo', () => {
        return new Promise<void>((resolve) => {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
                complete: resolve
            });
        })
    });
}
navigator.geolocation.watchPosition((pos) => {
    flyTo(pos.coords.latitude, pos.coords.longitude, pos.coords.altitude || 20.0)
}, (error) => console.error(error), {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
})


var currentScreenOrientation : number = window.orientation || 0; // active default

// THIS ALLOWS YOU TO USE THE PHONE TO CONTROL THE CESIUM CAMERA VIEW
if (window.DeviceOrientationEvent) {
	window.addEventListener('deviceorientation', onDeviceOrientationChanged, false);
}

/**
* Rotation Matrix functions
* Convert Yaw/alpha/Z, Pitch/beta/X, Roll/gamma/Y to and from rotation matrix, apply transformations
*
* @author Rich Tibbett <https://dev.opera.com/articles/w3c-device-orientation-usage/>, Nghia Ho <http://nghiaho.com/?page_id=846>, Derek Wee
* @copyright 
* @version 0.1
* @license 
*/

window.addEventListener('orientationchange', function() {
	currentScreenOrientation = window.orientation;
}, false);

var degtorad = Math.PI / 180; // Degree-to-Radian conversion

//R.1: Converting deviceorientation angles to a Rotation Matrix representation
function getBaseRotationMatrix( alpha : number | null, beta : number | null, gamma : number | null ) {
	var _x = beta  ? beta  * degtorad : 0; // beta value
	var _y = gamma ? gamma * degtorad : 0; // gamma value
	var _z = alpha ? alpha * degtorad : 0; // alpha value

	var cX = Math.cos( _x );
	var cY = Math.cos( _y );
	var cZ = Math.cos( _z );
	var sX = Math.sin( _x );
	var sY = Math.sin( _y );
	var sZ = Math.sin( _z );

	//
	// ZXY-ordered rotation matrix construction.
	//

	var m11 = cZ * cY - sZ * sX * sY;
	var m12 = - cX * sZ;
	var m13 = cY * sZ * sX + cZ * sY;

	var m21 = cY * sZ + cZ * sX * sY;
	var m22 = cZ * cX;
	var m23 = sZ * sY - cZ * cY * sX;

	var m31 = - cX * sY;
	var m32 = sX;
	var m33 = cX * cY;

	return [
        m11,    m12,    m13,
        m21,    m22,    m23,
        m31,    m32,    m33
	];
}

//R.2: Fixing our rotation matrix frame relative to the current screen orientation
function getScreenTransformationMatrix( screenOrientation : number) {
	var orientationAngle = screenOrientation ? screenOrientation * degtorad : 0;

	var cA = Math.cos( orientationAngle );
	var sA = Math.sin( orientationAngle );

	// Construct our screen transformation matrix
	var r_s = [
        cA,    -sA,    0,
        sA,    cA,     0,
        0,     0,      1
	];

	return r_s;
}

//R.3: Fix our rotation matrix frame relative to our application’s world orientation (rotation around x-axis)
function getWorldTransformationMatrix() {
	var x = -90 * degtorad;

	var cA = Math.cos( x );
	var sA = Math.sin( x );

	// Construct our world transformation matrix
	var r_w = [
        1,     0,    0,
        0,     cA,   -sA,
        0,     sA,   cA
	];

	return r_w;
}


//R.4: Computing our final rotation matrix representation
function matrixMultiply( a : number[], b : number[]) {
	var final = [];

	final[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
	final[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
	final[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

	final[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
	final[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
	final[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

	final[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
	final[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
	final[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

	return final;
}

//Returns a 3 x 3 rotation matrix as an array
function computeMatrix(alpha : number | null, beta : number | null, gamma : number | null, currentScreenOrientation : number) {
	var rotationMatrix = getBaseRotationMatrix(alpha, beta, gamma); // R

	var screenTransform = getScreenTransformationMatrix( currentScreenOrientation ); // r_s

	var screenAdjustedMatrix = matrixMultiply( rotationMatrix, screenTransform ); // R_s

	var worldTransform = getWorldTransformationMatrix(); // r_w

	var finalMatrix = matrixMultiply( screenAdjustedMatrix, worldTransform ); // R_w
    
	return finalMatrix; // [ m11, m12, m13, m21, m22, m23, m31, m32, m33 ]
}

function getYawPitchRoll(rotationMatrix : number[]) {
	var rm11 = rotationMatrix[0]; //var rm12 = rotationMatrix[1]; var rm13 = rotationMatrix[2];
	var rm21 = rotationMatrix[3]; //var rm22 = rotationMatrix[4]; var rm23 = rotationMatrix[5];
	var rm31 = rotationMatrix[6]; var rm32 = rotationMatrix[7]; var rm33 = rotationMatrix[8];
	
	var yaw = Math.atan2(rm21, rm11);
	var pitch = Math.atan2(rm32, rm33);
	var roll = Math.atan2(rm31, Math.sqrt(Math.pow(rm32,2) + Math.pow(rm33,2)));
	
	return [yaw, pitch, roll]; //[yaw, pitch, roll]
}

function onDeviceOrientationChanged(eventData : DeviceOrientationEvent) {
	var beta = eventData.beta;
	var gamma = eventData.gamma;
	var alpha = eventData.alpha;
	
	var matrix = computeMatrix(alpha, beta, gamma, currentScreenOrientation);
	
    var yawPitchRoll = getYawPitchRoll(matrix);

    devicePositionDebouncer.call('orientation', () => {
        return new Promise<void>((resolve) => {
            viewer.camera.setView({
                orientation : {
                    heading: -yawPitchRoll[0],
                    pitch: yawPitchRoll[1],
                    roll: -yawPitchRoll[2]
                }
            });
            resolve();
        });
    })
}
