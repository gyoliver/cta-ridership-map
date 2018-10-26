// CONSTANTS
var RAIL = "CTA_RailLines_Dissolve";
var STATION_POINT = "CTA_RailStations_wRidership";
var STATION_POLYGON_SINGLE = "CTA_RailStations_Single_Polygon_Final";
var STATION_POLYGON_MULTIPLE = "CTA_RailStations_Multiple_Polygon_Final";

var DEFAULT_STATION_SYMBOL_SMALL_SCALE = {
  type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
  style: "circle",
  color: "white",
  size: "8px",  // pixels
  outline: {  // autocasts as new SimpleLineSymbol()
    color: [0, 0, 0],
    width: 1  // points
  }
};

var TRANSPARENT_STATION_SYMBOL =  {
  type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
  style: "circle",
  color: [0, 0, 0, 0],
  size: "8px",  // pixels
  outline: {  // autocasts as new SimpleLineSymbol()
    color: [0, 0, 0, 0],
    width: 1  // points
  }
}

var DEFAULT_STATION_RENDERER_SMALL_SCALE = {
  type: "simple",
  symbol: DEFAULT_STATION_SYMBOL_SMALL_SCALE
}

var TRANSPARENT_STATION_RENDERER = {
  type: "simple",
  symbol: TRANSPARENT_STATION_SYMBOL
}

// GLOBAL VARIABLES
var showStationsByRidership = false;

