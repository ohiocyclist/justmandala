export function getLocalCoordinates(ev, chartRef) {
    if (ev.type == "touchstart") {
      var touch = ev.touches[0] || ev.changedTouches[0]
      var realTarget = document.elementFromPoint(touch.clientX, touch.clientY)
      ev.offsetX = touch.clientX - realTarget.getBoundingClientRect().x
      ev.offsetY = touch.clientY - realTarget.getBoundingClientRect().y
    }
    const rect = chartRef.current.getBoundingClientRect()
    return [ev.clientX - rect.left + 0.5, ev.clientY - rect.top + 0.5]
  }

export function getSymmetryPoints(x, y, width, slider1) {
    // The coordinate system has its origin at the center of the canvas,
    // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
    var ctrX = width / 2
    var ctrY = width / 2
    var relX = x - ctrX
    var relY = ctrY - y
    var dist = Math.hypot(relX, relY)
    var angle = Math.atan2(relX, relY) // Radians
    var result = []
    for (var i = 0; i < slider1; i++) {
      var theta = angle + ((Math.PI * 2) / slider1) * i // Radians
      x = ctrX + Math.sin(theta) * dist
      y = ctrY - Math.cos(theta) * dist
      result.push([x, y])
      if (true) {
        x = ctrX - Math.sin(theta) * dist
        result.push([x, y])
      }
    }

    return result
  }

export function hexToRgb(hex) {
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

export function isWhite({ r, g, b, a }) {
    return r > 215 && g > 215 && b > 215
  }

export function getAdjacentWhite(data, startX, startY, width, height, radioValue) {
      const stack = [[startX, startY]]
      const visited = new Set()
      const result = []

      const key = (x, y) => `${x},${y}`

      const i = (startY * width + startX) * 4
      const startingcolor = {r: data[i], g: data[i + 1], b: data[i + 2], a: 255}

      while (stack.length > 0) {
          const [x, y] = stack.pop()
          const k = key(x, y)

          if (visited.has(k)) continue
          visited.add(k)

          // bounds check
          if (x < 0 || y < 0 || x >= width || y >= height) continue

          // color check
          const i = (y * width + x) * 4
          // allow one fill to over fill colors
          if (radioValue === 'fillOne') {
            //console.log(data[i], startingcolor.r, data[i + 1], startingcolor.g, data[i + 2], startingcolor.b)
            if (data[i] != startingcolor.r || data[i + 1] != startingcolor.g || data[i + 2] != startingcolor.b) continue
          } else {
            if (!isWhite({r: data[i], g: data[i + 1], b: data[i + 2], a: 255})) continue
          }

          result.push([x, y])

          // add neighbors
          stack.push([x + 1, y])
          stack.push([x - 1, y])
          stack.push([x, y + 1])
          stack.push([x, y - 1])
      }

      return result
  }
  