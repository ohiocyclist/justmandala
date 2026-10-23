var canvas = document.getElementById("drawCanvas");

var getcanvas, ctx, prevX, prevY
let symmetry = canvas.width
let xCenter = symmetry / 2
let slider = document.getElementById("mySlider")
let sliderValueDisplay = document.getElementById("sliderValue")
let slider2 = document.getElementById("mySlider2")
let sliderValueDisplay2 = document.getElementById("sliderValue2")
let rslider = document.getElementById("redSlider")
let rsliderValueDisplay = document.getElementById("rsliderValue")
let gslider = document.getElementById("greenSlider")
let gsliderValueDisplay = document.getElementById("gsliderValue")
let bslider = document.getElementById("blueSlider")
let bsliderValueDisplay = document.getElementById("bsliderValue")
let color = "#000000"
let drawOrFill = 'draw'
let fillOrOther = 'every'
let fillOrOtherDisplay = document.getElementById("fillOrOther")
let curclicked = "black"

/**
 *  Colors button event listner example
 *
**/
const colorlist = [
  ["red", "#FC8181"], ["orange", "#FFA500"], ["yellow", "#DEDE20"], ["green", "#2FD175"], 
  ["darkgreen", "#108010"], ["blue", "#4383ED"],["darkblue", "#1213BD"], ["purple", "#9F7AEA"],
  ["magenta", "#BD12B5"], ["brown", "#483C2C"], ["black", "#000000"], ["flex", "#808080"],
  ["eraser", "#FFFFFF"]
]
const myDiv = document.getElementById('colorbuttons')
// programmatically create as well as wire up the buttons
for (let i = 0; i < colorlist.length; i++) {
  const button = document.createElement('button')
  button.id = colorlist[i][0]
  button.style.backgroundColor = colorlist[i][1]
  if (colorlist[i][0] === 'eraser') {
    button.style.color = 'black'
    button.innerText = colorlist[i][0]
  }
  button.style.padding = '15px 32px'
  button.style.borderRadius = '5px'
  button.style.margin = '0 5px'
  button.className = 'colorbutton'
  myDiv.appendChild(button)
}
const buttons = document.querySelectorAll(".colorbutton")
for (let i = 0; i < colorlist.length; i++) {
  document.getElementById(colorlist[i][0]).addEventListener("click", () => {
    color = colorlist[i][1]
    curclicked = colorlist[i][0]
    buttons.forEach(btn => btn.classList.remove("pop-out"))
    document.getElementById(colorlist[i][0]).classList.add("pop-out")
  })
}

// default color
document.getElementById('black').classList.add("pop-out")

addEventListener("load", load);

// start with draw mode, and a draw pencil
canvas.addEventListener('mousemove', () => {
  canvas.style.cursor = "url('pencil.png') 6 26, auto"
})

/**
 * To reset the canvas, simply run the load function
 * document.getElementById("reset").addEventListener("click", load);
 */

function load() {
  /**
   * On your DOM, your Canvas ID must be drawCanvas
   */
  getcanvas = document.getElementById("drawCanvas");

  ctx = getcanvas.getContext("2d");
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, symmetry, symmetry);

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 0.5;
  // Guides lines

  let lastDistance = 0
  let scale = 1
  let isPinching = false

  // fill areas with a click without moving the mouse, draw on movement
  getcanvas.addEventListener("mousemove", drawFill)
  getcanvas.addEventListener("mousedown", drawFill)
  getcanvas.addEventListener("touchstart", (e) => {
    // clear draw coordinates
    var coord = getLocalCoordinates(e)

    prevX = coord[0]
    prevY = coord[1]
  }, { passive: false })
  getcanvas.addEventListener("touchmove", (e) => {
    e.preventDefault()
    drawFill(e)
  }, { passive: false })

  /*  */
}

function drawFillSwap() {
  // set to the correct cursor
  if (drawOrFill === 'fill') {
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = "url('fill.png') 1 24, auto"
    })
  } else if (drawOrFill === 'drop') {
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = "url('dropper.png') 6 26, auto"
    })
  } else {
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = "url('pencil.png') 6 26, auto"
    })
  }
}

function drawFill(e) {
  if (drawOrFill === 'draw') {
    draw(e)
  } else if (drawOrFill === 'drop') {
    drop(e)
  } else {
    fill(e)
  }
}

