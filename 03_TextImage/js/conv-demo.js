/**
 * Source: https://cs231n.github.io/assets/conv-demo/index.html
 */

var W1 = 7;
var H1 = 7;
var D1 = 3;

var K = 2;
var F = 3;
var S = 2; // stride

var cs = 25; // cell size

var X = new U.Vol(W1, H1, D1); // input volume
for(var q=0;q<X.w.length;q++) {
  X.w[q] = Math.floor(Math.random()*3);
  // 0 pad with P = 1
  for(var d=0;d<X.depth;d++) {
    for(var x=0;x<X.sx;x++) {
      for(var y=0;y<X.sy;y++) {
        if(x === 0 || x === (X.sx - 1) || y === 0 || y === (X.sy - 1)) {
          X.set(x,y,d,0);
        }
      }  
    }
  }
}

var Ws = [];
var bs = [];
for(var k=0;k<K;k++) {
  var W = new U.Vol(F, F, D1);
  for(var q=0;q<W.w.length;q++) {
    W.w[q] = Math.floor(Math.random()*3) - 1;
  }
  Ws.push(W);
  var b = new U.Vol(1,1,1);
  b.w[0] = 1 - k;
  bs.push(b);
}

var conv_forward = function(V, Ws, bs, stride) {
  // optimized code by @mdda that achieves 2x speedup over previous version
  var out_sy = ((V.sy-W.sy)/stride +1);
  var out_sx = ((V.sx-W.sx)/stride +1);
  var A = new U.Vol(out_sx |0, out_sy |0, Ws.length |0, 0.0);
  
  var V_sx = V.sx |0;
  var V_sy = V.sy |0;
  var xy_stride = stride |0;

  for(var d=0;d<Ws.length;d++) {
    var f = Ws[d];
    var x = 0;
    var y = 0;
    for(var ay=0; ay<out_sy; y+=xy_stride,ay++) {  // xy_stride
      x = 0;
      for(var ax=0; ax<out_sx; x+=xy_stride,ax++) {  // xy_stride

        // convolve centered at this particular location
        var a = 0.0;
        for(var fy=0;fy<f.sy;fy++) {
          var oy = y+fy; // coordinates in the original input array coordinates
          for(var fx=0;fx<f.sx;fx++) {
            var ox = x+fx;
            if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx) {
              for(var fd=0;fd<f.depth;fd++) {
                // avoid function call overhead (x2) for efficiency, compromise modularity :(
                a += f.w[((f.sx * fy)+fx)*f.depth+fd] * V.w[((V_sx * oy)+ox)*V.depth+fd];
              }
            }
          }
        }
        a += bs[d].w[0];
        A.set(ax, ay, d, a);
      }
    }
  }
  return A;
}

function renderVol(svg, V, xoff, yoff, col, title, vid) {

  var pad = 3;
  var dpad = 20;

  var gyoff = 20;

  var txt = title + ' (' + V.sx + 'x' + V.sy + 'x' + V.depth + ')';
  // 1 padding exception
  //if(vid === 'x') { txt = title + ' (' + (V.sx-2) + 'x' + (V.sy-2) + 'x' + V.depth + ')'; }

  svg.append('text')
    .attr('x', xoff)
    .attr('y', yoff - 5)
    .attr('font-size', 16)
    .attr('fill', 'black')
    .text(txt);

  for(var d = 0; d < V.depth; d++) {

    svg.append('text')
      .attr('x', xoff)
      .attr('y', yoff + d * (V.sy * (cs + pad) + dpad) + gyoff - 5)
      .attr('font-size', 16)
      .attr('fill', 'black')
      .attr('style', 'font-family: courier;')
      .text(vid + '[:,:,'+d+']');

    for(var x = 0; x < V.sx; x++) {
      for(var y = 0; y < V.sy; y++) {

        var xcoord = xoff + x * (cs + pad);
        var ycoord = yoff + y * (cs + pad) + d * (V.sy * (cs + pad) + dpad) + gyoff;

        var thecol = col;
        if(vid === 'x' && (x === 0 || y === 0 || x === V.sx - 1 || y === V.sy - 1)) {thecol = '#DDD';}

        svg.append('rect')
          .attr('x', xcoord)
          .attr('y', ycoord)
          .attr('height', cs)
          .attr('width', cs)
          .attr('fill', thecol)
          .attr('stroke', 'none')
          .attr('stroke-width', '2')
          .attr('id', vid+'_'+x+'_'+y+'_'+d)
          .attr('class', vid);

        svg.append('text')
          .attr('x', xcoord + 5)
          .attr('y', ycoord + 15)
          .attr('font-size', 16)
          .attr('fill', 'black')
          .text(V.get(x,y,d).toFixed(0));

      }
    }
  }
}

