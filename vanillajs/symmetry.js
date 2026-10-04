var canvas = document.getElementById("drawCanvas");

var getcanvas, ctx, prevX, prevY
let symmetry = canvas.width
let xCenter = symmetry / 2
let slider = document.getElementById("mySlider")
let sliderValueDisplay = document.getElementById("sliderValue")
let slider2 = document.getElementById("mySlider2")
let sliderValueDisplay2 = document.getElementById("sliderValue2")
let color = "#1A202C"
let drawOrFill = 'draw'
let drawOrFillDisplay = document.getElementById("drawOrFill")
let fillOrOther = 'every'
let fillOrOtherDisplay = document.getElementById("fillOrOther")

/**
 *  Colors button event listner example
 *
**/
const colorlist = [
  ["red", "#FC8181"], ["orange", "#FFA500"], ["yellow", "#DEDE20"], ["green", "#2FD175"], 
  ["darkgreen", "#108010"], ["blue", "#4383ED"],["darkblue", "#1213BD"], ["purple", "#9F7AEA"],
  ["magenta", "#BD12B5"], ["brown", "#483C2C"], ["black", "#000000"], ["eraser", "#FFFFFF"]
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
  // trade between draw mode and fill mode
  if (drawOrFill === 'draw') {
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = "url('fill.png') 1 24, auto"
    })
    drawOrFill = 'fill'
  } else {
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = "url('pencil.png') 6 26, auto"
    })
    drawOrFill = 'draw'
  }
}

function drawFillOtherSwap() {
  // trade between fill all areas and fill part
  if (fillOrOther === 'every') {
    fillOrOther = 'other'
  } else if (fillOrOther === 'other') {
    fillOrOther = 'one'
  } else {
    fillOrOther = 'every'
  }
}

function drawFill(e) {
  if (drawOrFill === 'draw') {
    draw(e)
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

function getAdjacentWhite(ctx, startX, startY, width, height) {
    // determine what area we are filling in
    const stack = new Int32Array(width * height * 2)
    const img = ctx.getImageData(0, 0, width, width)
    const data = img.data
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

      if (!(r === curColorR && g === curColorG && b === curColorB)) continue

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

function fill(e) {
  // fill areas with color 
  var coord = getLocalCoordinates(e);
  if (e.buttons == 1 || e.type == "touchmove") {
    var x = Math.floor(coord[0])
    var y = Math.floor(coord[1])
    let symmetricPoints = getSymmetryPoints(x, y)
    if (fillOrOther === 'one') {
      symmetricPoints = [[x, y]]
    }
    const img = ctx.getImageData(0, 0, symmetry, symmetry)
    const data = img.data
    let usecolor = hexToRgb(color)
    let idx = 0
    for (const [prex, prey] of symmetricPoints) {
      // there tend to be two mirrors in one white zone, necessitating division by 4 to hit every other white zone
      if (idx % 4 != 0 && fillOrOther === 'other') {
        idx = idx + 1
        continue
      }
      idx = idx + 1
      let allcoords = getAdjacentWhite(ctx, Math.floor(prex), Math.floor(prey), symmetry, symmetry)
    
      for (const [x, y] of allcoords) {
        const i = (y * symmetry + x) * 4
        data[i]     = usecolor.r
        data[i + 1] = usecolor.g
        data[i + 2] = usecolor.b
        data[i + 3] = 255
      }
    }
    
    ctx.putImageData(img, 0, 0)
  }
}

function draw(e) {
  var coord = getLocalCoordinates(e);
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
    result.push([x, y]);
    // this mirrors the points around the spoke of the symmetry
    // hence symmetry === 2 is actually 4 etc.
    // but it allows the user to easily draw closed areas
    if (true) {
      x = ctrX - Math.sin(theta) * dist;
      result.push([x, y]);
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
    ctx.moveTo(startPoints[i][0], startPoints[i][1]);
    ctx.lineTo(endPoints[i][0], endPoints[i][1]);
  }

  ctx.stroke()

//  ctx.stroke();
}

// Get local coor in an array
function getLocalCoordinates(ev) {
  if (ev.type == "touchmove") {
    var touch = ev.touches[0] || ev.changedTouches[0];
    var realTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    ev.offsetX = touch.clientX - realTarget.getBoundingClientRect().x;
    ev.offsetY = touch.clientY - realTarget.getBoundingClientRect().y;
  }
  return [ev.offsetX + 0.5, ev.offsetY + 0.5];
}

function randomDraw() {
  // four styles of random mandala
  if (Math.random() < 0.2) {
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
  } else if (Math.random() < 0.2) {
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
  } else if (Math.random() < 0.5) {
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

// wire up sliders and buttons

document.getElementById("loadButton").addEventListener("click", load);
document.getElementById("randButton").addEventListener("click", randomDraw);

sliderValueDisplay.textContent = 4

slider.addEventListener("input", (event) => {
   	const sliderValue = event.target.value;
   	sliderValueDisplay.textContent = sliderValue;
});

drawOrFillDisplay.textContent = drawOrFill

document.getElementById("drawFillSwap").addEventListener("click", () => {
  drawFillSwap()
  drawOrFillDisplay.textContent = drawOrFill
})

fillOrOtherDisplay.textContent = fillOrOther

document.getElementById("drawFillOther").addEventListener("click", () => {
  drawFillOtherSwap()
  fillOrOtherDisplay.textContent = fillOrOther
})

sliderValueDisplay2.textContent = 16

slider2.addEventListener("input", (event) => {
   	const sliderValue2 = event.target.value;
   	sliderValueDisplay2.textContent = sliderValue2;
});

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("mySlider");
  slider.value = 4;   // Force it back to 4
  const slider2 = document.getElementById("mySlider2");
  slider2.value = 16;   // Force it back to 16
});

