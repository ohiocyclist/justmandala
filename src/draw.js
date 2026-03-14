import { getMandalaHelpers } from './getlocalcoordinates'

// as inspired by numpy and code ported from Python
const linspace = (start, end, num) => {
    const step = (end - start) / (num)
    return Array.from({ length: num }, (_, i) => start + i * step)
}

// draw the thin gray lines that make the grid
export function drawGrid(ctxRef, width, slider1) {
  let getGrid = true
  let nosym = true
  let lineWidth = 1
  let gridLines = getMandalaHelpers.getSymmetryPoints(0, 0, width, slider1, true, getGrid)
  for (let i = 0; i < gridLines.length; i++) {
    // (gridLines[i][0] - width / 2) / 100 leaves a small open area at the center for better visibility
    drawLine(width / 2 + (gridLines[i][0] - width / 2) / 100, width / 2 + (gridLines[i][1] - width / 2) / 100, gridLines[i][0], gridLines[i][1], ctxRef, width, slider1, lineWidth, 'gray', nosym)
  }
}

export function drawLine(x1, y1, x2, y2, ctxRef, width, slider1, slider2, color, nosym=false, extraMirror=true) {

    // draw a line from x1, y1 to x2, y2 and all symmetrical points radial and mirror (unless nosym is true) (and extraMirror false turns of the mirror symmetry)

    let startPoints = getMandalaHelpers.getSymmetryPoints(x1, y1, width, slider1, extraMirror)
    let endPoints = getMandalaHelpers.getSymmetryPoints(x2, y2, width, slider1, extraMirror)

    // testing only, only draw one side
    if (nosym) {
      startPoints = [[x1, y1]]
      endPoints = [[x2, y2]]
    }

    let ctx = ctxRef.current
    for (var i = 0; i < startPoints.length; i++) {
      ctx.beginPath()
      ctx.imageSmoothingEnabled = false
      ctx.lineWidth = Number(slider2)
      ctx.strokeStyle = color
      ctx.lineCap = "round"
      ctx.moveTo(Math.floor(startPoints[i][0]), Math.floor(startPoints[i][1]))
      ctx.lineTo(Math.floor(endPoints[i][0]), Math.floor(endPoints[i][1]))
      ctx.stroke()
    }

    ctx.stroke();
  }

export function draw(e, chartRef, ctxRef, width, slider1, slider2, color, prevXY) {
    // turn user inputs into lines on the page
    var coord = getMandalaHelpers.getLocalCoordinates(e, chartRef);
    // console.log(" getLocalCoordinates[0] " + coord[0]);

    var x = coord[0]
    var y = coord[1]

    let ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = Number(slider2)

    if (e.buttons == 1) {
      // continue a mouse move
      drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
    } else if (e.type == "click" || e.type == "touchstart") {
      // this is the start of a line series so we reset previous here
      prevXY[0] = x
      prevXY[1] = y
      drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
    } else if (e.type == "touchmove" || e.type.includes("touch")) {
      // continue a touch move
      drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
    }
    // connect the next segment to the current one
    prevXY[0] = x
    prevXY[1] = y
  }

function drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter) {
  // do all the shifting to the center here for the kite style random mandala
  // kite style random mandala does not use extraMirror but uses radial symmetry
  let extraMirror = false
  let nosym = false
  drawLine(xCenter - curx, xCenter - cury, xCenter - endx, xCenter - endy, ctxRef, width, slider1, slider2, color, nosym, extraMirror)
}

