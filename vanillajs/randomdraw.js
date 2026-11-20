"use strict";

const moveconst = 6

const genecache = [0, 0, 0, 0, 0, 0, 0, 0, 0]
const defaultGene = {
    sectors: 12,
    strokeCount: 120,
    branchProbability: 0.3,
    segmentLength: 7,
    curvature: 0.9,
    direction: 0.7,
    length: 15,
    lenarr: [],
    dirarr: [],
    movarr: [],
    didinit: false
}

// initialize the gene
function geneInit(theGene) {
  theGene.didinit = true
  theGene.segmentLength = 5 + Math.round(4 * Math.random())
  theGene.curvature = 0.5 + 0.7 * Math.random()
  theGene.length = 10 + Math.round(10 * Math.random())
  let prevlen = theGene.length
  let prevdir = theGene.direction + randomLR(theGene.curvature, -theGene.curvature)
  for (let i = 0; i < theGene.strokeCount; i++) {
    let nlen = prevlen + Math.round(5 * Math.random() - 2)
    if (nlen < 2) nlen = 2
    theGene.lenarr.push(nlen)
    theGene.dirarr.push(prevdir + randomLR(theGene.curvature, -theGene.curvature))
    let thismove = moveconst
    if (Math.random() < 0.2) {
      thismove = 0
    } else if (Math.random() < 0.6) {
      thismove = Math.floor(moveconst / 2)
    }
    theGene.movarr.push(thismove)
    prevlen = theGene.lenarr[i]
    prevdir = theGene.dirarr[i]
  }
}

function crossover(mom, dad, child) {
  const mutationrate = 0.05
  for (let key in mom) {
    if (key.includes('arr')) {
      child[key] = []
      for (let i = 0; i < mom[key].length; i++) {
        let orig = randomLR(mom[key][i], dad[key][i])
        if (Math.random() < mutationrate) {
          child[key].push(orig * (0.9 + 0.2 * Math.random()))
        } else {
          child[key].push(orig)
        }
      }
    } else {
      child.key = randomLR(mom.key, dad.key)
    }
  }
}

function randomLR(left, right) {
  if (Math.random() > 0.5) {
    return right
  }
  return left
}

function drawEvoLine(p1, p2, ctxnumber) {
  ctx[ctxnumber].lineWidth = 4

  ctx[ctxnumber].beginPath()
  ctx[ctxnumber].lineCap = "round"
  ctx[ctxnumber].moveTo(p1.x, p1.y)
  ctx[ctxnumber].lineTo(p2.x, p2.y)
  ctx[ctxnumber].stroke()
}

function grow(cell, genes) {

    const newDirection = genes.dirarr[cell.generation]

    const radfactor = 8 * cell.generation / genes.strokeCount

    const nx =
        cell.x +
        genes.movarr[cell.generation] +
        Math.cos(newDirection) *
        genes.segmentLength * radfactor

    const ny =
        cell.y +
        -genes.movarr[cell.generation] +
        Math.sin(newDirection) *
        genes.segmentLength * radfactor

    let nlen = genes.lenarr[cell.generation]

    const child = {
        curvature: cell.curvature,
        x: nx,
        y: ny,
        px: cell.x,
        py: cell.y,
        direction: newDirection,
        generation: cell.generation + 1,
        length: nlen
    }

    return child
}

function notRandomLR(left, right, chooser) {
  if (chooser === 0) return left
  return right
}

