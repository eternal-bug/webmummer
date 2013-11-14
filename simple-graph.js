//http://bl.ocks.org/stepheneb/1182434

function parsepoint(point) {
    var res   = {
        x1      :       point[0],
        y1      :       point[1],
        x2      :       point[2],
        y2      :       point[3],
        name    : spps[ point[4] ],
        sense   :       point[5],
        senseStr:       point[5] == 0 ? 'fwd' : 'rev',
        qual    :       point[6],
    }

    //console.log( res );

    return res;
}

function genTip(point) {
    var vars  = parsepoint( point );
    var res   = 'Scaf: ' + vars.name + ' Sense: ' + vars.senseStr + ' Ref Pos: ' + vars.x1 + '-' + vars.x2 + ' Scaf Pos: ' + vars.y1 + '-' + vars.y2 + ' Qual: ' + vars.qual;
    return res;
}


registerKeyboardHandler = function(callback) {
  var callback = callback;
  d3.select(window).on("keydown", callback);
};

SimpleGraph = function(elemid, options) {
  var self                    = this;
  this.chart                  = document.getElementById(elemid);
  this.cx                     = this.chart.clientWidth;
  this.cy                     = this.chart.clientHeight;
  this.options                = options                || {};
  this.options.xmax           = options.xmax           || 30;
  this.options.xmin           = options.xmin           ||  0;
  this.options.ymax           = options.ymax           || 10;
  this.options.ymin           = options.ymin           ||  0;
  this.points                 = options.points         ||  [ [{x:  0,   y:   0}, {x:   0,   y:   0}, {n: 'n'  , s: 'f', q:0.0}] ];
  this.options.xTicks         = options.xTicks         || 10;
  this.options.yTicks         = options.yTicks         || 10;
  this.options.split          = options.split          || 30;
  this.options.padding        = options.padding        || {};
  this.options.padding.top    = options.padding.top    || [40, 20];
  this.options.padding.right  = options.padding.right  || [30, 30];
  this.options.padding.bottom = options.padding.bottom || [60, 10];
  this.options.padding.left   = options.padding.left   || [70, 45];
  this.options.xlabelDx       = options.xlabelDx       || "0em";
  this.options.xlabelDy       = options.xlabelDy       || "+2.3em";
  this.options.ylabelX        = options.ylabelX        || 0;
  this.options.ylabelY        = options.ylabelY        || 0;
  this.options.ylabelDx       = options.ylabelDx       || "0em";
  this.options.ylabelDy       = options.ylabelDy       || "-2.3em";
  this.options.radius         = options.radius         || 5.0;


  this.padding = {
     "top":    this.options.title  ? this.options.padding.top   [0] : this.options.padding.top   [1],
     "right":                        this.options.padding.right [0],
     "bottom": this.options.xlabel ? this.options.padding.bottom[0] : this.options.padding.bottom[1],
     "left":   this.options.ylabel ? this.options.padding.left  [0] : this.options.padding.left  [1],
  };


  this.size = {
    "width" : this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top  - this.padding.bottom
  };

  // x-scale
  this.x = d3.scale.linear()
      .domain([this.options.xmin, this.options.xmax])
      .range( [0                , this.size.width  ]);

  // drag x-axis logic
  this.downx = Math.NaN;

  // y-scale (inverted domain)
  this.y     = d3.scale.linear()
      .domain([this.options.ymax, this.options.ymin])
      .nice()
      .range([0, this.size.height])
      .nice();

  // drag y-axis logic
  this.downy    = Math.NaN;

  this.dragged  = this.selected = null;

  this.line     = d3.svg.line()
      .x(function(d, i) { return this.x( d.x ) } )
      .y(function(d, i) { return this.y( d.y ) } );

  var xrange    = (this.options.xmax - this.options.xmin),
      yrange2   = (this.options.ymax - this.options.ymin) / 2,
      yrange4   = yrange2         /  2,
      datacount = this.size.width / this.options.split;


  this.vis = d3.select(this.chart).append("svg")
      .attr("width"    , this.cx)
      .attr("height"   , this.cy)
      .append("g"               )
      .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

  this.plot = this.vis.append("rect")
      .attr( "width"          , this.size.width )
      .attr( "height"         , this.size.height)
      .style("fill"           , "#EEEEEE"       )
      .attr( "pointer-events" , "all"           )
      .on(   "mousedown.drag" , self.plot_drag())
      .on(   "touchstart.drag", self.plot_drag())
      this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));




  this.vis.append("svg")
      .attr("top"    , 0               )
      .attr("left"   , 0               )
      .attr("width"  , this.size.width )
      .attr("height" , this.size.height)
      .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height)
      .attr("class"  , "line");
      //.append("path")
      //.attr("class"  , "line")
      //.attr("d"      , linesd );




  // add Chart Title
  if (this.options.title) {
    this.vis.append("text")
        .attr("class", "axis"           )
        .text(this.options.title        )
        .attr("x"    , this.size.width/2)
        .attr("dy"   , "-0.8em"         )
        .style("text-anchor","middle"   );
  }

  // Add the x-axis label
  if (this.options.xlabel) {
    this.vis.append("text")
        .attr("class", "axis"            )
        .text(this.options.xlabel        )
        .attr("x" , this.size.width/2    )
        .attr("y" , this.size.height     )
        .attr("dx", this.options.xlabelDx)
        .attr("dy", this.options.xlabelDy)
        .style("text-anchor","middle"    );
  }

  // add y-axis label
  if (this.options.ylabel) {
    this.vis.append("g").append("text")
        .attr("class"       , "axis"  )
        .text(this.options.ylabel     )
        .attr("x"           , this.options.ylabelX  )
        .attr("y"           , this.options.ylabelY  )
        .attr("dy"          , this.options.ylabelDy )
        .attr("dx"          , this.options.ylabelDx )
        .style("text-anchor","middle" )
        .attr("transform"   ,"translate(" + -40 + " " + this.size.height/2+") rotate(-90)");
  }

  //d3.select(this.chart)
  //    .on("mousemove.drag", self.mousemove())
  //    .on("touchmove.drag", self.mousemove())
  //    .on("mouseup.drag",   self.mouseup()  )
  //    .on("touchend.drag",  self.mouseup()  );

  this.redraw()();
};