var stationLabelClass = {
  // autocasts as new LabelClass()
  labelExpressionInfo: {
    expression: document.getElementById("station-name-crosswalk").text
  },
  labelPlacement: "above-right",
  symbol: {
    type: "text",  // autocasts as new TextSymbol()
    font: {  // autocast as new Font()
      size: 10,
      family: "Noto Sans",
      weight: "bold"
    }
  }
};
  
  
require([
    "esri/Map",
    "esri/WebMap",
    "esri/views/MapView",
    "esri/renderers/SimpleRenderer",
    "esri/renderers/ClassBreaksRenderer",
    "esri/layers/support/LabelClass",
    "dojo/dom",  // require dojo/dom for getting the DOM element
    "dojo/on",   // require dojo/on for listening to events on the DOM
    "dojo/domReady!"
], function(Map, WebMap, MapView, SimpleRenderer, ClassBreaksRenderer, LabelClass, dom, on) {
    
    /************************************************************
    * Creates a new WebMap instance. A WebMap must reference
    * a PortalItem ID that represents a WebMap saved to
    * arcgis.com or an on-premise portal.
    ************************************************************/
  var webmap = new WebMap({
    portalItem: { // autocasts as new PortalItem()
      id: "10980b8494464d8d969292cbc7d7aa3b"
    }
  });
  
  var view = new MapView({
    map: webmap,
    container: "viewDiv"
  });

  var integerFormat = {
    digitSeparator: true,  // Uses a comma separator in numbers >999
    places: 0  // Sets the number of decimal places to 0 and rounds up
  }
  
  var decimalFormat = {
    digitSeparator: false,
    places: 2
  }
  
  // Configure expression used to put the user-friendly station names in the pop-up 
  var arcadeExpressionInfos = [{
    name: "station-name-crosswalk", 
    title: "Bah",
    expression: document.getElementById("station-name-crosswalk").text
  }];
  
  // Configure popups
  var stationPopupTemplate = {  // autocasts as new PopupTemplate()
    title: "Station: {expression/station-name-crosswalk}",
    content: [{
      type: "fields",
      fieldInfos: [{
        fieldName: "AnnualAver",  // The field whose values you want to format
        label: "Average Daily Boardings",
        visible: true,
        format: integerFormat
      }, {
        fieldName: "Weekday",  // The field whose values you want to format
        label: "Weekday",
        visible: true,
        format: integerFormat
      }, {
        fieldName: "Saturday",  // The field whose values you want to format
        label: "Saturday",
        visible: true,
        format: integerFormat
      }, {
        fieldName: "Sunday",  // The field whose values you want to format
        label: "Sunday",
        visible: true,
        format: integerFormat
      }, {
        fieldName: "DifWD_Disp",  // The field whose values you want to format
        label: "Weekday (Compared to  Avg)",
        visible: true,
        format: decimalFormat
      }, {
        fieldName: "DifSa_Disp",  // The field whose values you want to format
        label: "Saturday (Compared to Avg)",
        visible: true,
        format: decimalFormat
      }, {
        fieldName: "DifSu_Disp",  // The field whose values you want to format
        label: "Sunday (Compared to  Avg)",
        visible: true,
        format: decimalFormat
      }]
    }],
    expressionInfos: arcadeExpressionInfos
  };
  
  var railLinePopupTemplate = {
    title: "{Color} Line"
  }

  var stationClassBreaksRenderer = new ClassBreaksRenderer({
    field: "AnnualAver"
  });
  configureStationClassBreaksRenderer(stationClassBreaksRenderer);
  
  var stationsSymbologyToggle = document.getElementById("symbologToggleCheckbox");
  
  // Set popup templates and labels
  view.when(function() {
    webmap.layers.forEach(function(layer) {
      if (layer.title === STATION_POINT || layer.title === STATION_POLYGON_SINGLE || layer.title === STATION_POLYGON_MULTIPLE) {
        layer.popupTemplate = stationPopupTemplate;
      } else if (layer.title === RAIL) {
        layer.popupTemplate = railLinePopupTemplate;
      }
      
      if (layer.title === STATION_POINT) {
        stationsSymbologyToggle.addEventListener("change", function () {
          
          if (stationsSymbologyToggle.checked) {
            showStationsByRidership = true;
            layer.visible = true;
            layer.renderer = stationClassBreaksRenderer;
            layer.labelingInfo = [stationLabelClass];
          } else {
            showStationsByRidership = false;
            layer.visible = false;
          }
          
          setDefaultStationSymbology(webmap, view.scale);
          
        });
      }
      layer.labelsVisible = true;
      
      if (layer.title === STATION_POINT) {
        console.log(layer);
      }
      
    })
  });
  
  view.watch("scale", function(newValue){
    console.log(newValue)
    setRailLinesSymbology(webmap, newValue);
    setDefaultStationSymbology(webmap, newValue);
  });
  
  
  
  
  // set Station symbology (class breaks)
  // Set station symbology
  var stationPoints = webmap.layers.find(function(layer) {
    return layer.title === STATION_POINT;
  });

  
  function configureStationClassBreaksRenderer(stationClassBreaksRenderer) {
    
    var symbolType = "simple-marker";
    var symbolStyle = "circle";
    var fillColor = [255, 255, 255, 0.75];
    var outlineColor = "black";
    var outlineWidth = 1;
    
    stationClassBreaksRenderer.addClassBreakInfo({
      minValue: 0,
      maxValue: 999.999,
      symbol: {
        type: symbolType,  // autocasts as new SimpleMarkerSymbol()
        style: symbolStyle,
        color: fillColor,
        size: "4px",  // pixels
        outline: {  
          color: outlineColor,
          width: outlineWidth
        }
      }
    });

    stationClassBreaksRenderer.addClassBreakInfo({
      minValue: 1000,
      maxValue: 2499.999,
      symbol: {
        type: symbolType,  // autocasts as new SimpleMarkerSymbol()
        style: symbolStyle,
        color: fillColor,
        size: "8px",  // pixels
        outline: {  // autocasts as new SimpleLineSymbol()
          color: outlineColor,
          width: outlineWidth
        }
      }
    });

    stationClassBreaksRenderer.addClassBreakInfo({
      minValue: 2500,
      maxValue: 4999.999,
      symbol: {
        type: symbolType,  // autocasts as new SimpleMarkerSymbol()
        style: symbolStyle,
        color: fillColor,
        size: "12px",  // pixels
        outline: {  // autocasts as new SimpleLineSymbol()
          color: outlineColor,
          width: outlineWidth
        }
      }
    });

    stationClassBreaksRenderer.addClassBreakInfo({
      minValue: 5000,
      maxValue: 9999.999,
      symbol: {
        type: symbolType,  // autocasts as new SimpleMarkerSymbol()
        style: symbolStyle,
        color: fillColor,
        size: "18px",  // pixels
        outline: {  // autocasts as new SimpleLineSymbol()
          color: outlineColor,
          width: outlineWidth
        }
      }
    });

    stationClassBreaksRenderer.addClassBreakInfo({
      minValue: 10000,
      maxValue: 100000,
      symbol: {
        type: symbolType,  // autocasts as new SimpleMarkerSymbol()
        style: symbolStyle,
        color: fillColor,
        size: "28px",  // pixels
        outline: {  // autocasts as new SimpleLineSymbol()
          color: outlineColor,
          width: outlineWidth
        }
      }
    });

    return stationClassBreaksRenderer;
  }
  
});
//            view.on("layerview-create", function(event) {
//            });

function setRailLinesSymbology(webmap, currentScale) {

  // Set rail lines symbology
  var railLines = webmap.layers.find(function(layer){
    return layer.title === RAIL;
  });

  if (currentScale <= 30000) {
    railLines.renderer = configureRailLinesRenderer(4)
  } else if (currentScale < 140000) {
    railLines.renderer = configureRailLinesRenderer(2)
  } else {
    railLines.renderer = configureRailLinesRenderer(1.5)
  }
}