function randomCopilotEvolver(thisGene, ctxnumber) {
  const growthPoints = []
  let thisCell = {direction: thisGene.direction, curvature: thisGene.curvature, x: 0, y: 0, px: 0, py: 0, length: thisGene.length, generation: 0}
  growthPoints.push(thisCell)
  for (let i = 0; i < thisGene.strokeCount; i++) {
    let prevCell = structuredClone(thisCell)
    thisCell = grow(thisCell, thisGene)
    growthPoints.push(thisCell)
    // branch
    if (thisGene.movarr[thisCell.generation] === 0) {
      thisCell = grow(thisCell, thisGene)
      growthPoints.push(thisCell)
    }
  }
  for (let stroke of growthPoints) {

      let angle =
          stroke.direction +
          notRandomLR(-thisGene.curvature, thisGene.curvature, thisGene.movarr[stroke.generation]);

      let length =
          stroke.length

      let nx = stroke.x
      let ny = stroke.y

      if (thisGene.movarr[stroke.generation] === 0) {
        nx = stroke.x + Math.cos(angle) * length
        ny = stroke.y + Math.sin(angle) * length
      }

      let next = {
          x: nx,
          y: ny,
          px: stroke.px,
          py: stroke.py
      }

      drawMirrored(next, thisGene.sectors, ctxnumber)
  }  
}

function rotatePoint(x, y, a) {
    return {
        x: (x * Math.cos(a) - y * Math.sin(a)) / 1 + xCenter,
        y: (x * Math.sin(a) + y * Math.cos(a)) / 1 + xCenter
    }
}

function drawMirrored(next, sectors, ctxnumber) {

    const step = Math.PI * 2 / sectors

    for (let i = 0; i < sectors; i++) {

        const rot = i * step

        drawEvoLine(
            rotatePoint(next.px, next.py, rot),
            rotatePoint(next.x, next.y, rot),
            ctxnumber
        )

        drawEvoLine(
            rotatePoint(-next.px, next.py, rot),
            rotatePoint(-next.x,  next.y, rot),
            ctxnumber
        )
    }
}

function randomCopilotMandala(cx, cy, radius, mirrorFactor) {
    // this function provided by Microsoft Copilot
    // prompt:  assume that you have a function drawline(x1, y1, x2, y2) that draws a line from x1,y1 to x2,y2 and a mirrorfactor variable that tells your function how many times it will be radially mirrored, write a short random mandala function
    let points = []
    // I edited the hyperparameters.  This is Copilot's original.
    // let count = 3 + Math.floor(Math.random() * 5)
    let count = 5 + Math.floor(Math.random() * 6)

    // Generate a random stroke in one wedge
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * radius,
            y: (Math.random() - 0.6) * radius * 0.5
            // originally Math.random() - 0.5, edited to push more to the center
        })
    }

    // Mirror around center
    // We don't need to draw all the mirrors, Copilot didn't
    // understand that the rest of the code takes care of that
    const skipcheck = true
    for (let m = 0; m <= 0; m++) { //m < mirrorFactor; m++) {
        let a = (Math.PI * 2 * m) / mirrorFactor
        let cosA = Math.cos(a)
        let sinA = Math.sin(a)

        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i]
            let p2 = points[i + 1]

            let x1 = cx + p1.x * cosA - p1.y * sinA
            let y1 = cy + p1.x * sinA + p1.y * cosA

            let x2 = cx + p2.x * cosA - p2.y * sinA
            let y2 = cy + p2.x * sinA + p2.y * cosA

            drawLine(x1, y1, x2, y2, skipcheck)

            // Optional reflection for denser mandalas
            drawLine(
                cx + p1.x * cosA + p1.y * sinA,
                cy + p1.x * sinA - p1.y * cosA,
                cx + p2.x * cosA + p2.y * sinA,
                cy + p2.x * sinA - p2.y * cosA,
                skipcheck
            )
        }
    }
}