//
// SimpleGraph methods
//
SimpleGraph.prototype.update = function() {
  var self   = this;
  var coords = [];
  this.vis.selectAll("path"  ).remove();
  this.vis.selectAll("circle").remove();

  for (var j = 0; j < this.points.length; j++) {
    var point = this.points[j];
    var vars  = parsepoint( point );

    var sense =      vars.sense;
    var stVal = { x: vars.x1, y: vars.y1, j: j, s: sense};
    var ndVal = { x: vars.x2, y: vars.y2, j: j, s: sense};

    var line  = this.line( [ stVal, ndVal ] );

    this.vis
        .append("path")
        .attr("class"  , "line"  )
        .attr("d"      , line    )
        .attr("j"      , j       )
        .attr("sense"  , sense   )
        ;
    //coords[ coords.length ] = stVal;
    //coords[ coords.length ] = ndVal;
  }

  //return;

  //var circle = this.vis.select("svg").selectAll("circle")
  //    .data(coords,  function(d) { return d; });
  //
  //
  //circle
  //    .attr("class", function(d) { return d === self.selected ? "selected" : null; })
  //    .attr("cx",    function(d) { return self.x( d.x ); })
  //    .attr("cy",    function(d) { return self.y( d.y ); })
  //    .attr("j" ,    function(d) { return         d.j  ; })
  //    .attr("sense", function(d) { return         d.s  ; })
  //    ;
  //
  //
  //circle.enter().append("circle")
  //    .attr("class", function(d) { return d === self.selected ? "selected" : null; })
  //    .attr("cx",    function(d) { return self.x( d.x ); })
  //    .attr("cy",    function(d) { return self.y( d.y ); })
  //    .attr("j" ,    function(d) { return         d.j  ; })
  //    .attr("r", self.options.radius)
  //    //.on("mousedown.drag",  self.datapoint_drag())
  //    //.on("touchstart.drag", self.datapoint_drag())
  //    ;
      //.style("cursor", "ns-resize")
  //
  //
  //circle.exit().remove();
  //
  //
    //$('svg circle').tipsy({
    //    gravity: 'w',
    //    html   : true,
    //    title  : function() {
    //        var j   = this.getAttribute('j');
    //        var res = genTip(self.points[j]);
    //        return res;
    //    }
    //});


    $('svg path').tipsy({
        gravity: 'w',
        html   : true,
        title  : function() {
            var j   = this.getAttribute('j');
            var res = genTip(self.points[j]);
            return res;
        }
    });


  if (d3.event && d3.event.keyCode) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
}



