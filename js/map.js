
var map;
var tiles;

var laender;
var network = {"nodes":[],"links":[]};
var network0;

var path;
var feature;

var radius = 6;

var width = document.querySelector("#map").clientWidth;
var height = document.querySelector("#map").clientHeight;

var link;
var node;

var simulation = d3.forceSimulation();

window.onload = function () {  

    d3.queue()
        .defer(d3.json,"data/deutschlandbd.json")
        .defer(d3.json,"data/data_network.json")
        .awaitAll(ready);  

    map.on("viewreset", reset);
    map.on("zoomend", reset); 
        map.on("moveend", reset);    

};

map = L.map('map', {zoomControl:false, scrollWheelZoom:false}).setView([50.859046 , 10.087890 ], 6);

tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18}).addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg").attr("id","svgmap");
var  g = svg.append("g").attr("class", "leaflet-zoom-hide");




function ready(error,data){
    
    laender = data[0];
    network0 = data[1];
    
    console.log(laender);
    
    var transform = d3.geoTransform({point: projectPoint});    
     path = d3.geoPath().projection(transform);

     feature = g.selectAll("path")
                .data(laender.features)
                .enter().append("path");
    
    
    var bounds = path.bounds(laender),
        topLeft = bounds[0],
        bottomRight = bounds[1];
    
    
    console.log(topLeft);
        console.log(bottomRight);

    

    svg .attr("width", width)
        .attr("height", height)
        .style("left","0px")
        .style("top", "0px");

    feature.attr("d", path);
    

     var networkNodes = network0.nodes.map(function(d){if (d.type == "univ"){
        var point = map.latLngToLayerPoint(new L.LatLng(d.coo[0], d.coo[1]));
        return {"id":d.id,"name":d.name,"coo":d.coo,"studi":d.studi,"type":d.type,"fx":point.x,"fy":point.y}
    }else{return d}});
    
    console.log(networkNodes);
    
    var networkLinks = network0.links;
    
    network.nodes = networkNodes;
    network.links = networkLinks;
    
    simulation
    .force("link", d3.forceLink().strength(2))
    .force("collide",d3.forceCollide(20).iterations(16))
    .force("charge", d3.forceManyBody().strength(-10));
//    .force("center", d3.forceCenter(width/2 , height/2 ));
    
    
     link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(network.links)
    .enter().append("line")
      .attr("stroke-width", "2");
    
    node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(network.nodes)
    .enter().append("circle")
    .attr("r", function(d) {      
     var filter = network.links.filter(function(l) {
       return l.source == d.id || l.target == d.id
     });
    var weight = filter.length;
     var minRadius = 5;
     return minRadius + (weight * 3)})
      .attr("fill", function(d){if (d.type == "cluster"){return "blue"}else{return "red"}});
//        .call(d3.drag()
//          .on("start", dragstarted)
//          .on("drag", dragged)
//          .on("end", dragended));
    
    
  node.append("title")
      .text(function(d) { 
      
      var filter = network.links.filter(function(l) {
       return l.source == d.id || l.target == d.id
     });
    var weight = filter.length;
      
      if (d.type == "cluster"){
      
      return d.name + " " + weight + " university(ies)" 
      }else{
          
          return d.name + " " + weight + " cluster(s)" ;
            
      }});

  simulation
      .nodes(network.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(network.links);
             
};



  function reset() {   
      
    console.log("reset");
      
      var transform = d3.geoTransform({point: projectPoint});    
    var path = d3.geoPath().projection(transform);
      
      
      feature = g.selectAll("path")
                .data(laender.features)
                .enter().append("path");
      
    feature.attr("d", path);
      
      
    var networkNodes = network0.nodes.map(function(d){if (d.type == "univ"){
        var point = map.latLngToLayerPoint(new L.LatLng(d.coo[0], d.coo[1]));
        return {"id":d.id,"name":d.name,"coo":d.coo,"studi":d.studi,"type":d.type,"fx":point.x,"fy":point.y}
    }else{return d}});
    
      
    var networkLinks = network0.links;
    
    network.nodes = networkNodes;
    network.links = networkLinks;
      
      
//       simulation
//    .force("link", d3.forceLink().strength(2))
//    .force("collide",d3.forceCollide(20).iterations(16))
//    .force("charge", d3.forceManyBody().strength(-10));
//      
//      

//  simulation
//      .nodes(network.nodes)
//      .on("tick", ticked);
//
//  simulation.force("link")
//      .links(network.links);
      
      
      simulation.restart();
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
  };














function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
    
  };

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  };

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
};

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
};

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
//  d.fx = null;
//  d.fy = null;
};