export function randomDraw(width, slider1, slider2, ctxRef, color) {
    let ctx = ctxRef.current
    let xCenter = width / 2
    let holdColor = color
    // the user can draw the outline in any color they like but autodraw is black
    color = 'black'
    if (ctx) {
      // six styles of random mandala
      let randNum = Math.random()
      if (randNum < 0.2) {
        // kite style, first worked out in Jupyter Notebook.  Original did not have access to the symmetry function so it has its own unused symmetry built in.
        ctx.strokeStyle = color
        let endx = 0
        let endy = 0
        // magic numbers to taste
        let scalefactor = 1.35
        let allshrink = 0.6      
        // want at least four layers and up to ten  
        let levels = Math.floor(Math.random() * 7) + 4
        // turn on secondary inner drawing half the time
        let inners = Math.random() > 0.5
        const mystride = 24
        const starPoints = linspace(0, 2 * Math.PI, slider1 * mystride)
        // roughly fill the canvas
        const starScaleUp = Math.floor(xCenter * 6 / (Math.pow(levels, 2)))
        const star_x = starPoints.map(x => starScaleUp * Math.cos(x))
        const star_y = starPoints.map(x => starScaleUp * Math.sin(x))
        // we draw a bunch of points around a circle and then we select some to connect to
        let ap = star_x.map((x, i) => ({x: x, y: star_y[i]}))
        let myxy = ap.filter((_, i) => i % mystride === 0)       
        let mymxy = ap.filter((_, i) => i % mystride === mystride / 2).map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length])       
        let mypxy = ap.filter((_, i) => i % mystride === 0).map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length])
        let myfxy = ap.filter((_, i) => i % mystride === mystride / 2)
        let mysifxy = ap.filter((_, i) => i % mystride === (5 * mystride) / 6).map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length])  
        let myxfxy = ap.filter((_, i) => i % mystride === mystride / 6).map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length])   
        let myspxy = ap.filter((_, i) => i % mystride === mystride / 3)                                                                 
        let mysfxy = ap.filter((_, i) => i % mystride === (2 * mystride) / 3).map((_, i, arr) => arr[(i - 1 + arr.length) % arr.length])
        let curx = 0
        let cury = 0
        let myrad = 1
        let tapLevel = 0
        for (let level = 0; level < levels; level++) {
          // more control parameters to taste
          let scaleup = level === 0 ? 0 : level === levels - 1 ? 1.05 : scalefactor
          scaleup = scaleup * (level === 0 ? allshrink : 1) * (level === 1 ? 1/allshrink : 1)
          let larr = Math.pow(scalefactor, level)
          larr = larr * (level < 2 ? allshrink : 1)
          let prevlar = level > 0 ? Math.pow(scalefactor, level - 1) : scalefactor
          prevlar = prevlar * (level < 3 ? allshrink : 1)
          // the last level is flattened compared to the rest
          let discount = level === levels - 1 ? 0.9 : 0.8
          let tdiscount = level === levels - 1 ? 0.965 : 0.9
          let xdiscount = level === levels - 1 ? 0.9 : 1
          let zarr = larr * xdiscount        
          // which points on the circle to connect to alternates even/odd
          if (level % 2 == 0) {
            // these are the Python control functions to translate into Javascript
            // fxy(rowx, rowy, level, (x) => ( [x[0] * larr, x[1] * myrad * prevlar, x[2] * larr, x[1] * larr * scaleup]), mypxy, mymxy, myxy)
            curx = mypxy[tapLevel].x * larr
            cury = mypxy[tapLevel].y * larr
            if (level > 0) {
              endx = mymxy[tapLevel].x * larr * scaleup
              endy = mymxy[tapLevel].y * larr * scaleup
            }
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            endx = mymxy[tapLevel].x * myrad * prevlar
            endy = mymxy[tapLevel].y * myrad * prevlar
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            curx = myxy[tapLevel].x * larr
            cury = myxy[tapLevel].y * larr
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            endx = mymxy[tapLevel].x * larr * scaleup
            endy = mymxy[tapLevel].y * larr * scaleup
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            // fxy(rowix, rowiy, level, (x) => ( [x[0] * zarr, x[1] * myrad * prevlar / discount, x[2] * zarr, x[1] * larr * scaleup * tdiscount]), myxfxy, mymxy, mysifxy)
            if (inners) {
              curx = myxfxy[tapLevel].x * zarr
              cury = myxfxy[tapLevel].y * zarr
              endx = mymxy[tapLevel].x * larr * scaleup * tdiscount
              endy = mymxy[tapLevel].y * larr * scaleup * tdiscount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              endx = mymxy[tapLevel].x * myrad * prevlar / discount
              endy = mymxy[tapLevel].y * myrad * prevlar / discount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              curx = mysifxy[tapLevel].x * zarr
              cury = mysifxy[tapLevel].y * zarr
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              endx = mymxy[tapLevel].x * larr * scaleup * tdiscount
              endy = mymxy[tapLevel].y * larr * scaleup * tdiscount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            }
          } else {
            // fxy(rowx, rowy, level, (x) => ( [x[0] * prevlar, x[1] * larr, x[0] * larr * scaleup, x[2] * larr]), myxy, mymxy, myfxy)
            // first line needs both endpoints, and the other endpoint is the end of the last point
            curx = myxy[tapLevel].x * prevlar
            cury = myxy[tapLevel].y * prevlar
            endx = myfxy[tapLevel].x * larr
            endy = myfxy[tapLevel].y * larr
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            endx = mymxy[tapLevel].x * larr
            endy = mymxy[tapLevel].y * larr
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            curx = myxy[tapLevel].x * larr * scaleup
            cury = myxy[tapLevel].y * larr * scaleup
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            endx = myfxy[tapLevel].x * larr
            endy = myfxy[tapLevel].y * larr
            drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            // fxy(rowix, rowiy, level, (x) => ( [x[0] * zarr, x[1] * myrad * prevlar / discount, x[2] * zarr, x[1] * larr * scaleup * tdiscount]), myspxy, myxy, mysfxy)
            if (inners) {
              curx = myspxy[tapLevel].x * zarr
              cury = myspxy[tapLevel].y * zarr
              endx = myxy[tapLevel].x * larr * scaleup * tdiscount
              endy = myxy[tapLevel].y * larr * scaleup * tdiscount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              endx = myxy[tapLevel].x * myrad * prevlar / discount
              endy = myxy[tapLevel].y * myrad * prevlar / discount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              curx = mysfxy[tapLevel].x * zarr
              cury = mysfxy[tapLevel].y * zarr
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
              endx = myxy[tapLevel].x * larr * scaleup * tdiscount
              endy = myxy[tapLevel].y * larr * scaleup * tdiscount
              drawLineShift(curx, cury, endx, endy, ctxRef, width, slider1, slider2, color, xCenter)
            }
          }
        }
      } else if (randNum < 0.3) {
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
          let step = (i + 1) * 30 + (i + 1) * 10 * Math.random()
          let startx = 0
          let starty = 0
          // keep turning 90 degrees
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
            drawLine(curx, cury, curendx, curendy, ctxRef, width, slider1, slider2, color)
            curx = curendx
            cury = curendy
          }
          endx = startx
          endy = starty
        }
      } else if (randNum < 0.4) {
        // straight pattern
        ctx.strokeStyle = color
        let maxi = 10
        for (let i = 0; i < maxi; i++) {
          // overlap with the line above
          let splayfactor = 2
          // the last one doesn't have a line above to overlap with
          if (i === maxi - 1) splayfactor = 1
          let stepfraction = 15
          let startx = xCenter - (i + splayfactor) * (xCenter / stepfraction)
          let endx = xCenter + (i + splayfactor) * (xCenter / stepfraction)
          let yloc = xCenter - (i + 1) * (xCenter / stepfraction)
          drawLine(startx, yloc, endx, yloc, ctxRef, width, slider1, slider2, color)
        }
      } else if (randNum < 0.6) {
        // just a bunch of straight lines style
        ctx.strokeStyle = color
        let offset = 40 * Math.random()
        drawLine(offset, xCenter - offset, xCenter, xCenter - offset, ctxRef, width, slider1, slider2, color)
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
          drawLine(startx, starty, startx + offset, Math.abs(width - starty), ctxRef, width, slider1, slider2, color)
        }
      } else if (randNum < 0.8) {
        // interlocking crossing lines style
        let workfactor = 12
        let ifactor = 2
        let startx = 0
        let starty = 0
        for(let i = 0; i < workfactor - 3; i++) {
          ctx.strokeStyle = color
          // draw in the center to start, then push towards the edges
          let useifactor = 0
          let endx = 0
          let endy = 0
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
          if (endy > width - edgekeep) {
            endy = width - edgekeep
          }
          drawLine(startx, starty, endx, endy, ctxRef, width, slider1, slider2, color)
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
          let wideFactor = (xCenter - yLocn) * 2 * Math.PI / Number(slider1) * 1.5
          xLocn = xLocn - wideFactor * stepSize / 2 + wideFactor * stepSize * Math.random()
          // make a bunch of consective random small steps and then a step that can be randomly big
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
          drawLine(currentStart[0], currentStart[1], xLocn, yLocn, ctxRef, width, slider1, slider2, color)
          currentStart = [xLocn, yLocn]
        }
      }
    }
    color = holdColor
  }