SimpleGraph.prototype.plot_drag = function() {
  var self = this;
  return function() {
    registerKeyboardHandler(self.keydown());

    d3.select('body').style("cursor", "move");

    if (d3.event.altKey) {
      var p        = d3.svg.mouse(self.vis.node());
      var newpoint = {};
      newpoint.x   = self.x.invert(Math.max(0, Math.min(self.size.width,  p[0])));
      newpoint.y   = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.points.push(newpoint);
      self.points.sort(function(a, b) {
        if (a.x < b.x) { return -1 };
        if (a.x > b.x) { return  1 };
        return 0
      });
      self.selected = newpoint;
      self.update();
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};



SimpleGraph.prototype.datapoint_drag = function() {
  var self = this;
  return function(d) {
    registerKeyboardHandler(self.keydown());
    document.onselectstart = function() { return false; };
    self.selected          = self.dragged = d;
    self.update();
  }
};




SimpleGraph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.svg.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;

    if (self.dragged) {
      self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.update();
    };

    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx   = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0],
          xaxis2 = self.x.domain()[1],
          xextent = xaxis2 - xaxis1;

      if (rupx != 0) {
        var changex, new_domain;
        changex    = self.downx / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };

    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy   = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;

      if (rupy != 0) {
        var changey, new_domain;
        changey    = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};




SimpleGraph.prototype.mouseup = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return true; };
    d3.select('body').style("cursor", "auto");
    d3.select('body').style("cursor", "auto");

    if (!isNaN(self.downx)) {
      self.redraw()();
      self.downx = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };

    if (!isNaN(self.downy)) {
      self.redraw()();
      self.downy = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }

    if (self.dragged) {
      self.dragged = null
    }
  }
}




SimpleGraph.prototype.keydown = function() {
  var self = this;
  return function() {
    if (!self.selected) return;
    switch (d3.event.keyCode) {
      case  8: // backspace
      case 46: { // delete
        var i = self.points.indexOf(self.selected);
        self.points.splice(i, 1);
        self.selected = self.points.length ? self.points[i > 0 ? i - 1 : 0] : null;
        self.update();
        break;
      }
    }
  }
};




SimpleGraph.prototype.redraw = function() {
  var self = this;
  return function() {
    var tx = function(d) {
      return "translate(" + self.x(d) + ",0)";
    },
    ty = function(d) {
      return "translate(0," + self.y(d) + ")";
    },
    stroke = function(d) {
      return d ? "#ccc" : "#666";
    },
    fx = self.x.tickFormat(10),
    fy = self.y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = self.vis.selectAll("g.x")
        .data(self.x.ticks(self.options.xTicks), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("g", "a")
        .attr("class"    , "x")
        .attr("transform", tx );

    gxe.append("line")
        .attr("stroke", stroke)
        .attr("y1"    , 0     )
        .attr("y2"    , self.size.height);

    gxe.append("text")
        .attr("class"        , "axis"          )
        .attr("y"            , self.size.height)
        .attr("dy"           , "1em"           )
        .attr("text-anchor"  , "middle"        )
        .text(fx                               )
        .style("cursor"      , "ew-resize"     )
        .on("mouseover"      , function(d) { d3.select(this).style("font-weight", "bold"  ); })
        .on("mouseout"       , function(d) { d3.select(this).style("font-weight", "normal"); })
        .on("mousedown.drag" , self.xaxis_drag())
        .on("touchstart.drag", self.xaxis_drag());

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = self.vis.selectAll("g.y")
        .data(self.y.ticks(self.options.yTicks), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("g", "a"  )
        .attr("class"          , "y"      )
        .attr("transform"      , ty       )
        .attr("background-fill", "#FFEEB6");

    gye.append("line")
        .attr("stroke"         , stroke         )
        .attr("x1"             , 0              )
        .attr("x2"             , self.size.width);

    gye.append("text")
        .attr("class"          , "axis"     )
        .attr("x"              , -3         )
        .attr("dy"             , ".35em"    )
        .attr("text-anchor"    , "end"      )
        .text(fy                            )
        .style("cursor"        , "ns-resize")
        .on("mouseover"        , function(d) { d3.select(this).style("font-weight", "bold"  );})
        .on("mouseout"         , function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag"   , self.yaxis_drag())
        .on("touchstart.drag"  , self.yaxis_drag());

    gy.exit().remove();
    self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
    self.update();
  }
}




SimpleGraph.prototype.xaxis_drag = function() {
  var self = this;
  return function(d) {
    console.log('xaxis drag');
    document.onselectstart = function() { return false; };
    var p      = d3.svg.mouse(self.vis[0][0]);
    self.downx = self.x.invert(p[0]);
  }
};




SimpleGraph.prototype.yaxis_drag = function(d) {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p      = d3.svg.mouse(self.vis[0][0]);
    self.downy = self.y.invert(p[1]);
  }
};
