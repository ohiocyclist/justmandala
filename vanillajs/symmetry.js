var canvas = document.getElementById("drawCanvas");

const notan = false
const fillablesStyle = 1
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
    const maxsize = width * height * 4
    const stack = new Int16Array(maxsize)
    let sp = 0

    stack[sp++] = startX
    stack[sp++] = startY

    const visited = new Uint8Array(width * height)
    let result = new Int16Array(width * height * 2)
    let index = 0

    let i = (startY * width + startX) * 4
    let curColorR = data[i]
    let curColorG = data[i + 1]
    let curColorB = data[i + 2]

    // this needs to be 2 because it will decrement twice, which would drive it under zero
    while (sp > 1) {
      if (sp > maxsize) {
        console.error('getadjacentwhite: stack grew larger than the max')
        sp = maxsize - 2
      }
      const y = stack[--sp]
      // ut-oh
      if (y === undefined) {
        console.error('getadjacentwhite: y is not defined, startX and startY and stack pointer and index were: ', startX, startY, sp, index)
        result = result.slice(0, index)
        return [result, index]
      }
      const x = stack[--sp]

      let idx = y * width + x
      if (visited[idx]) continue
      visited[idx] = 1

      if (x < 0 || y < 0 || x >= width || y >= height) continue

      const i = idx * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]

      if ((blackfun && (r < 240 || g < 240 || b < 240)) || (!blackfun && !(r === curColorR && g === curColorG && b === curColorB))) {
        continue
      }

      result[index++] = x
      result[index++] = y

      stack[sp++] = x + 1; stack[sp++] = y
      stack[sp++] = x - 1; stack[sp++] = y
      stack[sp++] = x;     stack[sp++] = y + 1
      stack[sp++] = x;     stack[sp++] = y - 1
    }
    result = result.slice(0, index)
    return [result, index]
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
    let [allcoords, alllength] = getAdjacentWhite(data, x, y, symmetry, symmetry, false)
    const pimg = ctx.getImageData(x, y, 1, 1)
    const da = pimg.data    
    const refr = da[0]
    const refg = da[1]
    const refb = da[2]
    let symmetricPoints = []
    // help target small areas
    if (alllength < 800 && fillorOther !== 'one') {
      for (let i = 0; i < Math.min(alllength, 200); i += 8) {
        let thispoints = getSymmetryPoints(allcoords[i], allcoords[i + 1])
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
        if (idx % 2 != 0 && fillOrOther === 'other') {
          idx = idx + 1
          continue
        }
        if (idx >= Math.floor(symmetricPoints.length / 2) && fillOrOther === 'other') continue
        idx = idx + 1
        let [allcoords, alllength] = getAdjacentWhite(data, Math.floor(prex), Math.floor(prey), symmetry, symmetry, false)
        
        for (let k = 0; k < alllength; k += 2) {
          x = allcoords[k]
          y = allcoords[k + 1]
          const i = (y * symmetry + x) * 4
          data[i]     = usecolor.r
          data[i + 1] = usecolor.g
          data[i + 2] = usecolor.b
          data[i + 3] = 255
        }
      } else {
        // need to preserve location for every-other
        idx = idx + 1
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
  // update for the autofill
  for (let i = 0; i < colorlist.length; i++) {
    if (colorlist[i][0] === 'flex') {
      colorlist[i][1] = rgbToHex(data[0], data[1], data[2])
      break
    }
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

function getSymmetryPoints(x, y, domirror=true) {
  // The coordinate system has its origin at the center of the canvas,
  // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
  var ctrX = Math.floor(symmetry / 2);
  var ctrY = Math.floor(symmetry / 2);
  var relX = x - ctrX;
  var relY = ctrY - y;
  var dist = Math.hypot(relX, relY);
  var angle = Math.atan2(relX, relY); // Radians
  var result = [];
  var radian = Number(sliderValueDisplay2.textContent)
  // push all the originals, then all the mirrors
  for (var i = 0; i < radian; i++) {
    var theta = angle + ((Math.PI * 2) / radian) * i; // Radians
    x = ctrX + Math.sin(theta) * dist;
    y = ctrY - Math.cos(theta) * dist;
    result.push([Math.round(x), Math.round(y)]);
  }
  // this mirrors the points around the spoke of the symmetry
  // hence symmetry === 2 is actually 4 etc.
  // but it allows the user to easily draw closed areas
  if (domirror) {
    for (var i = 0; i < radian; i++) {
      var theta = angle + ((Math.PI * 2) / radian) * i; // Radians
      y = ctrY - Math.cos(theta) * dist;
      x = ctrX - Math.sin(theta) * dist;
      result.push([Math.round(x), Math.round(y)]);
    }
  }

  //console.log(result)
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

function randomMandala(cx, cy, radius, mirrorFactor) {
    // this function provided by Microsoft Copilot
    let points = [];
    let count = 5 + Math.floor(Math.random() * 6);

    // Generate a random stroke in one wedge
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * radius,
            y: (Math.random() - 0.6) * radius * 0.5
        });
    }

    // Mirror around center
    // We don't need to draw all the mirrors, Copilot didn't
    // understand that the rest of the code takes care of that
    for (let m = 0; m <= 0; m++) { //m < mirrorFactor; m++) {
        let a = (Math.PI * 2 * m) / mirrorFactor;
        let cosA = Math.cos(a);
        let sinA = Math.sin(a);

        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i + 1];

            let x1 = cx + p1.x * cosA - p1.y * sinA;
            let y1 = cy + p1.x * sinA + p1.y * cosA;

            let x2 = cx + p2.x * cosA - p2.y * sinA;
            let y2 = cy + p2.x * sinA + p2.y * cosA;

            drawLine(x1, y1, x2, y2);

            // Optional reflection for denser mandalas
            drawLine(
                cx + p1.x * cosA + p1.y * sinA,
                cy + p1.x * sinA - p1.y * cosA,
                cx + p2.x * cosA + p2.y * sinA,
                cy + p2.x * sinA - p2.y * cosA
            );
        }
    }
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