function draw() {
  var d3elt = d3.select('#draw');
  svg = d3elt.append('svg').attr('width', '100%').attr('height', '100%')
        .append('g').attr('transform', 'scale(1)');

  var yoff = 20;
  // render input volume
  renderVol(svg, X, 10, yoff, '#DDF', 'Input Volume (+pad 1)', 'x');

  for(var i=0;i<Ws.length;i++) {
    // render weights
    renderVol(svg, Ws[i], 270 + i*170, yoff, '#FDD', 'Filter W'+i, 'w'+i);
    // render biases
    renderVol(svg, bs[i], 270 + i*170, 350 + yoff, '#FDD', 'Bias b'+i, 'b'+i);
  }

  // render output
  renderVol(svg, O, 600, yoff, '#DFD', 'Output Volume', 'o');

  // render controls
  
  svg.append('text')
    .attr('x', 520)
    .attr('y', 470)
    .attr('font-size', 16)
    .attr('fill', 'black')
    .text('toggle movement');
  svg.append('rect')
    .attr('x', 500)
    .attr('y', 450)
    .attr('height', 30)
    .attr('width', 150)
    .attr('fill', "rgba(200, 200, 200, 0.1)")
    .attr('stroke', 'black')
    .attr('stroke-width', '2')
    .attr('style', 'cursor:pointer;')
    .on('click', function() {
      // toggle 
      if(iid === -1) {
        iid = setInterval(focusCell, 1000);
      } else {
        clearInterval(iid);
        iid = -1;
      }
    });
}

var fxg = 0;
var fyg = 0;
var fdg = 0;
function focusCell() {
  
  // first unfocus all
  for(var i=0;i<Ws.length;i++) {
    d3.selectAll('.w'+i).attr('stroke', 'none');
    d3.selectAll('.b'+i).attr('stroke', 'none');
  }
  d3.selectAll('.x').attr('stroke', 'none');
  d3.selectAll('.o').attr('stroke', 'none');

  var fx = fxg;
  var fy = fyg;
  var fd = fdg;

  // highlight the output cell
  var csel = d3.select('#o'+'_'+fx+'_'+fy+'_'+fd);
  csel.attr('stroke', '#0A0');

  // highlight the weights
  d3.selectAll('.w'+fd).attr('stroke', '#A00');
  // highlight the bias
  d3.selectAll('.b'+fd).attr('stroke', '#A00');

  d3.selectAll('.ll').remove();

  // highlight the input cell
  for(var d=0;d<D1;d++) {
    for(var x=0;x<F;x++) {
      for(var y=0;y<F;y++) {
        var ix = fx * S + x;
        var iy = fy * S + y;
        var id = d;
        var csel = d3.select('#x'+'_'+ix+'_'+iy+'_'+id);
        csel.attr('stroke', '#00A');

        // connect with line
        if(x === 0 && y === 0) {
          var wsel = d3.select('#w'+fd+'_'+x+'_'+y+'_'+d);
          svg.append('line')
            .attr('x1', csel.attr('x'))
            .attr('y1', csel.attr('y'))
            .attr('x2', wsel.attr('x'))
            .attr('y2', wsel.attr('y'))
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            .attr('class', 'll');
        }
        if(x === 0 && y === (F-1)) {
          var wsel = d3.select('#w'+fd+'_'+x+'_'+y+'_'+d);
          svg.append('line')
            .attr('x1', csel.attr('x'))
            .attr('y1', parseFloat(csel.attr('y')) + cs)
            .attr('x2', wsel.attr('x'))
            .attr('y2', parseFloat(wsel.attr('y')) + cs)
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            .attr('class', 'll');
        }
        if(x === (F-1) && y === 0) {
          var wsel = d3.select('#w'+fd+'_'+x+'_'+y+'_'+d);
          svg.append('line')
            .attr('x1', parseFloat(csel.attr('x')) + cs)
            .attr('y1', csel.attr('y'))
            .attr('x2', parseFloat(wsel.attr('x')) + cs)
            .attr('y2', wsel.attr('y'))
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            .attr('class', 'll');
        }
        if(x === (F-1) && y === (F-1)) {
          var wsel = d3.select('#w'+fd+'_'+x+'_'+y+'_'+d);
          svg.append('line')
            .attr('x1', parseFloat(csel.attr('x')) + cs)
            .attr('y1', parseFloat(csel.attr('y')) + cs)
            .attr('x2', parseFloat(wsel.attr('x')) + cs)
            .attr('y2', parseFloat(wsel.attr('y')) + cs)
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            .attr('class', 'll');
        }
        
      }
    }
  }

  // output focus cycle
  fxg++;
  if(fxg >= O.sx) {
    fxg = 0;
    fyg++;
    if(fyg >=O.sy) {
      fyg = 0;
      fdg++;
      if(fdg >= O.depth) {
        fdg = 0;
      }
    }
  }

}

iid = -1;
function start() {
  O = conv_forward(X, Ws, bs, S);
  draw();
  iid = setInterval(focusCell, 1000);
}