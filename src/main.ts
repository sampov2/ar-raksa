import './style.css'
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwODU5OWYyYy1jZmY3LTQxMmQtODc0OC02MTJlZThkYWJiYjQiLCJpZCI6MTg1NTIzLCJpYXQiOjE3MDMwNzQ3MTh9.eXHMDBi4AGAHJInMfIGt3AL22k1fQCBXovfhHx4-TQg';

/*
const m_mono: any = new Cesium.UrlTemplateImageryProvider({
    url: 'https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}.png',
    credit: new Cesium.Credit(
        "Maptiles by <a href='http://mierune.co.jp' target='_blank'>MIERUNE</a>, under CC BY. Data by <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors, under ODbL."
    ),
});
*/

const viewer = new Cesium.Viewer('map', {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    timeline: false,
    animation: false,
    //baseLayer: Cesium.ImageryLayer.fromProviderAsync(m_mono,{}),
    terrain: Cesium.Terrain.fromWorldTerrain(),
    
});

/*
const wmsProvider = new Cesium.WebMapServiceImageryProvider({
    url: 'https://kartta.hel.fi/ws/geoserver/avoindata/wms',
    //layers: 'avoindata:Kiinteisto_alue' // <- getFeatureInfo
    //layers: 'avoindata:Kiinteistokartta'
    layers: 'avoindata:Aluevuokraus_alue',
    parameters: {
        transparent: 'true',
        format: 'image/png'
    }
});


const wmsLayer = new Cesium.ImageryLayer(wmsProvider, {});

viewer.imageryLayers.add(wmsLayer);
*/

const wfsUrl = new URL('https://kartta.hel.fi/ws/geoserver/avoindata/wfs');
wfsUrl.searchParams.append('SERVICE', 'WFS');
wfsUrl.searchParams.append('REQUEST', 'GetFeature');
wfsUrl.searchParams.append('VERSION', '2.0.0');
wfsUrl.searchParams.append('TYPENAMES', 'avoindata:Aluevuokraus_alue');
wfsUrl.searchParams.append('SRSNAME', 'EPSG:4326');
wfsUrl.searchParams.append('OUTPUTFORMAT', 'application/json');
wfsUrl.searchParams.append('COUNT', '2000');


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
    //console.log('ds', ds)
  })
/*
viewer.dataSources.add(Cesium.GeoJsonDataSource.load(wfsUrl.toString(), {
    stroke: Cesium.Color.HOTPINK,
    fill: Cesium.Color.PINK,
    strokeWidth: 3,
    markerSymbol: '?'
  }));
  */


viewer.camera.flyTo({
    //destination: Cesium.Cartesian3.fromDegrees(24.9375, 60.03, 10000.0),
    destination: Cesium.Cartesian3.fromDegrees(24.9375, 60.15, 1000.0),
    orientation: {
        pitch: -0.6,
        roll: 0.0,
    },
});
