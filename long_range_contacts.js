var margin = {top: 100, right: 40, bottom: 20, left: 120},
    width = 1360 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var regionWidth = width, regionHeight = 200;
var scaleFactor = 4;

var interOptions = ["Null", "Active", "PcG", "HP1 / centromeric"]
var interScale = ["#8c8c8c", "#d62728","#1f77b4", "#000000"]

queue()
    .defer(d3.tsv,  'dmel_long_range_contacts.tsv') // chromatin regions
    .await(plotChrRegions); // function that uses files


function ChrRegions() {
  chr_ids = null;
  regionHeight = 250;
  var chrMin, chrMax;

  var xHeight = 70;   //start of x row
  var yHeight = 170;  //start of y row

  function regions(selection) {
    selection.each(function(data) {
      var padding, pre, previews, regions_data, svgs;
      padding = 20;

      chrs = d3.nest().key(function(d) {
        return d.chr;
      }).entries(data);

      chrMin = d3.min(data, function(d) { return d3.min([+d.xstart, +d.ystart]); });
      chrMax = d3.max(data, function(d) { return d3.max([+d.xend, +d.yend]); });

      var interactions = d3.nest()
                       .key(function(d) { return d.xclass;})
                       .key(function(d) { return d.yclass;})
                       .map(data);

      color = d3.scale.ordinal().domain(interOptions).range(interScale);

      createLegend(d3.keys(interactions));

      svgs = d3.select(this).select("#previews").selectAll(".preview").data(chrs);
      svgs.enter().append("svg")
          .attr("width", regionWidth).attr("height", regionHeight)
          .append("g");

      svgs.each(drawRegion);

      return svgs
    });
  }

  drawRegion = function(d, i) {
    var base, graph, padding, padding2, chrName, xMax, xMin;
    base = d3.select(this);
    padding = 20;//padding = 200;

    var pad = padding / 2;       // actual padding amount
    var radius = 4;             // fixed node radius
    var yfixed = pad + radius;  // y position for all nodes

    chrWindow = chrMax - chrMin;

    xMin = 0;
    xMax = chrWindow;

    chrScale = d3.scale.linear()
                 .domain([chrMin, chrMax])
                 .rangeRound([padding, regionWidth - padding * 2]);

    chrAxis = d3.svg.axis().scale(chrScale).orient("bottom");

    yScale = d3.scale.linear().domain([0, 200]).range([regionHeight - 20, 0]);
    yAxis  = d3.svg.axis().scale(yScale).orient("left");

    var arc = d3.svg.line()
          .x(function(d) { return chrScale(d.xstart); })
          .y(function(d) { return yScale(d.ystart); })
          .interpolate("monotone");


    padding2 = 50;

    graph = base.append("g");

    graph.selectAll(".regions").data(function(d) {
          return d.values;
          }).enter().append("rect").attr("x", function(d) {
          return chrScale(d.xstart);
          }).attr("y", function(d) {
          return yScale(xHeight);
          }).attr("width", function(d) {
          return chrScale(d.xend) - chrScale(d.xstart);
          }).attr("height", 20).attr("fill", function(d) {
            return color(d.xclass);
          }).append("title");


    graph.selectAll(".regions").data(function(d) {
          return d.values;
          }).enter().append("rect").attr("x", function(d) {
          return chrScale(d.ystart);
          }).attr("y", function(d) {
          return yScale(yHeight);
          }).attr("width", function(d) {
          return chrScale(d.yend) - chrScale(d.ystart);
          }).attr("height", 20).attr("fill", function(d) {
            return color(d.yclass);
          }).append("title");


    // scale to generate radians (just for lower-half of circle)
    var radians = d3.scale.linear()
                    .range([Math.PI / 2, 3 * Math.PI / 2]);

    // path generator for arcs (uses polar coordinates)
    var arc = d3.svg.line.radial()
                .interpolate("basis")
                .tension(0)
                .angle(function(d) { return radians(d); });

    graph.selectAll(".link")
         .data(function(d) {
           return d.values;
         }).enter()
         .append("path")
         .attr("class","arc")
         .attr("d", function(d, i) {
           //start the arc at the middle
           x1 = (chrScale(d.xstart) + chrScale(d.xend)) / 2;
           x2 = (chrScale(d.ystart) + chrScale(d.yend)) / 2;
           val = x1 - x2;
           y1 = yScale(xHeight)+10;
           y2 = yScale(yHeight)+10;
           return "M" + x1 + ","+ y1 +" A "+ val +","+ val +" 0 0 1 " + x2 + ","+y2
           //return "M" + x1 + ","+ y1 +" T "+ x2 + " "+y2
        })
        .attr("")


    graph.selectAll(".regions").data(d.key)
         .enter().append("text").text(d.key)
         .attr("class", "title").attr("shape-rendering", "crispEdges")
         .attr("text-anchor", "middle")
         .attr("x", regionWidth / 2).attr("dy", "1.3em");


    return graph.append("g").attr("class", "axis").attr("transform", "translate(0," + (regionHeight - padding2) + ")").call(chrAxis);

  };

  createLegend = function(peaks) {
    var keys, legend;
    legend = d3.select("#legend").append("svg").attr("width", 800).attr("height", 30);
    keys = legend.selectAll("g").data(peaks).enter().append("g").attr("transform", function(d, i) {
      return "translate("+ (100 * (i + 1)) + "," + 10 +")";
    });
    keys.append("rect").attr("width", 15).attr("height", 15).attr("fill", function(d) {
      return color(d);
    });
    return keys.append("text").text(function(d) {
      return d;
    }).attr("text-anchor", "left").attr("dx", "1.4em").attr("dy", "0.8em");
  };


  return regions
}

function plotChrRegions(error, regions) {
	//data = d3.zip(regions);
  data = regions;
  data.forEach(function(d) {
    d.y = +0;
    d.xstart = +d.xstart;
    d.xend = +d.xend;
    d.ystart = +d.ystart;
    d.yend = +d.yend;
  });

  display(data);
}

plotData = function(selector, data, plot) {
  return d3.select(selector).datum(data).call(plot);
};

function display(data) {
    plot = ChrRegions();
    return plotData("#vis", data, plot);
}

