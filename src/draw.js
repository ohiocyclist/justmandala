import { getMandalaHelpers } from './getlocalcoordinates'

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

export function draw(e, chartRef, ctxRef, width, slider1, slider2, color, prevXY, isZoomRef, zoomCanvasRef, canvasRef, quxRef, quyRef) {
    // turn user inputs into lines on the page
    var coord = getMandalaHelpers.getLocalCoordinates(e, chartRef);
    // console.log(" getLocalCoordinates[0] " + coord[0]);

    var x = coord[0]
    var y = coord[1]

    let ctx = ctxRef.current
    if (ctx) {
      ctx.strokeStyle = color
      ctx.lineWidth = Number(slider2)

      let anyDraw = false
      if (e.buttons == 1) {
        // continue a mouse move
        drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
        anyDraw = true
      } else if (e.type == "click" || e.type == "touchstart") {
        // this is the start of a line series so we reset previous here
        prevXY[0] = x
        prevXY[1] = y
        drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
        anyDraw = true
      } else if (e.type == "touchmove" || e.type.includes("touch")) {
        // continue a touch move
        drawLine(prevXY[0], prevXY[1], x, y, ctxRef, width, slider1, slider2, color)
        anyDraw = true
      }
      // connect the next segment to the current one
      prevXY[0] = x
      prevXY[1] = y
      if (anyDraw && isZoomRef.current) {
        let ctx = zoomCanvasRef.current.getContext("2d")
        const hawidth = Math.floor(width / 2)
        ctx.drawImage(
            canvasRef.current, 
            0, 0, width, width,
            quxRef.current, quyRef.current, hawidth, hawidth
        )
      }
    }
  }