const fileInput = document.getElementById('fileInput')

fileInput.addEventListener('change', function(event) {
  const selectedFile = event.target.files[0]

  if (selectedFile) {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        ctx.drawImage(img, 0, 0, symmetry, symmetry)    
      }      
    }
    reader.readAsDataURL(selectedFile)
  }
})

function randomDraw() {
  ctx.strokeStyle = color
  ctx.lineWidth = Number(sliderValueDisplay.textContent)
  // five styles of random mandala
  const randval = Math.random()
  if (randval < 0.12) {
    console.log("copilot style")
    randomMandala(xCenter, xCenter, xCenter, slider2.value)
  } else if (randval < 0.24) {
    // interlocking circles style
    console.log("circles style")
    let arcrad = 100
    ctx.moveTo(xCenter + arcrad, xCenter)
    ctx.arc(xCenter, xCenter, arcrad, 0, Math.PI * 2)
    ctx.stroke()
    let aroundfactor = 6
    // draw the circles within the zone
    for (let i = 0; i < aroundfactor; i++) {
      for (let j = 1; j < 4; j++) {
        for (let k = 0; k < aroundfactor; k++) {
          let x = Math.cos(i * Math.PI * 2 / aroundfactor) * arcrad * j + Math.cos(k * Math.PI * 2 / aroundfactor) * arcrad + xCenter
          let y = Math.sin(i * Math.PI * 2 / aroundfactor) * arcrad * j + Math.sin(k * Math.PI * 2 / aroundfactor) * arcrad + xCenter
          ctx.moveTo(x + arcrad, y)
          ctx.arc(x, y, arcrad, 0, Math.PI * 2)
          ctx.stroke()      
        }
      }
      // draw the breaks between the zones
      let x = Math.cos(i * Math.PI * 2 / aroundfactor) * xCenter + xCenter
      let y = Math.sin(i * Math.PI * 2 / aroundfactor) * xCenter + xCenter
      ctx.moveTo(xCenter, xCenter)
      ctx.lineTo(x, y)
      ctx.stroke()
      x = Math.cos((i + 1/2) * Math.PI * 2 / aroundfactor) * 3.5 / 5 * xCenter + xCenter
      y = Math.sin((i + 1/2) * Math.PI * 2 / aroundfactor) * 3.5 / 5 * xCenter + xCenter
      ctx.moveTo(xCenter, xCenter)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  } else if (randval < 0.36) {
    // geometric forms style
    console.log("geo forms")
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
  } else if (randval < 0.48) {
    console.log("voronoi")
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
  } else if (randval < 0.6) {
    console.log("spiral")
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
  } else if (randval < 0.72) {
    console.log("straight lines")
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
    console.log("interlocking crossing lines")
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
    console.log("edge to center push")
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
  if (fillablesStyle === 2) {
    getFillableAreas(symmetry, slider2.value, bgdata, fillableAreas)
  } else {
    getAllFillable(symmetry, slider2.value, bgdata, fillableAreas)
  }
  // then step through fillable areas
  const img2 = ctx.getImageData(0, 0, symmetry, symmetry)
  stepThroughFillables(img2, fillableAreas, colorlist, symmetry)
  ctx.putImageData(img2, 0, 0)
}

function getAllWhiteAreas(bgdata, realoutputs, slider1, width) {
  let areaNumber = 0
  let areaMap = new Int16Array(width * width)
  let output = {}
  let wideFactor = Math.floor((width / 2 - 20) * Math.PI / Number(slider1) * 2.2)
  let xMin = Math.floor(width / 2 - wideFactor)
  let xMax = Math.round(width / 2 + wideFactor)
  for (let y = 0; y < width; y++) {
    for (let x = width - 1; x >= 0; x--) {
      let idx = x + y * width
      let bdx = idx * 4
      let prevNumber = 0
      // skip forward past non-white areas
      let whiteconditional = (bdx) => bgdata[bdx] < 215 || bgdata[bdx + 1] < 215 || bgdata[bdx + 2] < 215
      if (whiteconditional(bdx)) {
        areaMap[idx] = 0
        continue
      }
      // get the previous correct color
      if (x > 0 && areaMap[idx - 1] > 0) {
        prevNumber = areaMap[idx - 1]
      }
      if (y > 0 && areaMap[idx - width] > 0) {
        prevNumber = areaMap[idx - width]
      }
      if (prevNumber === 0) {areaNumber = areaNumber + 1; prevNumber = areaNumber; output[prevNumber] = []}
      areaMap[idx] = prevNumber
    }
  }

  // merge step combo x
  let prevNumber = 0
  for (let y = 0; y < width; y++) {
    for (let x = width - 1; x >= 0; x--) {
      idx = x + y * width
      // force to Y merge number if available
      // step over in x as well
      let fact = 1
      if (x === width - fact) fact = 0
      if (areaMap[idx - width - fact] !== 0 && areaMap[idx - width - fact] != undefined) {
        prevNumber = areaMap[idx - width - fact]
      } else if (x < width - 3 && areaMap[idx + 3] !== 0 && areaMap[idx + 3] != undefined) {
        prevNumber = areaMap[idx + 3]
      }
      // now recolor with x or y
      if (prevNumber !== 0 && areaMap[idx] !== 0) {
        areaMap[idx] = prevNumber
        output[prevNumber].push([x, y])
      } else if (areaMap[idx] !== 0) {
        if (!output[areaMap[idx]]) output[areaMap[idx]] = []
        output[areaMap[idx]].push([x, y])
      }
      prevNumber = areaMap[idx]
    }
  }

  // merge step diagonals
  equivs = {}

  // 1. Helper function to find the absolute "boss" (root) of any area
  // This uses path compression, making future lookups near-instant O(1)
  function findBoss(id, equivs) {
    let root = id;
    while (equivs[root]) {
      root = equivs[root];
    }
    
    // Path compression: point directly to the ultimate boss to speed up next time
    let current = id;
    while (current !== root) {
      let next = equivs[current];
      equivs[current] = root;
      current = next;
    }
    
    return root;
  }

  // 2. Your updated loop structure
  for (let y = 0; y < width; y++) {
    for (let x = width - 2; x >= 0; x--) {
      const idx = x + y * width;
      
      const leftArea = areaMap[idx];
      const rightArea = areaMap[idx + 1];
      
      // Only merge if both are valid areas and they aren't already the same literal ID
      if (leftArea > 0 && rightArea > 0 && leftArea !== rightArea) {
        
        // Find the ultimate boss of BOTH stripes
        const bossLeft = findBoss(leftArea, equivs);
        const bossRight = findBoss(rightArea, equivs);
        
        // If they don't share the same ultimate boss yet, link them!
        if (bossLeft !== bossRight) {
          // Make the smaller or larger ID the boss (consistently) to prevent cycles
          if (bossLeft < bossRight) {
            equivs[bossRight] = bossLeft;
          } else {
            equivs[bossLeft] = bossRight;
          }
        }
      }
    }
  }

  const equivBuckets = {}

  for (let j = 1; j <= areaNumber; j++) {
    // Always resolve to the absolute, ultimate root boss
    const ultimateBoss = findBoss(j, equivs)
    
    // If an area has no matches, it is its own ultimate boss (ultimateBoss === j)
    // We only want to group things if they actually belong to a multi-area cluster,
    // or you can group EVERYTHING by its boss. Let's group everything by its ultimate boss:
    if (equivBuckets[ultimateBoss] === undefined) {
      equivBuckets[ultimateBoss] = [j]
    } else {
      equivBuckets[ultimateBoss].push(j)
    }
  }

  // 2. Pre-flatten all output subarrays once—O(N) flat pass
  const flatOutputs = new Array(areaNumber + 1)
  for (let i = 1; i <= areaNumber; i++) {
    const out = output[i]
    // Check length > 2 before wasting time flattening
    flatOutputs[i] = (out && out.length > 2) ? out.flat() : null
  }

  const deads = new Uint8Array(areaNumber + 1) // +1 to safely handle 1-based indexing

  for (let i = 1; i <= areaNumber; i++) {
    //const currentFlat = flatOutputs[i];
    const currentFlat = output[i]
    
    if (currentFlat && !deads[i]) {
      // Start the tracking array for this group
      let combinedFlat = []
      if (fillablesStyle) {
        combinedFlat = [...currentFlat.flat()]
      } else {
        combinedFlat = [...currentFlat]
      }
      
      if (combinedFlat.length < 2) continue
            
      // Look up pre-grouped matches instantly instead of looping over everything
      const matches = equivBuckets[i];
      if (matches) {
        for (let m = 0; m < matches.length; m++) {
          const j = matches[m];
          if (!deads[j]) { // Safety check, though usually redundant depending on logic
            deads[j] = 1;
            
            // Flattened data is already prepared; push elements efficiently
            const matchFlat = flatOutputs[j];
            if (matchFlat) {
              let matchout = 0
              let matchstride = 60000
              while (matchFlat.length > matchout) {
                combinedFlat.push(...matchFlat.slice(matchout, Math.min(matchFlat.length, matchout + matchstride)))
                matchout += matchstride
              }
            }
          }
        }
      }
      
      // Push using the exact nesting structure from your original code: [[[x1, y1, ...]]]

      // exclusion zone
      let maxval = 0
      if (fillablesStyle) {
        maxval = Math.max(...combinedFlat.slice(0, Math.min(combinedFlat.length, 65500)))
      } else {
        maxval = Math.max(...combinedFlat.slice(0, Math.min(combinedFlat.length, 65500)))
      }
      if (maxval > width - 2) {
        continue
      }
      
      if (combinedFlat.length > 2) {
        realoutputs.push(combinedFlat)
      }
    }
  }
}

function areaBasedSymmetry(realoutputs, fillableAreas, width) {
  const everyonespoints = []
  for (let i = 1; i < realoutputs.length; i++) {
    if (realoutputs[i] === undefined || realoutputs[i].length < 3) {
      continue
    }
    let tempset = new Set()
    for (let k = 0; k < realoutputs[i].length; k += 2) {
      tempset.add([realoutputs[i][k], realoutputs[i][k + 1]].join(','))
    }
    let startlength = [...tempset].length
    let total = [...tempset].reduce((acc, curr) => {
      let mycurr = curr.split(',')
      acc[0] += Number(mycurr[0])
      acc[1] += Number(mycurr[1])
      return acc
    }, [0, 0])
    x = Math.round(total[0] / startlength)
    y = Math.round(total[1] / startlength)
    // let's try a guaranteed point towards the middleish
    // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
    const loopprog = performance.now()
    startcoordssort = [...tempset].sort().map((x) => {splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
    // points just flat-out doesn't work.  Better to hope the inner and outer area's centers aren't close.
    let pstamp = 0
    if (!tempset.has([x,y].join(','))) {
      pstamp = [...tempset].length
      const picmid = Math.floor(startcoordssort.length / 2)
      //x = startcoordssort[picmid][0]
      //y = startcoordssort[picmid][1]
    }
    while(everyonespoints.length < i + 1) {
      everyonespoints.push([])
    }
    everyonespoints[i] = [x, y, pstamp]
  }

  usedpoints = {}
  for (let i = 1; i < realoutputs.length; i++) {    
    if (usedpoints[i]) continue
    [x, y] = everyonespoints[i]
    const symmetricPoints = getSymmetryPoints(x, y, false)
    thisarea = []
    for (let j = 1; j < everyonespoints.length; j++) {
      let mindist = 999999
      let winnerpick = 0
      let counterpick = -1
      if (everyonespoints[j] && !usedpoints[j]) {
        // get these out in order of symmetricPoints
        let counter = 0
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          idx = (xx + yy * width)
          let thisdist = euclidDistance(xx, yy, everyonespoints[j][0], everyonespoints[j][1])
          // if the number of points is stamped, make sure it's similar
          // if (everyonespoints[i][2] > 50) console.log('pstamp comparison:', everyonespoints[i][2], everyonespoints[j][2])
          if (thisdist < mindist && everyonespoints[j][2] > everyonespoints[i][2] - 125 && everyonespoints[j][2] < everyonespoints[i][2] + 125) {
            mindist = thisdist
            winnerpick = j
            counterpick = counter
          }
          counter = counter + 1
        }
      }
      //myrad = euclidDistance(symmetricPoints[0][0], symmetricPoints[0][1], xCenter, xCenter)
      //if (mindist <= myrad / 24) {
      if (mindist < 4) {
        //console.log(mindist, everyonespoints[winnerpick], winnerpick)
        usedpoints[winnerpick] = 1
        while(thisarea.length < counterpick + 1) {
          thisarea.push([])
        }
        thisarea[counterpick] = realoutputs[winnerpick]
      }
    }
    const actarr = []
    for (let i = 0; i < thisarea.length; i++) {
      if (thisarea[i] && thisarea[i][0]) actarr.push(thisarea[i])
    }
    fillableAreas.push(actarr)
  }  

  // check for unfilled areas
  for(let i = 0; i < realoutputs.length; i++) {
    if (!usedpoints[i]) {
      console.log("unfilled area", i, realoutputs[i][0], realoutputs[i][1])
      // don't color the background
      if ((realoutputs[i][0] === 0 || realoutputs[i][0] === width - 1) && (realoutputs[i][1] === 0 || realoutputs[i][1] === width - 1)) continue
      fillableAreas.push([realoutputs[i]])
    }
  }
}

function stackSweepOnAreas(bgdata, realoutputs, fillableAreas, width, slider1) {
  // do the standard setup
  let seen = new Set()
  for (let i = 1; i < realoutputs.length; i++) {
    if (realoutputs[i] === undefined || realoutputs[i].length < 3) {
      continue
    }
    let tempset = new Set()
    //for (let k = 0; k < startlength; k += 2) {
    let startlength = realoutputs[i].length
    for (let k = 0; k < realoutputs[i].length; k++) {
      //tempset.add([startcoords[k], startcoords[k + 1]].join(','))
      tempset.add([realoutputs[i][k][0], realoutputs[i][k][1]].join(','))
    }
    let total = [...tempset].reduce((acc, curr) => {
      let mycurr = curr.split(',')
      acc[0] += Number(mycurr[0])
      acc[1] += Number(mycurr[1])
      return acc
    }, [0, 0])
    x = Math.round(total[0]  / startlength)
    y = Math.round(total[1]  / startlength)
    // let's try a guaranteed point towards the middleish
    // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
    const loopprog = performance.now()
    startcoordssort = [...tempset].sort().map((x) => {splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
    if (!tempset.has([x,y].join(','))) {
      const picmid = Math.floor(startcoordssort.length / 2)
      x = startcoordssort[picmid][0]
      y = startcoordssort[picmid][1]
    }
    const symmetricPoints = []
    let presymmetricPoints = getSymmetryPoints(x, y, false)
    for (let [xx, yy] of presymmetricPoints) {
      xx = Math.round(xx)
      yy = Math.round(yy)
      idx = (xx + yy * width)
      symmetricPoints.push([xx, yy])
      seen[idx] = 1
    }
    for (let val of startcoordssort) {
      seen[val[0] + width * val[1]] = 1
    }
    let thisArea = []
    for (let [xx, yy] of symmetricPoints) {
      xx = Math.round(xx)
      yy = Math.round(yy)
      let i = (yy * width + xx) * 4
      // only fill white pixel areas
      let canWhite = (bgdata[i] > 30 && bgdata[i + 1] > 30 && bgdata[i + 2] > 30)
      if (canWhite) {
        let [allcoords, alllength] = getAdjacentWhite(bgdata, xx, yy, width, width, false)
        if (alllength > 0) {
          let exclusion = false
          for (let k = 0; k < allcoords.length; k += 2) {
            let x = allcoords[k]
            let y = allcoords[k + 1]
            seen[x + width * y] = 1
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
            if (notan && thisArea.length >= slider1) {
              fillableAreas.push(thisArea)
              thisArea = []
            }
          }
        }
      } else {
        //console.log(`not white pixel ${xx} ${yy}`)
      }
    }
    if (thisArea.length >= slider1.length / 2) {
      fillableAreas.push(thisArea)
    }
  }
}

function getAllFillable(width, slider1, bgdata, fillableAreas) {
  const starttime = performance.now()
  const realoutputs = []
  getAllWhiteAreas(bgdata, realoutputs, slider1, width)
  const midpoint = performance.now()
  console.log('first half', midpoint - starttime)

  if (fillablesStyle) { 
    areaBasedSymmetry(realoutputs, fillableAreas, width)
  } else {
    stackSweepOnAreas(bgdata, realoutputs, fillableAreas, width, slider1)
  }
  console.log('second half', performance.now() - midpoint)
}

function getFillableAreas(width, slider1, bgdata, fillableAreas) {
  // get the fillable areas we want to fill
  // use the symmetry to cut down on calls
  // we want something wide enough to carry one symmetry in all cases
  let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
  const igdata = bgdata.slice()
  if (wideFactor < 5) wideFactor = 5
  const seen = new Uint8Array(width * width)
  const start = performance.now()
  let timeup = performance.now() - start
  let timeone = 0
  let timetwo = 0
  let starttime = performance.now()
  // pre-sweep for big empty areas
  let sweepy = 0
  for (sweepy = 0; sweepy < xCenter; sweepy++) {
    let doublebreak = false
    for (let sweepx = 0; sweepx < width; sweepx++) {
      idx = (sweepx + width * sweepy) * 4
      if (bgdata[idx] < 240 && bgdata[idx + 1] < 240 && bgdata[idx + 2] < 240) {
        doublebreak = true
        break
      }
    }
    if (doublebreak) {
      break
    }
  }
  for (let prex = 0; prex < wideFactor; prex++) {
    for (let prey = 0; prey < width / 2 - sweepy; prey++) {
      const loopstart = performance.now()
      // reflect a little that we're working a triangle
      // but if we cut too many pixels out, we leave unfilled areas
      if (prey > width / 32 && prey < width / 8 && (prex < 1 * wideFactor / 8 || prex > 7 * wideFactor / 8)) continue
      if (prey >= width / 8 && prey < 3 * width / 16 && (prex < 1 * wideFactor / 4 || prex > 3 * wideFactor / 4)) continue
      // more space at the edges
      if (prey > 3 * width / 8 && prex % 4 === 3) continue
      // work outward from the center (for order of color purposes)
      // we skip some pixels for speed; that can miss areas sometimes if they're very small
      let x = prex % 2 === 0 ? Math.abs(width / 2 - prex) : width / 2 + prex
      let y = prey % 2 === 0 ? Math.abs(width / 2 - prey) : width / 2 + prey
      idx = (x + y * width)
      if (seen[idx]) {
        continue
      }
      // do this in symmetric points order
      // don't revisit seen points
      // get the center of area first
      blackfun = true
      let [startcoords, startlength] = getAdjacentWhite(igdata, x, y, width, width, blackfun)
      if (startlength < 3) continue
      let tempset = new Set()
      for (let k = 0; k < startlength; k += 2) {
        tempset.add([startcoords[k], startcoords[k + 1]].join(','))
      }
      /*
      let total = startcoords.reduce((acc, curr, index) => {
        if (index % 2 === 0) {
          acc[0] += curr
        } else {
          acc[1] += curr
        }
        return acc
      }, [0, 0])
      */
      let total = [...tempset].reduce((acc, curr) => {
        let mycurr = curr.split(',')
        acc[0] += Number(mycurr[0])
        acc[1] += Number(mycurr[1])
        return acc
      }, [0, 0])
      // * 2 -- the new way startlength holds data, one for x, one for y, instead of counting pairs
      x = Math.round(total[0] * 2 / startlength)
      y = Math.round(total[1] * 2 / startlength)
      // let's try a guaranteed point towards the middleish
      // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
      timeone = timeone + performance.now() - loopstart
      const loopprog = performance.now()
      startcoordssort = [...tempset].sort(
        /*(a, b) => {
        const [aS, bS] = [a[0], b[0]]

        if (aS[0] !== bS[0]) {
          return aS[0] - bS[0]
        }

        return aS[1] - bS[1]
      }*/
      ).map((x) => {splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
      if (!tempset.has([x,y].join(','))) {
        const picmid = Math.floor(startcoordssort.length / 2)
        x = startcoordssort[picmid][0]
        y = startcoordssort[picmid][1]
      }
      const symmetricPoints = []
      let presymmetricPoints = getSymmetryPoints(x, y, false)
      for (let [xx, yy] of presymmetricPoints) {
        idx = (xx + yy * width)
        if (!seen[idx]) symmetricPoints.push([xx, yy])
        seen[idx] = 1
      }
      for (let val of startcoordssort) {
        seen[val[0] + width * val[1]] = 1
      }
      let emptyCounter = 0
      timetwo = timetwo + performance.now() - loopprog
      // capture the center
      const centerstart = performance.now()
      if ((prex === 0 && prey === 0) || true || symmetricPoints.length >= Math.floor(slider1)) {
        let thisArea = []
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          let i = (yy * width + xx) * 4
          // only fill white pixel areas
          let canWhite = isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})
          if (canWhite) {
            emptyCounter += 1
            let [allcoords, alllength] = getAdjacentWhite(bgdata, xx, yy, width, width, false)
            if (alllength > 0) {
              let exclusion = false
              for (let k = 0; k < allcoords.length; k += 2) {
                let x = allcoords[k]
                let y = allcoords[k + 1]
                seen[x + width * y] = 1
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
                if (notan && thisArea.length >= slider1) {
                  fillableAreas.push(thisArea)
                  thisArea = []
                }
              }
            }
          } else {
            //console.log(`not white pixel ${xx} ${yy}`)
          }
        }
        if (true || (prex === 0 && prey === 0) || emptyCounter >= Math.floor(slider1 / 2)) {
          fillableAreas.push(thisArea)
        }
      }
      let littledelta = performance.now() - centerstart
      timeup = timeup + littledelta
    }
  }
  console.log("time", performance.now() - starttime)
  /*
  console.log("outer time", performance.now() - start)
  console.log("one time", timeone)
  console.log("two time", timetwo)
  console.log("inner time", timeup)
  */
}

function stepThroughFillables(img2, fillableAreas, palArr, width) {
  // fillableAreas is an array of arrays of points that represent areas to fill in
  // in color stepping order (of palArr)
  const data = img2.data
  let palLocn = 0
  let altpal = 5
  for (let i = 0; i < fillableAreas.length; i++) {
    //palLocn = Math.floor(Math.random() * (palArr.length - 1))
    let usecolor = hexToRgb(palArr[palLocn][1])
    // sub out black
    if (usecolor.r === 0 && usecolor.g === 0 && usecolor.b === 0) {
      usecolor.r = 120
      usecolor.b = 160
    }
    let altcolor = hexToRgb(palArr[altpal][1])
    if (altcolor.r === 0 && altcolor.g === 0 && altcolor.b === 0) {
      altcolor.r = 120
      altcolor.b = 160
    }
    // Notan style
    if (notan) {
      usecolor = {r: 255, g: 255, b: 255}
      altcolor = {r: 0, g: 0, b: 0}
    }
    palLocn = palLocn + 1
    altpal = altpal + 1
    // -1 -- don't use white as an autofill color
    if (palLocn >= palArr.length - 1) palLocn = 0
    if (altpal >= palArr.length - 1) altpal = 0
    for (let k = 0; k < fillableAreas[i].length; k++) {
      for (let j = 0; j < fillableAreas[i][k].length; j += 2) {
        if (!fillableAreas[i][k][j]) continue
        let x = fillableAreas[i][k][j]
        let y = fillableAreas[i][k][j + 1]      
        const l = (y * width + x) * 4
        // (k % 4 === 1 || k % 4 === 2)
        if ((fillablesStyle === 1 && k % 2 == 1) || (!notan && slider2.value % 2 == 0 && k % 2 === 1) || (notan && ((i % 2 === 0)))) {
        // if ((!notan && slider2.value % 2 == 0 && k % 2 === 1) || (notan && ((i % 2 === 0 && k % 2 === 0) ||
        // (i % 2 === 1 && k % 2 === 1)))) {
        //if (k > Math.floor(fillableAreas[i].length / 2)) {
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

function notanfun() {
  const img = ctx.getImageData(0, 0, symmetry, symmetry)
  const data = img.data
  // sweep over all the data
  for (i = 0; i <= xCenter; i++) {
    for (j = 0; j < symmetry; j++) {
      const idx = ((xCenter - i) + symmetry * j) * 4
      const midx = ((xCenter + i) + symmetry * j) * 4
      let r = data[idx]
      let g = data[idx + 1]
      let b = data[idx + 2]
      let gray = (0.5 * r + 1.1 * g + 0.4 * b) / 2
      if (gray < 128) {
        gray = 0
      } else {
        gray = 255
      }
      data[idx] = gray
      data[idx + 1] = gray
      data[idx + 2] = gray
      data[midx] = 255 - gray
      data[midx + 1] = 255 - gray
      data[midx + 2] = 255 - gray
    }
  }
  ctx.putImageData(img, 0, 0)
}

// wire up sliders and buttons

document.getElementById("loadButton").addEventListener("click", load)
document.getElementById("randButton").addEventListener("click", randomDraw)
document.getElementById("autofill").addEventListener("click", autofill)
document.getElementById("notan").addEventListener("click", notanfun)

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

