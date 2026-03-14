import { getMandalaHelpers } from './getlocalcoordinates.js'

export class autoFill {
  static getFillableAreas = (width, slider1, bgdata, fillableAreas, radioValue) => {
    // get the fillable areas we want to fill
    // use the symmetry to cut down on calls
    // we want something wide enough to carry one symmetry in all cases
    let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
    // hat tip to testing and other cases where the canvas isn't hundreds of pixels wide and wideFactor can be negative
    if (wideFactor < 5) wideFactor = 5
    for (let prex = 0; prex < wideFactor; prex++) {
      for (let prey = 0; prey < width / 2; prey++) {
        // work outward from the center (for order of color purposes)
        // we skip some pixels for speed; that can miss areas sometimes if they're very small
        let x = 0
        if (prex % 2 === 0) {
          x = Math.abs(width / 2 - prex)
        } else {
          x = width / 2 + prex
        }
        let y = 0 
        if (prey % 2 === 0) {
          y = Math.abs(width / 2 - prey)
        } else {
          y = width / 2 + prey
        }
        // do this in symmetric points order
        // don't revisit seen points
        let symmetricPoints = getMandalaHelpers.getSymmetryPoints(x, y, width, slider1)
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.floor(xx)
          yy = Math.floor(yy)
          const i = (yy * width + xx) * 4
          // only fill white pixel areas
          if (getMandalaHelpers.isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})) {
            let allcoords = getMandalaHelpers.getAdjacentWhite(bgdata, xx, yy, width, width, radioValue)
            if (allcoords.length > 0) {
              let exclusion = false
              for (const [x, y] of allcoords) {
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
                fillableAreas.push(allcoords)
              }
            }
          }
        }
      }
    }        
  }

  static stepThroughFillables = (img2, fillableAreas, palArr, width, slider3) => {
    // fillableAreas is an array of arrays of points that represent areas to fill in
    // in color stepping order (of palArr)
    const data = img2.data
    let palLocn = 0
    for (let i = 0; i < fillableAreas.length; i++) {
      let usecolor = getMandalaHelpers.hexToRgb(palArr[palLocn])
      palLocn = palLocn + 1
      if (palLocn >= palArr.length || palLocn >= slider3) palLocn = 0
      for (let j = 0; j < fillableAreas[i].length; j++) {
        if (!fillableAreas[i][j]) continue
        let x = fillableAreas[i][j][0]
        let y = fillableAreas[i][j][1]
        const k = (y * width + x) * 4
        data[k]     = usecolor.r
        data[k + 1] = usecolor.g
        data[k + 2] = usecolor.b
        data[k + 3] = 255
      }
    }  
  }

  static autoFill = (ctxRef, width, myPalette, slider1, slider3, radioValue) => {
    // first, traverse the entire image and find all the fillable areas
    const fillableAreas = []
    const ctx = ctxRef.current
    const img = ctx.getImageData(0, 0, width, width)
    const bgdata = img.data
    // all this is necessary to turn this into an array of hex sequences
    const palArr = decodeURIComponent(myPalette).replace("[", "").replace("]", "").replaceAll(`"`, "").split(",")
    this.getFillableAreas(width, slider1, bgdata, fillableAreas, radioValue)
    // then step through fillable areas
    const img2 = ctx.getImageData(0, 0, width, width)
    this.stepThroughFillables(img2, fillableAreas, palArr, width, slider3)
    ctx.putImageData(img2, 0, 0)
    //console.log("done")
  }
}