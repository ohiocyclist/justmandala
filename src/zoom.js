import { getMandalaHelpers } from "./getlocalcoordinates"
import { createGrid } from "./creategrid"
import fill from './fill'
import { draw } from './draw'
import { randomDraw } from './randomdraw'
import {autoFill} from './autoFill'

export function zoom(event, isZoomRef, canvasRef, chartRef, zoomCanvasRef, width, quxRef, quyRef, symmetrySlider) {
  if (event.type == "touchmove" || event.type == "click") {
    var coord = getMandalaHelpers.getLocalCoordinates(event, chartRef)
    if (isZoomRef.current) {
        quxRef.current = 0
        quyRef.current = 0
        isZoomRef.current = false
        // copy back from the backup canvas
        let ctx = canvasRef.current.getContext("2d")
        ctx.drawImage(
            zoomCanvasRef.current,
            0, 0, width, width,
            0, 0, width, width
        )
        createGrid(chartRef, symmetrySlider, width, isZoomRef, quxRef, quyRef)
    } else {
        isZoomRef.current = true
        // copy to the backup canvas and zoom the main canvas
        let ctx = zoomCanvasRef.current.getContext("2d")
        ctx.drawImage(
            canvasRef.current, 
            0, 0, width, width,
            0, 0, width, width
        )
        const hawidth = Math.floor(width / 2)
        let xmin = coord[0] - Math.round(hawidth / 2)
        if (xmin < 0) xmin = 0
        if (xmin > hawidth) xmin = hawidth
        let ymin = coord[1] - Math.round(hawidth / 2)
        if (ymin < 0) ymin = 0
        if (ymin > hawidth) ymin = hawidth
        quxRef.current = xmin
        quyRef.current = ymin
        ctx = canvasRef.current.getContext("2d")
        ctx.drawImage(
            zoomCanvasRef.current,
            quxRef.current, quyRef.current, hawidth, hawidth,
            0, 0, width, width
        )
        createGrid(chartRef, symmetrySlider, width, isZoomRef, quxRef, quyRef)
    }
  }
}

function anyWrap(e, chartRef, ctxRef, color, width, slider1, slider2, slider3, myPalette, prevXY, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef, runfun, style) {
  let coord = [0,0]
  if (style != 'autofill' && style != 'randomdraw') {
    coord = getMandalaHelpers.getLocalCoordinates(e, chartRef)
  } 
  let x = coord[0]
  let y = coord[1]
  let ctx = ctxRef.current
  if (isZoomRef.current) {
    x = Math.round(x / 2) + quxRef.current
    y = Math.round(y / 2) + quyRef.current
    ctx = zoomCanvasRef.current.getContext("2d")
  }

  let anygo = false
  if (style === 'fill') {
    anygo = runfun(e, x, y, ctx, color, width, slider1, radioValue)
  } else if (style === 'autofill') {
    runfun(ctx, width, myPalette, slider1, slider3, radioValue)
    anygo = true
  } else if (style === 'randomdraw') {
    runfun(width, slider1, slider2, ctx, color)
    anygo = true
  } else {
    anygo = runfun(e, x, y, ctx, width, slider1, slider2, color, prevXY)
  }

  // if we're zoomed in, copy back to the background tracking canvas
  if (anygo && isZoomRef.current) {
    // let ctx = zoomCanvasRef.current.getContext("2d")
    const hawidth = Math.floor(width / 2)
    ctxRef.current.drawImage(
        zoomCanvasRef.current, 
        quxRef.current, quyRef.current, hawidth, hawidth,
        0, 0, width, width
    )
  }
} 

export function fillWrap(e, chartRef, ctxRef, color, width, slider1, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef) {
  // these are stub out for fill
  let slider2 = 5
  let slider3 = 5
  let myPalette = 5
  let prevXY = [0, 0]
  anyWrap(e, chartRef, ctxRef, color, width, slider1, slider2, slider3, myPalette, prevXY, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef, fill, "fill")
}

export function drawWrap(e, chartRef, ctxRef, width, slider1, slider2, color, prevXY, isZoomRef, zoomCanvasRef, quxRef, quyRef) {
  // these are stub out for draw
  let radioValue = 5
  let slider3 = 5
  let myPalette = 5
  anyWrap(e, chartRef, ctxRef, color, width, slider1, slider2, slider3, myPalette, prevXY, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef, draw, "draw")
}

export function autoFillWrap(ctxRef, width, myPalette, slider1, slider3, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef) {
  // stub out for autofill
  let slider2 = 5
  let prevXY = [0, 0]
  let e = {}
  let chartRef = ctxRef
  let color = 0
  anyWrap(e, chartRef, ctxRef, color, width, slider1, slider2, slider3, myPalette, prevXY, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef, autoFill.autoFill, "autofill")
}

export function randomDrawWrap(width, slider1, slider2, ctxRef, color, isZoomRef, zoomCanvasRef, quxRef, quyRef) {
  // stub out
  let e = {}
  let chartRef = ctxRef
  let slider3 = 3
  let myPalette = 3
  let prevXY = [0,0]
  let radioValue = 5
  anyWrap(e, chartRef, ctxRef, color, width, slider1, slider2, slider3, myPalette, prevXY, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef, randomDraw, "randomdraw")
}
