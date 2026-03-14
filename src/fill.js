import { getMandalaHelpers } from './getlocalcoordinates.js'

export default function fill(e, chartRef, ctxRef, color, width, slider1, radioValue) {
    var coord = getMandalaHelpers.getLocalCoordinates(e, chartRef)
    // fill on any condition that isn't simply wiggling the mouse
    if (e.buttons == 1 || e.type.includes("touch") || e.type.includes("click")) {
      var x = Math.floor(coord[0])
      var y = Math.floor(coord[1])
      let symmetricPoints = getMandalaHelpers.getSymmetryPoints(x, y, width, slider1)
      const ctx = ctxRef.current
      const img = ctx.getImageData(0, 0, width, width)
      const data = img.data
      let usecolor = getMandalaHelpers.hexToRgb(color)
      let idx = 0
      for (const [prex, prey] of symmetricPoints) {
        // there tend to be two mirrors in one white zone, necessitating division by 4 to hit every other white zone
        // this is because there are both symmetry copies and mirror copies
        // it actually depends a little bit how the user traces.  Some traces create connected areas, some divided.
        // if there is a divided area, then the fill really will be every 4th instead of every other.
        if (idx % 4 != 0 && radioValue === 'fillHalf') {
          idx = idx + 1
          continue
        }
        idx = idx + 1
        let allcoords = []
        const i = (Math.floor(prey) * width + Math.floor(prex)) * 4
        // fillOne can overfill any color.  The others only overfill white.  White has some wiggle room for off-white.
        if (radioValue === 'fillOne' || getMandalaHelpers.isWhite({r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3]})) {
          allcoords = getMandalaHelpers.getAdjacentWhite(data, Math.floor(prex), Math.floor(prey), width, width, radioValue)
        } else {
          //console.log("pixel not white")
        }
      
        for (const [x, y] of allcoords) {
          const i = (y * width + x) * 4
          data[i]     = usecolor.r
          data[i + 1] = usecolor.g
          data[i + 2] = usecolor.b
          data[i + 3] = 255
        }
        // limit one to one
        if (radioValue === 'fillOne') {
          break
        }
      }
      ctx.putImageData(img, 0, 0)
    }
  }
