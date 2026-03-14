export class getMandalaHelpers {

  static getLocalCoordinates = (ev, chartRef) => {
    if (ev.type.includes("touch")) {
      // this was the last step in getting mobile working.  Without referring to touch, the coordinates are off the page.
      var touch = ev.touches[0] || ev.changedTouches[0]
      var realTarget = document.elementFromPoint(touch.clientX, touch.clientY)      
      ev.offsetX = touch.clientX - realTarget.getBoundingClientRect().x
      ev.offsetY = touch.clientY - realTarget.getBoundingClientRect().y
      const rect = chartRef.current.getBoundingClientRect()
      return [touch.clientX - rect.left + 0.5, touch.clientY - rect.top + 0.5]
    }
    // mouse/desktop is comparatively simpler.
    const rect = chartRef.current.getBoundingClientRect()
    return [ev.clientX - rect.left + 0.5, ev.clientY - rect.top + 0.5]
  }

  static getSymmetryPoints = (x, y, width, slider1, extraMirror=true, gridPull=false) => {
    // The coordinate system has its origin at the center of the canvas,
    // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
    var ctrX = width / 2
    var ctrY = width / 2
    var relX = x - ctrX
    var relY = ctrY - y
    var dist = Math.hypot(relX, relY)
    var angle = Math.atan2(relX, relY) // Radians
    var result = []
    var gridLines = []
    for (var i = 0; i < slider1; i++) {
      // step through all the angles in radial symmetry
      var theta = angle + ((Math.PI * 2) / slider1) * i // Radians
      x = ctrX + Math.sin(theta) * dist
      y = ctrY - Math.cos(theta) * dist
      result.push([x, y])
      // put another left / right mirroring into the symmetry points
      if (extraMirror) {
        x = ctrX - Math.sin(theta) * dist
        result.push([x, y])
      }
      // create all the gridlines
      let gridX = ctrX + Math.sin(((Math.PI * 2) / slider1) * i) * 0.9 * ctrX
      let gridY = ctrY - Math.cos(((Math.PI * 2) / slider1) * i) * 0.9 * ctrY
      gridLines.push([gridX, gridY])
    }

    if (gridPull) {
      return gridLines
    }
    return result
  }

  static hexToRgb = (hex) => {
      // turn a #ff00B0 into a tuple
      hex = hex.replace(/^#/, "");

      // expand shorthand #fff → #ffffff
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

  static isWhite = ({ r, g, b, a }) => {
    // put some fudge factor in for off-white
    // lines as drawn have off-white pixels surrounding them for dithering that we just want to fill
    // this can also catch some bright colors however
    // used to only overfill white
    return r > 215 && g > 215 && b > 215
  }

  static getAdjacentWhite = (data, startX, startY, width, height, radioValue) => {
      // figure out what area we can fill
      // faster now, thanks to Copilot
      const stack = new Int32Array(width * height * 2)
      let sp = 0

      stack[sp++] = startX
      stack[sp++] = startY

      const visited = new Uint8Array(width * height)
      const result = []

      let i = (startY * width + startX) * 4
      let curColorR = data[i]
      let curColorG = data[i + 1]
      let curColorB = data[i + 2]

      while (sp > 0) {
        const y = stack[--sp]
        const x = stack[--sp]

        if (x < 0 || y < 0 || x >= width || y >= height) continue

        const idx = y * width + x
        if (visited[idx]) continue
        visited[idx] = 1

        const i = idx * 4
        const r = data[i], g = data[i + 1], b = data[i + 2]

        // Inline your white check for speed
        if (radioValue === "fillOne") {
          if (!(r === curColorR && g === curColorG && b === curColorB)) continue
        } else {
          if (!(r > 215 && g > 215 && b > 215)) continue
        }

        result.push([x, y])

        stack[sp++] = x + 1; stack[sp++] = y
        stack[sp++] = x - 1; stack[sp++] = y
        stack[sp++] = x;     stack[sp++] = y + 1
        stack[sp++] = x;     stack[sp++] = y - 1
      }

      return result;

  }
  
}