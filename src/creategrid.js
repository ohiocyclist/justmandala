import { drawGrid } from "./draw"
import * as d3 from "d3"

export function createGrid(chartRef, points, width, isZoomRef, quxRef, quyRef) {
  // allow resetting the grid when changing the symmetry slider to reflect the new symmetry
  // place a canvas atop the other canvas so we can deal independently with the grid and not save it  
  d3.select(chartRef.current).select("#gridcanvas").remove()        
  let topcanvas = document.createElement('canvas')
  topcanvas.id = "gridcanvas"
  topcanvas.width = width
  topcanvas.height = width
  topcanvas.style.position = 'absolute'
  topcanvas.style.top = '0'
  topcanvas.style.left = '0'
  topcanvas.style.zIndex = '10'
  topcanvas.style.pointerEvents = 'none'

  chartRef.current.appendChild(topcanvas)
  let topCtx = topcanvas.getContext("2d")
  // react doesn't keep up with the slider1 value for here, we need to keep up for ourselves
  drawGrid(topCtx, width, points, isZoomRef, quxRef, quyRef)
}