function getPixelColor(ctx, x, y) {
    const { data } = ctx.getImageData(x, y, 1, 1)
    return { r: data[0], g: data[1], b: data[2], a: data[3] }
}

function isWhite({ r, g, b, a }) {
    return r === 255 && g === 255 && b === 255 && a === 255
}

function getAdjacentWhite(data, startX, startY, width, height, blackfun) {
    // determine what area we are filling in
    const stack = new Int32Array(width * height * 2)
    let sp = 0

    stack[sp++] = startX
    stack[sp++] = startY

    const visited = new Uint8Array(width * height)
    const result = []

    let i = (startY * width + startX) * 4
    let curColorR = data[i]
    let curColorG = data[i + 1]
    let curColorB = data[i + 2]

    while (sp > 0) {
      const y = stack[--sp]
      const x = stack[--sp]

      if (x < 0 || y < 0 || x >= width || y >= height) continue

      const idx = y * width + x
      if (visited[idx]) continue
      visited[idx] = 1

      const i = idx * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]

      if (blackfun) {
        // if (r < 240 && g < 240 && b < 240) console.log(r, g, b)
        if (r === 0 && g === 0 && b === 0 ) continue
        //if (Math.abs(x - startX) > 200 || Math.abs(y - startY) > 200) continue
      } else {
        if (!(r === curColorR && g === curColorG && b === curColorB)) continue
      }

      result.push([x, y])

      stack[sp++] = x + 1; stack[sp++] = y
      stack[sp++] = x - 1; stack[sp++] = y
      stack[sp++] = x;     stack[sp++] = y + 1
      stack[sp++] = x;     stack[sp++] = y - 1
    }
    return result
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    // expand shorthand #fff → #ffffff
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const num = parseInt(hex, 16);

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`
}  

function fill(e) {
  // fill areas with color 
  var coord = getLocalCoordinates(e);
  if (e.buttons == 1 || e.type == "touchmove") {
    var x = Math.floor(coord[0])
    var y = Math.floor(coord[1])
    let img = ctx.getImageData(0, 0, symmetry, symmetry)
    let data = img.data
    let allcoords = getAdjacentWhite(data, x, y, symmetry, symmetry, false)
    const pimg = ctx.getImageData(x, y, 1, 1)
    const da = pimg.data    
    const refr = da[0]
    const refg = da[1]
    const refb = da[2]
    let symmetricPoints = []
    // help target small areas
    if (allcoords.length < 200) {
      for (let i = 0; i < allcoords.length; i += 4) {
        let thispoints = getSymmetryPoints(allcoords[i][0], allcoords[i][1])
        symmetricPoints = [...symmetricPoints, ...thispoints]
      }
    } else {
      symmetricPoints = getSymmetryPoints(x, y)
    }
    if (fillOrOther === 'one') {
      symmetricPoints = [[x, y]]
    }
    img = ctx.getImageData(0, 0, symmetry, symmetry)
    data = img.data
    let usecolor = hexToRgb(color)
    let idx = 0
    for (const [prex, prey] of symmetricPoints) {
      let complocn = Math.floor((prey * symmetry + prex) * 4)
      if (data[complocn] === refr && data[complocn + 1] === refg && data[complocn + 2] === refb) {
        // there tend to be two mirrors in one white zone, necessitating division by 4 to hit every other white zone
        if (idx % 4 != 0 && fillOrOther === 'other') {
          idx = idx + 1
          continue
        }
        idx = idx + 1
        let allcoords = getAdjacentWhite(data, Math.floor(prex), Math.floor(prey), symmetry, symmetry, false)
        
        for (const [x, y] of allcoords) {
          const i = (y * symmetry + x) * 4
          data[i]     = usecolor.r
          data[i + 1] = usecolor.g
          data[i + 2] = usecolor.b
          data[i + 3] = 255
        }
      }
    }
    
    ctx.putImageData(img, 0, 0)
  }
}

function draw(e) {
  var coord = getLocalCoordinates(e)
  // console.log(" getLocalCoordinates[0] " + coord[0]);

  var x = coord[0]
  var y = coord[1]

  ctx.strokeStyle = color
  ctx.lineWidth = Number(sliderValueDisplay.textContent)

  if (e.buttons == 1 || e.type == "touchmove") {
    // get rid of the uninitialized
    if (!prevX) {
      prevX = x
      prevY = y
    }
    drawLine(prevX, prevY, x, y)
  }
  prevX = x
  prevY = y
}

function colorUpdate(data, doupdate) {
  document.getElementById("flex").style.backgroundColor = rgbToHex(data[0], data[1], data[2])
  // if we're currently clicked, the color has changed, but the button setup hasn't fired
  if (curclicked === 'flex') {
    color = rgbToHex(data[0], data[1], data[2])
  }
  if (doupdate) {
    rslider.value = data[0]
    rsliderValueDisplay.textContent = data[0]
    gslider.value = data[1]
    gsliderValueDisplay.textContent = data[1]
    bslider.value = data[2]
    bsliderValueDisplay.textContent = data[2]
  }
  document.getElementById("flex").addEventListener("click", () => {
    color = rgbToHex(data[0], data[1], data[2])
    curclicked = "flex"
    buttons.forEach(btn => btn.classList.remove("pop-out"))
    document.getElementById("flex").classList.add("pop-out")
  })
}

function drop(e) {
  var coord = getLocalCoordinates(e)
  if (e.buttons == 1 || e.type == "touchmove") {
      const { data } = ctx.getImageData(coord[0], coord[1], 1, 1)
      //console.log(`dropper, ${data[0]} ${data[1]} ${data[2]}`)
      colorUpdate(data, true)
  }
}

function getSymmetryPoints(x, y) {
  // The coordinate system has its origin at the center of the canvas,
  // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
  var ctrX = symmetry / 2;
  var ctrY = symmetry / 2;
  var relX = x - ctrX;
  var relY = ctrY - y;
  var dist = Math.hypot(relX, relY);
  var angle = Math.atan2(relX, relY); // Radians
  var result = [];
  var radian = Number(sliderValueDisplay2.textContent)
  for (var i = 0; i < radian; i++) {
    var theta = angle + ((Math.PI * 2) / radian) * i; // Radians
    x = ctrX + Math.sin(theta) * dist;
    y = ctrY - Math.cos(theta) * dist;
    result.push([Math.round(x), Math.round(y)]);
    // this mirrors the points around the spoke of the symmetry
    // hence symmetry === 2 is actually 4 etc.
    // but it allows the user to easily draw closed areas
    if (true) {
      x = ctrX - Math.sin(theta) * dist;
      result.push([Math.round(x), Math.round(y)]);
    }
  }

  return result;
}

function drawLine(x1, y1, x2, y2) {
  // connect a beginning and ending points
  startPoints = getSymmetryPoints(x1, y1);
  endPoints = getSymmetryPoints(x2, y2);

  ctx.lineWidth = Number(sliderValueDisplay.textContent);

  ctx.beginPath();
  ctx.lineCap = "round";

  for (var i = 0; i < startPoints.length; i++) {
    ctx.moveTo(startPoints[i][0], startPoints[i][1])
    ctx.lineTo(endPoints[i][0], endPoints[i][1])
  }

  ctx.stroke()

}

// Get local coor in an array
function getLocalCoordinates(ev) {
  if (ev.type == "touchmove") {
    var touch = ev.touches[0] || ev.changedTouches[0]
    var realTarget = document.elementFromPoint(touch.clientX, touch.clientY)
    ev.offsetX = touch.clientX - realTarget.getBoundingClientRect().x
    ev.offsetY = touch.clientY - realTarget.getBoundingClientRect().y
  }
  return [ev.offsetX + 0.5, ev.offsetY + 0.5]
}

function euclidDistance(x, y, w, z) {
  // find the distance between x,y and w,z
  return Math.sqrt(Math.pow((x - w), 2) + Math.pow((y - z), 2))
}

function voronoiTrace(pointList) {
  // trace out the points that are equidistant from the roots
  let previ = 0
  let prevj = 0
  const boxinbox = 50
  for (let overi = xCenter; overi < symmetry; overi += boxinbox) {
    for (let overj = xCenter; overj < symmetry; overj += boxinbox) {
      // give a chance for the prev pixel to be the one to connect
      for (let i = overi; i < overi + boxinbox; i++) {
        for (let j = overj; j < overj + boxinbox; j++) {
          if (euclidDistance(i, j, xCenter, xCenter) >= xCenter) {
            continue
          }
          // filter out lines between distant points
          let distmin = 175
          for (let k = 0; k < pointList.length; k++) {
            const distone = euclidDistance(i, j, pointList[k][0], pointList[k][1])
            if (distone < distmin) {
              distmin = distone
            }
          }
          // mux points against each other
          let tubreak = false
          for (let k = 0; k < pointList.length - 1; k++) {
            for (let l = k + 1; l < pointList.length; l++ ) {
              const distone = euclidDistance(i, j, pointList[k][0], pointList[k][1])
              const disttwo = euclidDistance(i, j, pointList[l][0], pointList[l][1])
              let hyperx = 1
              if (distone < disttwo + hyperx && distone > disttwo - hyperx && distone < distmin + hyperx) {
                  if (euclidDistance(i, j, previ, prevj) > 10) {
                    previ = i
                    prevj = j
                  }
                  
                  drawLine(i, j, previ, prevj)
                  previ = i
                  prevj = j
                  tubreak = true
                  break
              }
            }
            if (tubreak) {
              break
            }
          }
        }
      }
    }
  }
}

function randomDraw() {
  ctx.strokeStyle = color
  ctx.lineWidth = Number(sliderValueDisplay.textContent)
  // five styles of random mandala
  const randval = Math.random()
  if (randval < 0.17) {
    // geometric forms style
    for (i = -10; i < xCenter - 150; i += 52) {
      // skew y for the broader spectrum
      let jend = 0
      // more space to fill further out
      if (i > 150) {
        jend = 2
      }
      // need more fill for less symmetry
      if (slider2.value < 9) {
        jend++
      }
      for (j = 0; j <= jend; j++) {
        let subdivide = 3
        let jittersize = 20 * Math.random() - 10
        let randdivive = Math.random()
        if (randdivive < 0.2) {
          subdivide = 5
        } else if (randdivive < 0.4) {
          subdivide = 6
        } else if (randdivive < 0.6) {
          subdivide = 7
        } else if (randdivive < 0.8) {
          subdivide = 17
        }
        let figscale = 50
        let lastlocs = [0, 0]
        const angshift = Math.PI * Math.random() / 2
        for (preangle = 0; preangle <= Math.PI * 2; preangle += Math.PI * 2 / subdivide) {
          const angle = preangle - Math.PI / 4 + angshift
          const thislocs = [Math.cos(angle) * figscale + xCenter + i + jittersize, 
                        Math.sin(angle) * figscale + xCenter + i + j * figscale * 2 + jittersize]
          // circular keep-out
          if (euclidDistance(thislocs[0], thislocs[1], xCenter, xCenter) < xCenter && lastlocs[0] != 0) {
            drawLine(lastlocs[0], lastlocs[1], thislocs[0], thislocs[1])
          }
          lastlocs = thislocs
        }
      }
    }
  } else if (randval < 0.34) {
    // Voronoi style
    let startPoints = [
        [xCenter + 0 - 100 * Math.random(), xCenter + 0 + 100 * Math.random()], 
        [xCenter + 0 + 100 * Math.random(), xCenter + 0 + 100 * Math.random()], 
        [xCenter + 50 + 50 * Math.random(), xCenter - 50 + 100 * Math.random()], 
        [xCenter + 0 - 100 * Math.random(), xCenter + 0 - 100 * Math.random()], 
        [xCenter + 0 + 100 * Math.random(), xCenter + 0 - 100 * Math.random()], 
        [xCenter + 100 - 100 * Math.random(), xCenter + 100 + 100 * Math.random()], 
        [xCenter + 100 + 100 * Math.random(), xCenter + 100 + 100 * Math.random()], 
        [xCenter + 150 + 50 * Math.random(), xCenter - 50 + 100 * Math.random()], 
        [xCenter + 100 - 100 * Math.random(), xCenter + 100 - 100 * Math.random()], 
        [xCenter + 100 + 100 * Math.random(), xCenter + 100 - 100 * Math.random()], 
        [xCenter + 300 - 100 * Math.random(), xCenter + 300 + 100 * Math.random()], 
        [xCenter + 300 + 100 * Math.random(), xCenter + 300 + 100 * Math.random()], 
        [xCenter + 200 + 100 * Math.random(), xCenter + 200 + 100 * Math.random()], 
        [xCenter + 300 - 100 * Math.random(), xCenter + 300 - 100 * Math.random()], 
        [xCenter + 300 + 100 * Math.random(), xCenter + 300 - 100 * Math.random()], 
    ]
    // try to keep the points in a narrower comb
    if (Math.random() < 0.5) {
        startPoints = [
            [xCenter + 300 + 100 * Math.random(), xCenter + 50 + 50 * Math.random()],
            [xCenter + 300 + 100 * Math.random(), xCenter - 25 + 50 * Math.random()],
            [xCenter + 250 + 100 * Math.random(), xCenter - 10 + 20 * Math.random()],
            [xCenter + 300 + 100 * Math.random(), xCenter - 50 - 50 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter + 20 + 20 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter - 10 + 20 * Math.random()],
            [xCenter + 100 + 100 * Math.random(), xCenter - 5 + 10 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter - 20 - 20 * Math.random()],
            [xCenter + 0 + 20 * Math.random(), xCenter + 0 + 20 * Math.random()],
            [xCenter + 0 + 20 * Math.random(), xCenter - 0 - 20 * Math.random()],
        ]
    }
    let geoPoints = []
    for (let i = 0; i < startPoints.length; i++) {
        const newPoints = getSymmetryPoints(startPoints[i][0], startPoints[i][1])
        for (let j = 0; j < newPoints.length; j++) {
            geoPoints.push(newPoints[j])
        }
    }
    voronoiTrace(startPoints)
  } else if (randval < 0.51) {
    // spiral style
    ctx.strokeStyle = color
    let endx = xCenter
    let endy = xCenter
    let angle = 0
    for (let i = 0; i < 6; i++) {
      // draw the center and then move out a bit
      if (i === 1 || i === 2) {
        continue
      }
      step = (i + 1) * 30 + (i + 1) * 10 * Math.random()
      if (angle === 0) {
        startx = endx + step
        starty = endy - step
        angle = 1
      } else if (angle === 1) {
        startx = endx - step
        starty = endy - step
        angle = 2
      } else if (angle === 2) {
        startx = endx - step
        starty = endy + step
        angle = 3
      } else if (angle === 3) {
        startx = endx + step
        starty = endy + step
        angle = 0
      }
      // spliney
      let curx = startx
      let cury = starty
      let stepup = 20
      for (let j = 0; j < stepup; j++) {
        let pi = Math.PI
        let curendx = startx + step * Math.cos(pi * j / stepup)
        let curendy = starty - step * Math.sin(pi * j / stepup)
        drawLine(curx, cury, curendx, curendy)
        curx = curendx
        cury = curendy
      }
      endx = startx
      endy = starty
    }
  } else if (randval < 0.68) {
    // just a bunch of straight lines style
    ctx.strokeStyle = color
    let offset = 40 * Math.random()
    drawLine(offset, xCenter - offset, xCenter, xCenter - offset)
    for (let i = 0; i < 4; i++) {
      let usei = i
      // add another inner layer between 0 and 1
      if (i === 3) {
        usei = 0.5
      }
      let startx = xCenter - (usei + 1) * (xCenter / 4) * (0.8 + 0.2 * Math.random())
      // push out the inner layers to touch the next layer
      let starty = startx - offset
      if (i === 2) {
          starty = startx
      }
      drawLine(startx, starty, startx + offset, Math.abs(symmetry - starty))
    }
  } else if (randval < 0.84) {
    // interlocking crossing lines style
    let workfactor = 12
    let ifactor = 2
    for(let i = 0; i < workfactor - 3; i++) {
      ctx.strokeStyle = color
      // draw in the center to start, then push towards the edges
      let useifactor = 0
      if (i === 0) {
        useifactor = 1
        endx = xCenter - (i + useifactor - 1) * xCenter / (workfactor + ifactor)
        endy = xCenter - Math.random() * (i + useifactor) * xCenter / ( 0.4 * (workfactor + ifactor))
      } else {
        useifactor = ifactor
        endx = startx
        endy = starty
      }
      startx = xCenter - ((i + ifactor) * xCenter / (workfactor + ifactor)) / 2 + Math.random() * (i + ifactor) * xCenter / (workfactor + ifactor)
      starty = xCenter - (i + useifactor) * xCenter / (workfactor + ifactor) - Math.random() * (i + useifactor) * xCenter / (2 * (workfactor + ifactor))
      let edgekeep = 40
      if (endy < edgekeep) {
        endy = edgekeep
      }
      if (endy > symmetry - edgekeep) {
        endy = symmetry - edgekeep
      }
      drawLine(startx, starty, endx, endy)
    }
  } else {
    // push from the edge to the center style
    let yLocn = 20
    let xLocn = xCenter
    let yStep = 12
    let currentStart = [xCenter, 5]
    // vary the step size for a more organic feel
    let stepSize = 0.25
    for(yLocn; yLocn < xCenter - 5; yLocn += yStep * 2 * Math.random() - yStep / 6) {
      let wideFactor = (xCenter - yLocn) * 2 * Math.PI / Number(sliderValueDisplay2.textContent) * 1.5
      xLocn = xLocn - wideFactor * stepSize / 2 + wideFactor * stepSize * Math.random()
      if (stepSize === 1) {
        stepSize = 0.03
      } else if (stepSize === 0.03) {
        stepSize = 0.05
      } else if (stepSize === 0.05) {
        stepSize = 0.07
      } else if (stepSize === 0.07) {
        stepSize = 0.1
      } else if (stepSize === 0.1) {
        stepSize = 0.15
      } else if (stepSize === 0.15) {
        stepSize = 0.2
      } else if (stepSize === 0.2) {
        stepSize = 0.25
      } else {
        stepSize = 1
      }
      // prevent wandering to the edges
      if (Math.abs(xCenter - xLocn) > 1.1 * Math.abs(yLocn - xCenter)) {
        xLocn = xCenter
      }
      ctx.strokeStyle = color
      drawLine(currentStart[0], currentStart[1], xLocn, yLocn)
      currentStart = [xLocn, yLocn]
    }
  }
}

function autofill() {
  const fillableAreas = []
  const img = ctx.getImageData(0, 0, symmetry, symmetry)
  const bgdata = img.data
  getFillableAreas(symmetry, slider2.value, bgdata, fillableAreas)
  // then step through fillable areas
  const img2 = ctx.getImageData(0, 0, symmetry, symmetry)
  stepThroughFillables(img2, fillableAreas, colorlist, symmetry)
  ctx.putImageData(img2, 0, 0)
}

function getFillableAreas(width, slider1, bgdata, fillableAreas) {
  // get the fillable areas we want to fill
  // use the symmetry to cut down on calls
  // we want something wide enough to carry one symmetry in all cases
  let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
  const igdata = bgdata.slice()
  if (wideFactor < 5) wideFactor = 5
  const seen = new Set()
  for (let prex = 0; prex < wideFactor; prex++) {
    for (let prey = 0; prey < width / 2; prey++) {
      // work outward from the center (for order of color purposes)
      // we skip some pixels for speed; that can miss areas sometimes if they're very small
      let x = prex % 2 === 0 ? Math.abs(width / 2 - prex) : width / 2 + prex
      let y = prey % 2 === 0 ? Math.abs(width / 2 - prey) : width / 2 + prey
      if (seen.has([x, y].join(','))) {
        continue
      }
      // do this in symmetric points order
      // don't revisit seen points
      // get the center of area first
      blackfun = true
      let startcoords = getAdjacentWhite(igdata, x, y, width, width, blackfun)
      let total = startcoords.reduce((acc, curr) => {return [acc[0] + curr[0], acc[1] + curr[1]]}, [0, 0])
      x = Math.round(total[0] / startcoords.length)
      y = Math.round(total[1] / startcoords.length)
      const symmetricPoints = []
      let presymmetricPoints = getSymmetryPoints(x, y)
      for (let [xx, yy] of presymmetricPoints) {
        if (!seen.has([xx, yy].join(','))) symmetricPoints.push([xx, yy])
        seen.add([xx, yy].join(','))
      }
      for (let coord of startcoords) {
        seen.add(coord.join(','))
      }
      const thisArea = []
      let emptyCounter = 0
      // capture the center
      if ((prex === 0 && prey === 0) || symmetricPoints.length >= Math.floor(slider1)) {
        let alwayswhite = false
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          let i = (yy * width + xx) * 4
          // only fill white pixel areas
          let canWhite = isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})
          if (!canWhite) {
            i = i - 8
            xx = xx - 2
            canWhite = isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})
            if (!canWhite) {
              i = i + 24
              xx = xx + 6
              canWhite = isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})
            }
          }
          if (alwayswhite || canWhite) {
            alwayswhite = false
            emptyCounter += 1
            let allcoords = getAdjacentWhite(bgdata, xx, yy, width, width, false)
            if (allcoords.length > 0) {
              let exclusion = false
              for (const [x, y] of allcoords) {
                // don't use the edge areas
                if ((x === 0 && (y === 0 || y === width - 1)) || (x === width - 1 && (y === 0 || y === width - 1))) {
                  exclusion = true
                }
                // bgdata is just to claim space, so it also claims exclusion areas we won't fill later
                const j = (y * width + x) * 4
                bgdata[j]     = 0
                bgdata[j + 1] = 0
                bgdata[j + 2] = 0
                bgdata[j + 3] = 255
              }
              if (!exclusion) {
                // this does the actual filling (pass by reference)
                thisArea.push(allcoords)
              }
            }
          } else {
            //console.log(`not white pixel ${xx} ${yy}`)
          }
        }
        if ((prex === 0 && prey === 0) || emptyCounter >= Math.floor(slider1 / 2)) {
          fillableAreas.push(thisArea)
        }
      }
    }
  }
}

function stepThroughFillables(img2, fillableAreas, palArr, width) {
  // fillableAreas is an array of arrays of points that represent areas to fill in
  // in color stepping order (of palArr)
  const data = img2.data
  let palLocn = 0
  let altpal = 1
  for (let i = 0; i < fillableAreas.length; i++) {
    let usecolor = hexToRgb(palArr[palLocn][1])
    let altcolor = hexToRgb(palArr[altpal][1])
    palLocn = palLocn + 1
    altpal = altpal + 1
    // -1 -- don't use white as an autofill color
    if (palLocn >= palArr.length - 1) palLocn = 0
    if (altpal >= palArr.length - 1) altpal = 0
    for (let k = 0; k < fillableAreas[i].length; k++) {
      for (let j = 0; j < fillableAreas[i][k].length; j++) {
        if (!fillableAreas[i][k][j]) continue
        let x = fillableAreas[i][k][j][0]
        let y = fillableAreas[i][k][j][1]      
        const l = (y * width + x) * 4
        if (k % 4 === 1 || k % 4 === 2) {
          data[l]     = altcolor.r
          data[l + 1] = altcolor.g
          data[l + 2] = altcolor.b
          data[l + 3] = 255
        } else {
          data[l]     = usecolor.r
          data[l + 1] = usecolor.g
          data[l + 2] = usecolor.b
          data[l + 3] = 255
        }
      }
    }
  }  
}

// wire up sliders and buttons

document.getElementById("loadButton").addEventListener("click", load)
document.getElementById("randButton").addEventListener("click", randomDraw)
document.getElementById("autofill").addEventListener("click", autofill)

sliderValueDisplay.textContent = 4

slider.addEventListener("input", (event) => {
   	const sliderValue = event.target.value
   	sliderValueDisplay.textContent = sliderValue
});

const pointerButtons = document.querySelectorAll('input[name="pointer"]')

pointerButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    drawOrFill = document.querySelector('input[name="pointer"]:checked').value
    drawFillSwap()
  })
})

pointerButtons[0].checked = true

const fillstyleButtons = document.querySelectorAll('input[name="fillstyle"]')

fillstyleButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    fillOrOther = document.querySelector('input[name="fillstyle"]:checked').value
  })
})

fillstyleButtons[0].checked = true

sliderValueDisplay2.textContent = 16

slider2.addEventListener("input", (event) => {
   	const sliderValue2 = event.target.value
   	sliderValueDisplay2.textContent = sliderValue2
});

rslider.value = 127
gslider.value = 127
bslider.value = 127
rsliderValueDisplay.textContent = 127
gsliderValueDisplay.textContent = 127
bsliderValueDisplay.textContent = 127

rslider.addEventListener("input", (event) => {
  const sliderValue = event.target.value
  rsliderValueDisplay.textContent = sliderValue
  colorUpdate([rslider.value, gslider.value, bslider.value], false)
})

gslider.addEventListener("input", (event) => {
  const sliderValue = event.target.value
  gsliderValueDisplay.textContent = sliderValue
  colorUpdate([rslider.value, gslider.value, bslider.value], false)
})

bslider.addEventListener("input", (event) => {
  const sliderValue = event.target.value
  bsliderValueDisplay.textContent = sliderValue
  colorUpdate([rslider.value, gslider.value, bslider.value], false)
})

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("mySlider");
  slider.value = 4;   // Force it back to 4
  const slider2 = document.getElementById("mySlider2");
  slider2.value = 16;   // Force it back to 16
});

