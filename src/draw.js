import { getLocalCoordinates, getSymmetryPoints } from './getlocalcoordinates'

export function drawLine(x1, y1, x2, y2, ctxRef, width, slider1, slider2, color) {
    let startPoints = getSymmetryPoints(x1, y1, width, slider1)
    let endPoints = getSymmetryPoints(x2, y2, width, slider1)

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
    var coord = getLocalCoordinates(e, chartRef);
    // console.log(" getLocalCoordinates[0] " + coord[0]);

    var x = coord[0];
    var y = coord[1];

    // (2 * Math.PI) / 16

    let ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = Number(slider2)

    if (e.buttons == 1) {
      drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
    } else if (e.type == "click") {
      prevXY[0] = x
      prevXY[1] = y
      drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
    }
    prevXY[0] = x
    prevXY[1] = y
  }

export function randomDraw(width, slider1, slider2, ctxRef, color) {
    let ctx = ctxRef.current
    let xCenter = width / 2
    let holdColor = color
    // the user can draw the outline in any color they like but autodraw is black
    color = 'black'
    if (ctx) {
      // four styles of random mandala
      let randNum = Math.random()
      if (randNum < 0.2) {
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
      } else if (Math.random() < 0.2) {
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
      } else if (Math.random() < 0.5) {
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