function setDefaultStationSymbology(webmap, currentScale) {

  var stationPoints = webmap.layers.find(function(layer) {
    return layer.title === STATION_POINT;
  });

  var stationPolygonsSingle = webmap.layers.find(function(layer) {
    return layer.title === STATION_POLYGON_SINGLE;
  });

  var stationPolygonsMultiple = webmap.layers.find(function(layer) {
    return layer.title === STATION_POLYGON_MULTIPLE;
  });

  if (showStationsByRidership) {
    stationPolygonsMultiple.visible = false;
    stationPolygonsSingle.visible = false;
  } else {

    // Configure visibility of layers/labels
    /*
    Labels should come from station points, not polygons, for all scales.
    This means that station points need to have layer.visible = true always.

    Station points should be visible for non-transfer stations from 1:30k and smaller,
    and for transfer stations from 1:70k and smaller.  This is effected through configureStationPointsRenderer.
    */

    stationPoints.visible = true;
    stationPolygonsSingle.visible = currentScale > 30000 ? false : true;
    stationPolygonsMultiple.visible = currentScale > 70000 ? false : true;

    stationPoints.labelsVisible = true;
    stationPolygonsSingle.labelsVisible = false;
    stationPolygonsMultiple.labelsVisible = false;

    stationLabelClass.where = currentScale > 70000 ? 'ShowLabels = all' : "OBJECTID > -1";
    
    // Set the renderer/labeling info after configuration
    stationPoints.renderer = configureStationPointsRenderer(currentScale);
    stationPoints.labelingInfo = [stationLabelClass];
    console.log(stationPoints.labelingInfo)
    console.log(stationPoints);
  }
}
  
function configureStationPointsRenderer(currentScale) {

  var opaquePoints = {type: "simple-marker", style: "circle", color: "white", size: "8px", outline: {color: "black", width: 1}};
  var transparentPoints = {type: "simple-marker", style: "circle", color: [0, 0, 0, 0], size: "8px", outline: {color: [0, 0, 0, 0], width: 1}}

  var nonTransferPoints = currentScale > 30000 ? opaquePoints : transparentPoints;
  var transferPoints = currentScale > 70000 ? opaquePoints : transparentPoints;

  var returnRendererConfiguration = {
    type: "unique-value",
    field: "Transfer",
    uniqueValueInfos: [
      {value: "no", symbol: nonTransferPoints}, 
      {value: "yes", symbol: transferPoints},
    ] 
  }
  return returnRendererConfiguration
}

function configureRailLinesRenderer(lineWidth) {
      
  // Configuration symbolization for each color
  var blue = {type: "simple-line", color: "blue", width: lineWidth, style: "solid"};
  var red = {type: "simple-line", color: "red", width: lineWidth, style: "solid"};
  var green = {type: "simple-line", color: "#00b33c", width: lineWidth, style: "solid"};
  var orange = {type: "simple-line", color: "#ff8c1a", width: lineWidth, style: "solid"};
  var brown = {type: "simple-line", color: "#996633", width: lineWidth, style: "solid"};
  var pink = {type: "simple-line", color: "#ff33cc", width: lineWidth, style: "solid"};
  var purple = {type: "simple-line", color: "#7a00cc", width: lineWidth, style: "solid"};
  var yellow = {type: "simple-line", color: "yellow", width: lineWidth, style: "solid"};
  var black = {type: "simple-line", color: "black", width: lineWidth, style: "solid"};

  var hideLine = {type: "simple-line", color: "purple", width: 0, style: "solid"};

  var returnRendererConfiguration = {
    type: "unique-value",
    field: "Color",
    defaultSymbol: hideLine,
    uniqueValueInfos: [
      {value: "Red", symbol: red, label: "Red Line"}, 
      {value: "Blue", symbol: blue, label: "Blue Line"},
      {value: "Green", symbol: green, label: "Green Line"},
      {value: "Orange", symbol: orange, label: "Orange Line"},
      {value: "Pink", symbol: pink, label: "Pink Line"},
      {value: "Brown", symbol: brown, label: "Brown Line"},
      {value: "Purple", symbol: purple, label: "Purple Line"},
      {value: "Yellow", symbol: yellow, label: "Yellow Line"},
      {value: "Black", symbol: black, label: "Multiple Lines"},
      {value: "Gray", symbol: black, label: "Multiple Lines"}
    ] 
  }

  return returnRendererConfiguration;
}