function voronoiTrace(pointList) {
  // trace out the points that are equidistant from the roots
  let previ = 0
  let prevj = 0
  const boxinbox = 50
  for (let overi = xCenter; overi < symmetry; overi += boxinbox) {
    for (let overj = xCenter; overj < symmetry; overj += boxinbox) {
      // give a chance for the prev pixel to be the one to connect
      for (let i = overi; i < overi + boxinbox; i++) {
        for (let j = overj; j < overj + boxinbox; j++) {
          if (euclidDistance(i, j, xCenter, xCenter) >= xCenter) {
            continue
          }
          // filter out lines between distant points
          let distmin = 175
          for (let k = 0; k < pointList.length; k++) {
            const distone = euclidDistance(i, j, pointList[k][0], pointList[k][1])
            if (distone < distmin) {
              distmin = distone
            }
          }
          // mux points against each other
          let tubreak = false
          for (let k = 0; k < pointList.length - 1; k++) {
            for (let l = k + 1; l < pointList.length; l++ ) {
              const distone = euclidDistance(i, j, pointList[k][0], pointList[k][1])
              const disttwo = euclidDistance(i, j, pointList[l][0], pointList[l][1])
              let hyperx = 1
              if (distone < disttwo + hyperx && distone > disttwo - hyperx && distone < distmin + hyperx) {
                  if (euclidDistance(i, j, previ, prevj) > 10) {
                    previ = i
                    prevj = j
                  }
                  
                  drawLine(i, j, previ, prevj)
                  previ = i
                  prevj = j
                  tubreak = true
                  break
              }
            }
            if (tubreak) {
              break
            }
          }
        }
      }
    }
  }
}

