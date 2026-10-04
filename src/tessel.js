//import * as d3 from "d3"
import { downloadMandala } from './downloadmandala'

export function setTesselCanvasProperties(tesselCanvas, hideRef, canvasName, zIndex, width) {
  tesselCanvas.id = canvasName
  tesselCanvas.width = Math.floor(width / 2)
  tesselCanvas.height = Math.floor(width / 2)
  tesselCanvas.style.position = 'absolute'
  tesselCanvas.style.top = '0'
  tesselCanvas.style.left = '0'
  tesselCanvas.style.zIndex = zIndex
  tesselCanvas.style.pointerEvents = 'none'    

  hideRef.current.appendChild(tesselCanvas)
}

export function findTesselTransparency(ctx, tesselCanvas, width, trace) {
  let imgData = ctx.getImageData(0, 0, width, width)
  let data = imgData.data

  // get the color to alpha from the edge pixel
  // sweep for the start point
  let sweep = Math.floor(width * 0.05) - 1
  // small data sets
  if (sweep < 1) {
    sweep = 1
  }
  let sawsweep = false
  let hd = sweep
  for (let i = sweep; i <= hd * 3; i++) {
    let locn = i * 4 + i * 4 * tesselCanvas.width
    trace.trace.push(locn)
    // console.log(`${sawsweep} ${sweep} ${i} ${trace.trace[trace.trace.length - 1]} ${data[locn]} ${data[locn + 1]} ${data[locn + 2]}`)
    if (data[locn] > 0 && (data[locn] < 255 || data[locn + 1] < 255 || data[locn + 2] < 255)) {
      if (!sawsweep) {
        sweep = i      
        sawsweep = true
      }
    }
  }
  // check of where we are pulling from
  //ctx.putImageData(imgData, 0, 0)
  // console.log(sweep)
  let pullpoint = sweep * 4 + sweep * 4 * tesselCanvas.width
  //console.log(pullpoint, data[pullpoint])
  let referenceColors = []
  if (!data[pullpoint]) { // undefined / the data is not that big
    referenceColors = [255, 255, 255]
  } else {
    referenceColors.push(data[pullpoint])
    referenceColors.push(data[pullpoint + 1])
    referenceColors.push(data[pullpoint + 2])
  }
  // black is actually white
  if (referenceColors[0] === 0 && referenceColors[1] === 0 && referenceColors[2] === 0) {
    //console.log('all black')
    referenceColors[0] = 255
    referenceColors[1] = 255
    referenceColors[2] = 255
  }
  //console.log(referenceColors)
  // set everything of that color to transparent
  const colorWiggle = 4
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r < referenceColors[0] + colorWiggle && g < referenceColors[1] + colorWiggle && b < referenceColors[2] + colorWiggle && 
        r > referenceColors[0] - colorWiggle && g > referenceColors[1] - colorWiggle && b > referenceColors[2] - colorWiggle) {
      // this is the alpha channel
      data[i + 3] = 0
    }

  }    
  ctx.putImageData(imgData, 0, 0)

  return referenceColors

}

export function copyRegions(sourceCanvas, destContext, width) {
  // copy the regions over to tesselate
  const sw = Math.round(width / 4)
  const sx = [0, 0, sw, sw]
  const sy = [0, sw, 0, sw]

  const dx = [sw, sw, 0, 0]
  const dy = [sw, 0, sw, 0]

  for (let i = 3; i >= 0; i--) {
    destContext.drawImage(
      sourceCanvas, 
      sx[i], sy[i], sw, sw,
      dx[i], dy[i], sw, sw
    )
  }

  destContext.drawImage(
      sourceCanvas, 
      0, 0, Math.floor(width / 2), Math.floor(width / 2),
      0, 0, Math.floor(width / 2), Math.floor(width / 2)
    )

}

export function tesselDeTransparency(shrinkctx, referenceColors, width, trace) {
  let imgData = shrinkctx.getImageData(0, 0, Math.floor(width / 2), Math.floor(width / 2))
  let data = imgData.data
  for (let i = 0; i < data.length; i += 4) {
    // assign native transparent (i.e. not written to) areas the reference color
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 0) {
      data[i] = referenceColors[0]
      data[i + 1] = referenceColors[1]
      data[i + 2] = referenceColors[2]
    }
    // no transparent areas
    data[i + 3] = 255
  }

  // debug: see how the sweep is sweeping across the canvas
  const runtrace = false
  if (runtrace) {
    for(let i = 0; i < trace.trace.length; i++) {
      //console.log(`${data.length} ${trace.trace[i]}`)
      data[trace.trace[i]] = 0
      data[trace.trace[i + 1]] = 255
      data[trace.trace[i + 2]] = 255
      data[trace.trace[i + 3]] = 255
      // and the next pixel
      data[trace.trace[i + 4]] = 0
      data[trace.trace[i + 5]] = 255
      data[trace.trace[i + 6]] = 255
      data[trace.trace[i + 7]] = 255
      data[trace.trace[i - 1]] = 255
      data[trace.trace[i - 2]] = 255
      data[trace.trace[i - 3]] = 255
      data[trace.trace[i - 4]] = 0

    }
  }

  shrinkctx.putImageData(imgData, 0, 0)
}

export function initializeTesselCanvas(d3, ctx, width) {
  // guarantee zero initialization
  let imgData = ctx.getImageData(0, 0, width, width)
  let data = imgData.data
  for (let i = 0; i < data.length; i++) {
    data[i] = 0
  }
  ctx.putImageData(imgData, 0, 0)

  // copy just the upper left corner behind everything
  ctx.drawImage(
      d3.select("#drawcanvas").node(), 
      0, 0, 10, 10,
      0, 0, Math.floor(width * 0.5), Math.floor(width * 0.5)
    )

  // copy and shrink the original image
  ctx.drawImage(
      d3.select("#drawcanvas").node(), 
      0, 0, width, width,
      Math.floor(width * 0.05), Math.floor(width * 0.05), Math.floor(width * 0.4), Math.floor(width * 0.4)
    )
}

export function createTessel(d3, hideRef, shrinkRef, width) {
  // clear the old tesselation
  d3.select(hideRef.current).selectAll("canvas").remove()
  // initialize two hidden canvases, one for the original image (shrunken) and one for the four corners
  let shrinkCanvas = document.createElement('canvas')
  setTesselCanvasProperties(shrinkCanvas, hideRef, "shrinkcanvas", '2', width)
  shrinkRef.current = shrinkCanvas

  let tesselCanvas = document.createElement('canvas')
  setTesselCanvasProperties(tesselCanvas, hideRef, "tesselcanvas", '1', width)
  
  const sourceCanvas = d3.select('#tesselcanvas').node()
  const destContext = shrinkCanvas.getContext("2d")

  const ctx = sourceCanvas.getContext("2d")

  initializeTesselCanvas(d3, ctx, width)

  const trace = {'trace': []}
  const referenceColors = findTesselTransparency(ctx, tesselCanvas, width, trace)

  copyRegions(sourceCanvas, destContext, width)

  // de-transparency the regions that are not filled in by the corner images
  const shrinkctx = d3.select('#shrinkcanvas').node().getContext("2d")
  tesselDeTransparency(shrinkctx, referenceColors, width, trace)

  downloadMandala(shrinkRef)
}