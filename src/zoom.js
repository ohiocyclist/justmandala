import { getMandalaHelpers } from "./getlocalcoordinates"
import { createGrid } from "./creategrid"
import fill from './fill'

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

export function fillWrap(e, chartRef, ctxRef, color, width, slider1, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef) {
  var coord = getMandalaHelpers.getLocalCoordinates(e, chartRef)
  let x = coord[0]
  let y = coord[1]
  let ctx = ctxRef.current
  if (isZoomRef.current) {
    x = Math.round(x / 2) + quxRef.current
    y = Math.round(y / 2) + quyRef.current
    ctx = zoomCanvasRef.current.getContext("2d")
  }

  fill(e, x, y, ctx, color, width, slider1, radioValue)

  // if we're zoomed in, copy back to the background tracking canvas
  if (isZoomRef.current) {
    // let ctx = zoomCanvasRef.current.getContext("2d")
    const hawidth = Math.floor(width / 2)
    ctxRef.current.drawImage(
        zoomCanvasRef.current, 
        quxRef.current, quyRef.current, hawidth, hawidth,
        0, 0, width, width
    )
  }
}