function randomDraw(momGene, dadGene) {
  load()
  for (let i = 0; i < 9; i++) {
    ctx[i].strokeStyle = color
    ctx[i].lineWidth = 4
  }
  // five styles of random mandala
  const randval = Math.random()
  if (true) {
    for (let i = 0; i < 9; i++) {
      let myGene = structuredClone(defaultGene)
      if (i < 6 && momGene.didinit && dadGene.didinit) {
        crossover(momGene, dadGene, myGene)
      } else {
        geneInit(myGene)
      }
      genecache[i] = myGene
      randomCopilotEvolver(myGene, i)
      selectedref[i] = 0
    }
    document.querySelectorAll('canvas[id^="drawCanvas"]')
        .forEach(d => d.classList.remove("selected-canvas"));    
  } else if (randval < 0.12) {
    console.log("copilot style")
    randomCopilotMandala(xCenter, xCenter, xCenter, slider2.value)
  } else if (randval < 0.24) {
    // interlocking circles style
    console.log("circles style")
    let arcrad = 100
    if (slider2.value > 8) arcrad = 50
    ctx.beginPath()
    ctx.moveTo(xCenter + arcrad, xCenter)
    ctx.arc(xCenter, xCenter, arcrad, 0, Math.PI * 2)
    ctx.stroke()
    let aroundfactor = slider2.value
    let overfactor = 4
    let stepfactor = 1
    if (aroundfactor > 8) {aroundfactor = slider2.value / 2; overfactor = 4; stepfactor = 2.5}
    // draw the circles within the zone
    for (let i = 0; i < aroundfactor; i++) {
      for (let j = 1; j < overfactor; j++) {
        // shake up multiples other than 6
        // do it here so that everything is symmetric
        let randangle = Math.PI / 8 - Math.random() * Math.PI / 4
        if (true || slider2.value == 6) randangle = 0
        for (let k = 0; k < aroundfactor; k++) {
          let x = Math.cos(i * Math.PI * 2 / aroundfactor + randangle) * arcrad * j * stepfactor + Math.cos(k * Math.PI * 2 / aroundfactor) * arcrad + xCenter
          let y = Math.sin(i * Math.PI * 2 / aroundfactor + randangle) * arcrad * j * stepfactor + Math.sin(k * Math.PI * 2 / aroundfactor) * arcrad + xCenter
          ctx.moveTo(x + arcrad, y)
          ctx.arc(x, y, arcrad, 0, Math.PI * 2)
          ctx.stroke()      
        }
      }
      // draw the breaks between the zones
      let x = Math.cos(i * Math.PI * 2 / aroundfactor) * xCenter + xCenter
      let y = Math.sin(i * Math.PI * 2 / aroundfactor) * xCenter + xCenter
      ctx.beginPath()
      ctx.moveTo(xCenter, xCenter)
      ctx.lineTo(x, y)
      x = Math.round(Math.cos((i + 1/2) * Math.PI * 2 / aroundfactor) * 3.5 / 5 * xCenter + xCenter)
      y = Math.round(Math.sin((i + 1/2) * Math.PI * 2 / aroundfactor) * 3.5 / 5 * xCenter + xCenter)
      ctx.moveTo(xCenter, xCenter)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  } else if (randval < 0.36) {
    // geometric forms style
    console.log("geo forms")
    for (let i = -10; i < xCenter - 150; i += 52) {
      // skew y for the broader spectrum
      let jend = 0
      // more space to fill further out
      if (i > 150) {
        jend = 2
      }
      // need more fill for less symmetry
      if (slider2.value < 9) {
        jend++
      }
      for (let j = 0; j <= jend; j++) {
        let subdivide = 3
        let jittersize = 20 * Math.random() - 10
        let randdivive = Math.random()
        if (randdivive < 0.2) {
          subdivide = 5
        } else if (randdivive < 0.4) {
          subdivide = 6
        } else if (randdivive < 0.6) {
          subdivide = 7
        } else if (randdivive < 0.8) {
          subdivide = 17
        }
        let figscale = 50
        let lastlocs = [0, 0]
        const angshift = Math.PI * Math.random() / 2
        for (let preangle = 0; preangle <= Math.PI * 2; preangle += Math.PI * 2 / subdivide) {
          const angle = preangle - Math.PI / 4 + angshift
          const thislocs = [Math.cos(angle) * figscale + xCenter + i + jittersize, 
                        Math.sin(angle) * figscale + xCenter + i + j * figscale * 2 + jittersize]
          // circular keep-out
          if (euclidDistance(thislocs[0], thislocs[1], xCenter, xCenter) < xCenter && lastlocs[0] != 0) {
            drawLine(lastlocs[0], lastlocs[1], thislocs[0], thislocs[1])
          }
          lastlocs = thislocs
        }
      }
    }
  } else if (randval < 0.48) {
    console.log("voronoi")
    // Voronoi style
    let startPoints = [
        [xCenter + 0 - 100 * Math.random(), xCenter + 0 + 100 * Math.random()], 
        [xCenter + 0 + 100 * Math.random(), xCenter + 0 + 100 * Math.random()], 
        [xCenter + 50 + 50 * Math.random(), xCenter - 50 + 100 * Math.random()], 
        [xCenter + 0 - 100 * Math.random(), xCenter + 0 - 100 * Math.random()], 
        [xCenter + 0 + 100 * Math.random(), xCenter + 0 - 100 * Math.random()], 
        [xCenter + 100 - 100 * Math.random(), xCenter + 100 + 100 * Math.random()], 
        [xCenter + 100 + 100 * Math.random(), xCenter + 100 + 100 * Math.random()], 
        [xCenter + 150 + 50 * Math.random(), xCenter - 50 + 100 * Math.random()], 
        [xCenter + 100 - 100 * Math.random(), xCenter + 100 - 100 * Math.random()], 
        [xCenter + 100 + 100 * Math.random(), xCenter + 100 - 100 * Math.random()], 
        [xCenter + 300 - 100 * Math.random(), xCenter + 300 + 100 * Math.random()], 
        [xCenter + 300 + 100 * Math.random(), xCenter + 300 + 100 * Math.random()], 
        [xCenter + 200 + 100 * Math.random(), xCenter + 200 + 100 * Math.random()], 
        [xCenter + 300 - 100 * Math.random(), xCenter + 300 - 100 * Math.random()], 
        [xCenter + 300 + 100 * Math.random(), xCenter + 300 - 100 * Math.random()], 
    ]
    // try to keep the points in a narrower comb
    if (Math.random() < 0.5) {
        startPoints = [
            [xCenter + 300 + 100 * Math.random(), xCenter + 50 + 50 * Math.random()],
            [xCenter + 300 + 100 * Math.random(), xCenter - 25 + 50 * Math.random()],
            [xCenter + 250 + 100 * Math.random(), xCenter - 10 + 20 * Math.random()],
            [xCenter + 300 + 100 * Math.random(), xCenter - 50 - 50 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter + 20 + 20 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter - 10 + 20 * Math.random()],
            [xCenter + 100 + 100 * Math.random(), xCenter - 5 + 10 * Math.random()],
            [xCenter + 150 + 100 * Math.random(), xCenter - 20 - 20 * Math.random()],
            [xCenter + 0 + 20 * Math.random(), xCenter + 0 + 20 * Math.random()],
            [xCenter + 0 + 20 * Math.random(), xCenter - 0 - 20 * Math.random()],
        ]
    }
    let geoPoints = []
    for (let i = 0; i < startPoints.length; i++) {
        const newPoints = getSymmetryPoints(startPoints[i][0], startPoints[i][1])
        for (let j = 0; j < newPoints.length; j++) {
            geoPoints.push(newPoints[j])
        }
    }
    voronoiTrace(startPoints)
  } else if (randval < 0.6) {
    console.log("spiral")
    // spiral style
    ctx.strokeStyle = color
    let endx = xCenter
    let endy = xCenter
    let startx = 0
    let starty = 0
    let angle = 0
    for (let i = 0; i < 6; i++) {
      // draw the center and then move out a bit
      if (i === 1 || i === 2) {
        continue
      }
      let step = (i + 1) * 30 + (i + 1) * 10 * Math.random()
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
        drawLine(curx, cury, curendx, curendy)
        curx = curendx
        cury = curendy
      }
      endx = startx
      endy = starty
    }
  } else if (randval < 0.72) {
    console.log("straight lines")
    // just a bunch of straight lines style
    ctx.strokeStyle = color
    let offset = 40 * Math.random()
    const skipcheck = true
    drawLine(offset, xCenter - offset, xCenter, xCenter - offset, skipcheck)
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
      drawLine(startx, starty, startx + offset, Math.abs(symmetry - starty), skipcheck)
    }
  } else if (randval < 0.84) {
    console.log("interlocking crossing lines")
    // interlocking crossing lines style
    let workfactor = 12
    let ifactor = 2
    let endx = 0
    let endy = 0    
    let startx = 0
    let starty = 0
    const skipcheck = true
    for(let i = 0; i < workfactor - 3; i++) {
      ctx.strokeStyle = color
      // draw in the center to start, then push towards the edges
      let useifactor = 0
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
      if (endy > symmetry - edgekeep) {
        endy = symmetry - edgekeep
      }
      drawLine(startx, starty, endx, endy, skipcheck)
    }
  } else {
    console.log("edge to center push")
    // push from the edge to the center style
    let yLocn = 20
    let xLocn = xCenter
    let yStep = 12
    let currentStart = [xCenter, 5]
    // vary the step size for a more organic feel
    let stepSize = 0.25
    for(yLocn; yLocn < xCenter - 5; yLocn += yStep * 2 * Math.random() - yStep / 6) {
      let wideFactor = (xCenter - yLocn) * 2 * Math.PI / Number(sliderValueDisplay2.textContent) * 1.5
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
      drawLine(currentStart[0], currentStart[1], xLocn, yLocn)
      currentStart = [xLocn, yLocn]
    }
  }
}

document.getElementById("shufButton").addEventListener("click", () => {
  let momloc = -1
  let dadloc = -1
  for (let i = 0; i < 9; i++) {
    if (selectedref[i]) {
      if (momloc < 0) {
        momloc = i
      } else {
        dadloc = i
        break
      }
    }
  }
  if (dadloc > 0) {
    randomDraw(structuredClone(genecache[momloc]), structuredClone(genecache[dadloc]))
  }
})

randomDraw(defaultGene, defaultGene)
