"use strict";

let canvas = []
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    canvas.push(document.getElementById("drawCanvas".concat(JSON.stringify(i)).concat(JSON.stringify(j))))
  }
} 

let dotess = 0  // tessellation style
let dograd = 0  // gradient style
const notan = false
const fillablesStyle = 1
let getcanvas, ctx, prevX, prevY
let symmetry = canvas.width
let xCenter = symmetry / 2
let slider = document.getElementById("mySlider")
let sliderValueDisplay = document.getElementById("sliderValue")
let slider2 = document.getElementById("mySlider2")
let sliderValueDisplay2 = document.getElementById("sliderValue2")
let color = "#000000"
let drawOrFill = 'draw'
let fillOrOther = 'every'
let fillOrOtherDisplay = document.getElementById("fillOrOther")
let curclicked = "black"
const hexcanvas = document.getElementById("picker")
const hexctx = hexcanvas.getContext("2d")

const hexCenterX = hexcanvas.width / 2
const radius = 220
let luminance = document.getElementById("luminance")
let hexx = hexCenterX
let hexy = hexCenterX
const hexwidth = 600 // must match html
let flexref = ''

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
  if (colorlist[i][0] === 'flex') {
    flexref = button
  }
  button.id = colorlist[i][0]
  button.style.backgroundColor = colorlist[i][1]
  if (colorlist[i][0] === 'eraser') {
    button.style.color = 'black'
    button.innerText = colorlist[i][0]
  } else {
    button.style.color = colorlist[i][1]
    button.innerText = colorlist[i][0].slice(0, 4)
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

/**
 * To reset the canvas, simply run the load function
 * document.getElementById("reset").addEventListener("click", load);
 */

function load() {
  /**
   * On your DOM, your Canvas ID must be drawCanvas
   */
  ctx = []
  for (let i = 0; i < canvas.length; i++) {

    ctx.push(canvas[i].getContext("2d"))
    ctx[i].fillStyle = 'white'
    ctx[i].fillRect(0, 0, symmetry, symmetry);

    ctx[i].strokeStyle = "rgba(0,0,0,0.2)";
    ctx[i].lineWidth = 0.5;
    // Guides lines

    let lastDistance = 0
    let scale = 1
    let isPinching = false

    // fill areas with a click without moving the mouse, draw on movement
    canvas[i].addEventListener("mousedown", (event) => evoselect(event, i))
    canvas[i].addEventListener("touchstart", (event) => evoselect(event, i))
  }
}

function evoselect(event, i) {
  console.log(i)
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

// Draw color picker
// not a hexagon right now
function pointInHexagon(x, y) {
    const dx = Math.abs(x - hexCenterX)
    const dy = Math.abs(y - hexCenterX)

    return dy <= radius * Math.sqrt(3) / 2 &&
           Math.sqrt(3) * dx + dy <= Math.sqrt(3) * radius
}

// HSV -> RGB
function hsvToRgb(h, s, v) {
    if (s > 1) s /= 100
    if (v > 1) v /= 100
    let c = v * s
    let x = c * (1 - Math.abs((h / 60) % 2 - 1))
    let m = v - c

    let r, g, b

    if (h < 60)      [r,g,b] = [c,x,0]
    else if (h < 120)[r,g,b] = [x,c,0]
    else if (h < 180)[r,g,b] = [0,c,x]
    else if (h < 240)[r,g,b] = [0,x,c]
    else if (h < 300)[r,g,b] = [x,0,c]
    else             [r,g,b] = [c,0,x]

    return {
        r: Math.round((r+m)*255),
        g: Math.round((g+m)*255),
        b: Math.round((b+m)*255)
    }
}

function rgbToHsv(r, g, b) {
    // 1. Normalize RGB values to the range 0-1
    r /= 255
    g /= 255
    b /= 255

    // 2. Find the maximum and minimum values to determine Chroma
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    let s = 0
    const v = max

    // 3. Calculate Saturation
    if (max !== 0) {
        s = delta / max
    }

    // 4. Calculate Hue
    if (delta !== 0) {
        switch (max) {
            case r:
                h = (g - b) / delta + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / delta + 2
                break
            case b:
                h = (r - g) / delta + 4
                break
        }
        h /= 6 // Convert to a fraction between 0 and 1
    }

    // 5. Scale to standard degrees and percentages
    return {
        h: Math.round(h * 360),    // 0° to 360°
        s: Math.round(s * 100),    // 0% to 100%
        v: Math.round(v * 100)     // 0% to 100%
    };
}


// Render color wheel clipped to hexagon
function drawHexPicker(inpx, inpy) {
    const image = hexctx.createImageData(hexcanvas.width, hexcanvas.height)
    const data = image.data

    for (let y = 0; y < hexcanvas.height; y++) {
        for (let x = 0; x < hexcanvas.width; x++) {

            const idx = (y * hexcanvas.width + x) * 4

            // not currently a hexagon
            if (false && !pointInHexagon(x, y)) {
                data[idx+3] = 0
                continue
            }

            const dx = x - hexCenterX
            const dy = y - hexCenterX

            const distance = Math.sqrt(dx*dx + dy*dy)
            const saturation = Math.min(2 * distance / ( 1 * radius), 1)

            let hue = Math.atan2(dy, dx) * 180 / Math.PI
            if (hue < 0) hue += 360
      	    //let luminance = 1 - Math.min(distance / ( 2.5 * radius), 1)
            const rgb = hsvToRgb(hue, saturation, luminance.value / 255)

            data[idx]   = rgb.r
            data[idx+1] = rgb.g
            data[idx+2] = rgb.b
            data[idx+3] = 255
        }
    }
    // draw a target point
    let targcolor = 0
    if (luminance.value < 100) targcolor = 255
    for (let x = Math.max(0, inpx - 5); x < Math.min(hexwidth, inpx + 5); x++) {
      if (x === inpx) continue
      const idx = (x + inpy * hexwidth) * 4
      data[idx]     = targcolor
      data[idx + 1] = targcolor
      data[idx + 2] = targcolor
    }
    for (let y = Math.max(0, inpy - 5); y < Math.min(hexwidth, inpy + 5); y++) {
      if (y === inpy) continue
      const idx = (inpx + y * hexwidth) * 4
      data[idx]     = targcolor
      data[idx + 1] = targcolor
      data[idx + 2] = targcolor
    }

    hexctx.putImageData(image, 0, 0)

}

drawHexPicker(hexx, hexy)

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

    // expand shorthand #fff -> #ffffff
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

function fillDataWrite(allcoords, alllength, data, usecolor) {
  let total = [...allcoords].reduce((acc, curr, index) => {
    if (index % 2 == 0) {
      acc[0] += Number(curr)
    } else {
      acc[1] += Number(curr)
    }
    return acc
  }, [0, 0])
  let x = Math.round(total[0] * 2 / alllength)
  let y = Math.round(total[1] * 2 / alllength)
  let maxdist = 0
  let maxdists = {}
  for (let k = 0; k < alllength; k += 2) {
    let xx = allcoords[k]
    let yy = allcoords[k + 1]
    let thisdist = euclidDistance(x, y, xx, yy)
    if (thisdist > maxdist) {
      maxdist = thisdist
    }
    let angle = Math.round(10 * Math.atan2(xx - x, yy - y))
    if (!maxdists[angle] || maxdists[angle] < thisdist) {
      maxdists[angle] = thisdist
    }
  }     
  for (let k = 0; k < alllength; k += 2) {
    let xx = allcoords[k]
    let yy = allcoords[k + 1]
    let thisdist = euclidDistance(x, y, xx, yy)
    let angle = Math.round(10 * Math.atan2(xx - x, yy - y))
    let basehsv = rgbToHsv(usecolor.r, usecolor.g, usecolor.b)
    if (dograd === 1) {
      basehsv.h = basehsv.h - 60 * thisdist / maxdists[angle]
      //console.log(angle, maxdists[angle])
    } else if (dograd === 2) {
      basehsv.s = 0.8 * ( 1 - thisdist / maxdists[angle]) + 0.2
    } else if (dograd === 3) {
      basehsv.v = 0.8 * ( 1 - thisdist / maxdists[angle]) + 0.2
    }
    if (basehsv.h < 0) basehsv.h += 360
    let tusecolor = hsvToRgb(basehsv.h, basehsv.s, basehsv.v)
    const i = (yy * symmetry + xx) * 4
    data[i]     = tusecolor.r
    data[i + 1] = tusecolor.g
    data[i + 2] = tusecolor.b
    data[i + 3] = 255
  }
}

function fill(e) {
  // fill areas with color 
  let coord = getLocalCoordinates(e)
  if (e.buttons == 1 || e.type == "touchmove") {
    let x = Math.floor(coord[0])
    let y = Math.floor(coord[1])
    let img = ctx.getImageData(0, 0, symmetry, symmetry)
    let data = img.data
    let index = ( x + y * symmetry ) * 4
    // weed out starting black points
    const refr = data[index]
    const refg = data[index + 1]
    const refb = data[index + 2]
    if (refr < 20 && refg < 20 && refb < 20) {
      console.log("hit a black area", refr, refg, refb)
      return
    }
    let [allcoords, alllength] = getAdjacentWhite(data, x, y, symmetry, symmetry, false)
    let symmetricPoints = []
    // help target small areas
    if (alllength < 800 && fillOrOther !== 'one') {
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
        // need to skip out on the mirror images if we're doing other fill
        // and re-engage if we're tessellating
        if (!dotess && idx >= Math.floor(symmetricPoints.length / 2) && fillOrOther === 'other') {idx = idx + 1; continue}
        if (dotess == 1 && ((idx >= Math.floor(symmetricPoints.length / 4) && idx < Math.floor(symmetricPoints.length / 2)) || idx >= Math.floor(symmetricPoints.length * 3 / 4)) && fillOrOther === 'other') {idx = idx + 1; continue}
        if (dotess == 2 && ((idx >= Math.floor(symmetricPoints.length / 8) && idx < Math.floor(symmetricPoints.length / 4)) || (idx >= Math.floor(symmetricPoints.length * 3 / 8) && idx < Math.floor(symmetricPoints.length / 2))
            || (idx >= Math.floor(symmetricPoints.length * 5 / 8) && idx < Math.floor(symmetricPoints.length * 3 / 4)) || (idx >= Math.floor(symmetricPoints.length * 7 / 8)))
          && fillOrOther === 'other') {
            idx = idx + 1
            continue
        }
        idx = idx + 1
        let [allcoords, alllength] = getAdjacentWhite(data, Math.floor(prex), Math.floor(prey), symmetry, symmetry, false)
        //if (idx > 110 || (idx > 96 && idx < 104) || (idx > 64 && idx < 72)) {console.log(idx, allcoords)}
        fillDataWrite(allcoords, alllength, data, usecolor)
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

function colorUpdate(data) {
  document.getElementById("flex").style.backgroundColor = rgbToHex(data[0], data[1], data[2])
  // if we're currently clicked, the color has changed, but the button setup hasn't fired
  if (curclicked === 'flex') {
    color = rgbToHex(data[0], data[1], data[2])
  }
  // update for the autofill
  for (let i = 0; i < colorlist.length; i++) {
    if (colorlist[i][0] === 'flex') {
      colorlist[i][1] = rgbToHex(data[0], data[1], data[2])
      // keep the text hidden
      flexref.style.color = colorlist[i][1]
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
      colorUpdate(data)
  }
}

function getSymmetryPoints(x, y, domirror=true) {
  // The coordinate system has its origin at the center of the canvas,
  // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
  let ctrX = Math.floor(symmetry / 2)
  let ctrY = Math.floor(symmetry / 2)
  if (dotess === 3) {
    if (x < xCenter) {
      ctrX = ctrX * 0.5
      if (y < xCenter) {
        ctrY = ctrY * 0.5
      } else {
        ctrY = ctrY * 1.5
      }
    } else {
      ctrX = ctrX * 1.5
      if (y < xCenter) {
        ctrY = ctrY * 0.5
      } else {
        ctrY = ctrY * 1.5
      }
    }
  }
  let relX = x - ctrX
  let relY = ctrY - y
  let dist = Math.hypot(relX, relY)
  let angle = Math.atan2(relX, relY) // Radians
  let result = []
  let radian = Number(sliderValueDisplay2.textContent)
  // push all the originals, then all the mirrors
  for (let i = 0; i < radian; i++) {
    let theta = angle + ((Math.PI * 2) / radian) * i // Radians
    x = ctrX + Math.sin(theta) * dist
    y = ctrY - Math.cos(theta) * dist
    result.push([Math.round(x), Math.round(y)])
  }
  // this mirrors the points around the spoke of the symmetry
  // hence symmetry === 2 is actually 4 etc.
  // but it allows the user to easily draw closed areas
  if (domirror) {
    for (let i = 0; i < radian; i++) {
      let theta = angle + ((Math.PI * 2) / radian) * i // Radians
      y = ctrY - Math.cos(theta) * dist
      x = ctrX - Math.sin(theta) * dist
      result.push([Math.round(x), Math.round(y)])
    }
  }

  let prelength = result.length
  if (dotess === 1 || dotess === 2) {
    // make the copies in the corners
    const newresults = []
    for (let i = 0; i < result.length; i++) {
      // remap by quadrant
      if (result[i][0] >= xCenter && result[i][1] >= xCenter) {
        newresults.push([result[i][0] - xCenter, result[i][1] - xCenter])
      } else if (result[i][0] >= xCenter && result[i][1] < xCenter) {
        newresults.push([result[i][0] - xCenter, result[i][1] + xCenter])
      } else if (result[i][0] < xCenter && result[i][1] >= xCenter) {
        newresults.push([result[i][0] + xCenter, result[i][1] - xCenter])
      } else if (result[i][0] < xCenter && result[i][1] < xCenter) {
        newresults.push([result[i][0] + xCenter, result[i][1] + xCenter])
      }
    }
    result = [...result, ...newresults]
  } 
  if (dotess === 2) {
    // make the copies above, below, and to the sides
    const newresults = []
    // to make the every-other work right, push one set, then the next
    for (let i = 0; i < prelength; i++) {
      if (result[i][0] < xCenter) {
        newresults.push([result[i][0] + xCenter, result[i][1]])
      } else {
        newresults.push([result[i][0] - xCenter, result[i][1]])
      }
    }
    for (let i = 0; i < prelength; i++) {
      if (result[i][1] < xCenter) {
        newresults.push([result[i][0], result[i][1] + xCenter])
      } else {
        newresults.push([result[i][0], result[i][1] - xCenter])
      }
    }
    result = [...result, ...newresults]
  }
  if (dotess === 3) {
    // need copies at the other quarter points
    const newresults = []
    for (let i = 0; i < prelength; i++) {
      newresults.push([symmetry - result[i][0], result[i][1]])
      newresults.push([result[i][0], symmetry - result[i][1]])
      newresults.push([symmetry - result[i][0], symmetry - result[i][1]])
    }
    result = [...result, ...newresults]
  }

  //console.log(result)
  return result
}

function drawLine(x1, y1, x2, y2, skipcheck=false) {
  // connect a beginning and ending points
  const startPoints = getSymmetryPoints(x1, y1)
  const endPoints = getSymmetryPoints(x2, y2)

  ctx.lineWidth = Number(sliderValueDisplay.textContent)

  ctx.beginPath()
  ctx.lineCap = "round"

  for (var i = 0; i < startPoints.length; i++) {
    // skipcheck:  tessellation draw needs this check against long lines.  Some random draws need to NOT have this check.
    if (skipcheck || euclidDistance(startPoints[i][0], startPoints[i][1], endPoints[i][0], endPoints[i][1]) < (xCenter * 1)) {
      ctx.moveTo(startPoints[i][0], startPoints[i][1])
      ctx.lineTo(endPoints[i][0], endPoints[i][1])
    }
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

function notanfun() {
  const img = ctx.getImageData(0, 0, symmetry, symmetry)
  const data = img.data
  // sweep over all the data
  for (let i = 0; i <= xCenter; i++) {
    for (let j = 0; j < symmetry; j++) {
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
document.getElementById("notan").addEventListener("click", notanfun)

sliderValueDisplay.textContent = 4

slider.addEventListener("input", (event) => {
   	const sliderValue = event.target.value
   	sliderValueDisplay.textContent = sliderValue
})

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

const drawstyleButtons = document.querySelectorAll('input[name="drawstyle"]')

drawstyleButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    const tesselButtonValue = document.querySelector('input[name="drawstyle"]:checked').value
    dotess = 0
    if (tesselButtonValue === 'tessel') {
      dotess = 1
    } else if (tesselButtonValue === 'double') {
      dotess = 2
    } else if (tesselButtonValue === 'recenter') {
      dotess = 3
    }
  })
})

drawstyleButtons[0].checked = true

const gradstyleButtons = document.querySelectorAll('input[name="gradstyle"]')

gradstyleButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    const gradButtonValue = document.querySelector('input[name="gradstyle"]:checked').value
    dograd = 0
    if (gradButtonValue === 'hue') {
      dograd = 1
    } else if (gradButtonValue === 'sat') {
      dograd = 2
    } else if (gradButtonValue === 'lum') {
      dograd = 3
    }
  })
})

gradstyleButtons[0].checked = true

sliderValueDisplay2.textContent = 16

slider2.addEventListener("input", (event) => {
   	const sliderValue2 = event.target.value
   	sliderValueDisplay2.textContent = sliderValue2
})

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("mySlider")
  slider.value = 4   // Force it back to 4
  const slider2 = document.getElementById("mySlider2")
  slider2.value = 16   // Force it back to 16
})

function lumlist(hexx, hexy) {
    drawHexPicker(hexx, hexy)
    const pixel = hexctx.getImageData(hexx, hexy, 1, 1).data
    colorUpdate(pixel)    
}

luminance.addEventListener("input", (event) => {
    lumlist(hexx, hexy)
})

hexcanvas.addEventListener("click", e => {
    const rect = hexcanvas.getBoundingClientRect()

    const hexx = e.clientX - rect.left
    const hexy = e.clientY - rect.top

    if (false && !pointInHexagon(hexx, hexy)) return

    const pixel = hexctx.getImageData(hexx, hexy, 1, 1).data
    colorUpdate(pixel)

    // Selection marker
    drawHexPicker(hexx, hexy)
    luminance.addEventListener("input", (event) => {
        lumlist(hexx, hexy)
    })
})

hexcanvas.addEventListener('mousemove', () => {
  hexcanvas.style.cursor = "url('dropper.png') 6 26, auto"
})

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
