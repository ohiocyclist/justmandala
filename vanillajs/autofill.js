"use strict";

function autofill() {
  const fillableAreas = []
  const img = ctx.getImageData(0, 0, symmetry, symmetry)
  const bgdata = img.data
  if (fillablesStyle === 2) {
    getFillableAreas(symmetry, slider2.value, bgdata, fillableAreas)
  } else {
    getAllFillable(symmetry, slider2.value, bgdata, fillableAreas)
  }
  // then step through fillable areas
  const img2 = ctx.getImageData(0, 0, symmetry, symmetry)
  stepThroughFillables(img2, fillableAreas, colorlist, symmetry)
  ctx.putImageData(img2, 0, 0)
}

function getAllWhiteAreas(bgdata, realoutputs, slider1, width) {
  let areaNumber = 0
  let areaMap = new Int32Array(width * width)
  let output = {}
  let wideFactor = Math.floor((width / 2 - 20) * Math.PI / Number(slider1) * 2.2)
  let xMin = Math.floor(width / 2 - wideFactor)
  let xMax = Math.round(width / 2 + wideFactor)
  for (let y = 0; y < width; y++) {
    for (let x = width - 1; x >= 0; x--) {
      let idx = x + y * width
      let bdx = idx * 4
      let prevNumber = 0
      // skip forward past non-white areas
      let whiteconditional = (bdx) => (bgdata[bdx] < 215 && bgdata[bdx + 1] < 215 && bgdata[bdx + 2] < 215)
      let gover = whiteconditional(bdx)
      if (gover) {
        areaMap[idx] = 0
        continue
      }
      // get the previous correct color
      if (x > 0 && areaMap[idx - 1] > 0) {
        prevNumber = areaMap[idx - 1]
      }
      if (y > 0 && areaMap[idx - width] > 0) {
        prevNumber = areaMap[idx - width]
      }
      if (x > 0 && y > 0 && areaMap[idx - width - 1] > 0 && prevNumber === 0) {
        prevNumber = areaMap[idx - width - 1]
      }
      if (prevNumber === 0) {areaNumber = areaNumber + 1; prevNumber = areaNumber; output[prevNumber] = []}
      areaMap[idx] = prevNumber
    }
  }

  const dobailhere = false
  if (dobailhere) {
    for (let y = 0; y < width; y++) {
      for (let x = 0; x < width; x++) {
        let idx = x + y * width
        let thisdx = areaMap[idx]
        if (thisdx > 0) {
          output[thisdx].push([x, y])
        }
      }
    }
    for (let i = 1; i <= areaNumber; i++) {
        realoutputs.push(output[i].flat())
    }    
    return
  }

  // merge step combo x
  let prevNumber = 0
  for (let y = 0; y < width; y++) {
    for (let x = width - 1; x >= 0; x--) {
      let idx = x + y * width
      // force to Y merge number if available
      // step over in x as well
      let fact = 1
      if (x === width - fact) fact = 0
      if (areaMap[idx - width - fact] !== 0 && areaMap[idx - width - fact] != undefined) {
        prevNumber = areaMap[idx - width - fact]
//      } else if (idx > 2 * width + fact && areaMap[idx - 2 * width - fact] !== 0 && areaMap[idx - 2 * width - fact] != undefined) {
//        prevNumber = areaMap[idx - 2 * width - fact]
//      } else if (x < width - 5 && areaMap[idx + 5] !== 0 && areaMap[idx + 4] != undefined) {
//        prevNumber = areaMap[idx + 4]
      } else if (x < width - 1 && areaMap[idx + 1] !== 0 && areaMap[idx + 1] != undefined) {
        prevNumber = areaMap[idx + 1]
      } else if (x < width - 2 && areaMap[idx + 2] !== 0 && areaMap[idx + 2] != undefined) {
        prevNumber = areaMap[idx + 2]
//      } else if (x < width - 3 && areaMap[idx + 3] !== 0 && areaMap[idx + 3] != undefined) {
//        prevNumber = areaMap[idx + 3]
      }
      // now recolor with x or y
      if (prevNumber !== 0 && areaMap[idx] !== 0) {
        areaMap[idx] = prevNumber
        output[prevNumber].push([x, y])
      } else if (areaMap[idx] !== 0) {
        if (!output[areaMap[idx]]) output[areaMap[idx]] = []
        output[areaMap[idx]].push([x, y])
      }
      prevNumber = areaMap[idx]
    }
  }

  const dobailmsx = false
  if (dobailmsx) {
    for (let y = 0; y < width; y++) {
      for (let x = 0; x < width; x++) {
        let idx = x + y * width
        let thisdx = areaMap[idx]
        if (thisdx > 0) {
          output[thisdx].push([x, y])
        }
      }
    }
    for (let i = 1; i <= areaNumber; i++) {
        realoutputs.push(output[i].flat())
    }    
    return
  }

  // merge step diagonals
  let equivs = {}

  // 1. Helper function to find the absolute "boss" (root) of any area
  // This uses path compression, making future lookups near-instant O(1)
  function findRootNode(id, equivs) {
    let root = id
    while (equivs[root]) {
      root = equivs[root]
    }
    
    // Path compression: point directly to the ultimate boss to speed up next time
    let current = id
    while (current !== root) {
      let next = equivs[current]
      equivs[current] = root
      current = next
    }
    
    return root
  }

  for (let y = 0; y < width; y++) {
    for (let x = width - 2; x >= 0; x--) {
      const idx = x + y * width
      
      const leftArea = areaMap[idx]
      const rightArea = areaMap[idx + 1]
      
      // Only merge if both are valid areas and they aren't already the same literal ID
      if (leftArea > 0 && rightArea > 0 && leftArea !== rightArea) {
        
        // Find the ultimate boss of BOTH stripes
        const bossLeft = findRootNode(leftArea, equivs)
        const bossRight = findRootNode(rightArea, equivs)
        
        // If they don't share the same ultimate boss yet, link them!
        if (bossLeft !== bossRight) {
          // Make the smaller or larger ID the boss (consistently) to prevent cycles
          if (bossLeft < bossRight) {
            equivs[bossRight] = bossLeft
          } else {
            equivs[bossLeft] = bossRight
          }
        }
      }
    }
  }

  const equivBuckets = {}

  // invalidate seen areas
  const deads = new Uint8Array(areaNumber + 1) // +1 to safely handle 1-based indexing
  const undeads = new Uint8Array(areaNumber + 1)

  for (let j = 1; j <= areaNumber; j++) {
    // Always resolve to the absolute, ultimate root boss
    const ultimateBoss = findRootNode(j, equivs)

    // If an area has no matches, it is its own ultimate boss (ultimateBoss === j)
    // We only want to group things if they actually belong to a multi-area cluster,
    // or you can group EVERYTHING by its boss. Let's group everything by its ultimate boss:
    if (ultimateBoss !== j) {
      if (equivBuckets[ultimateBoss] === undefined) {
        equivBuckets[ultimateBoss] = [j]
      } else {
        equivBuckets[ultimateBoss].push(j)
      }
      // don't run both this and the boss together
      undeads[j] = 1
    }
  }

  const flatOutputs = new Array(areaNumber + 1)
  for (let i = 1; i <= areaNumber; i++) {
    const out = output[i]
    // Check length > 2 before wasting time flattening
    flatOutputs[i] = (out && out.length > 2) ? out.flat() : null
  }

  let matches

  for (let i = 1; i <= areaNumber; i++) {
    //const currentFlat = flatOutputs[i];
    const currentFlat = output[i]
    
    if (currentFlat && !deads[i]) {
      // Start the tracking array for this group
      let combinedFlat = []
      combinedFlat = [...currentFlat.flat()]
      
      if (combinedFlat.length < 2) continue
            
      // Look up pre-grouped matches instantly instead of looping over everything
      matches = equivBuckets[i]
      if (matches) {
        for (let m = 0; m < matches.length; m++) {
          const j = matches[m]
          if (!deads[j]) { // Safety check, though usually redundant depending on logic
            deads[j] = 1
            
            // Flattened data is already prepared; push elements efficiently
            const matchFlat = flatOutputs[j]
            if (matchFlat) {
              let matchout = 0
              let matchstride = 60000
              while (matchFlat.length > matchout) {
                combinedFlat.push(...matchFlat.slice(matchout, Math.min(matchFlat.length, matchout + matchstride)))
                matchout += matchstride
              }
            }
          }
        }
      }
      
      // Push using the exact nesting structure from your original code: [[[x1, y1, ...]]]

      // exclusion zone
      let maxval = Math.max(...combinedFlat.slice(0, Math.min(combinedFlat.length, 65500)))
      let minval = Math.min(...combinedFlat.slice(0, Math.min(combinedFlat.length, 65500)))
      if (maxval > width - 2 || minval < 1 ) {
        continue
      }
      
      if (!undeads[i] && combinedFlat.length > 2) {
        realoutputs.push(combinedFlat)
      }
    }
  }
}

function areaBasedSymmetry(realoutputs, fillableAreas, width) {
  const everyonespoints = []
  for (let i = 0; i < realoutputs.length; i++) {
    if (realoutputs[i] === undefined || realoutputs[i].length < 3) {
      continue
    }
    let tempset = new Set()
    for (let k = 0; k < realoutputs[i].length; k += 2) {
      tempset.add([realoutputs[i][k], realoutputs[i][k + 1]].join(','))
    }
    let startlength = [...tempset].length
    let total = [...tempset].reduce((acc, curr) => {
      let mycurr = curr.split(',')
      acc[0] += Number(mycurr[0])
      acc[1] += Number(mycurr[1])
      return acc
    }, [0, 0])
    let x = Math.round(total[0] / startlength)
    let y = Math.round(total[1] / startlength)
    // let's try a guaranteed point towards the middleish
    // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
    const loopprog = performance.now()
    let startcoordssort = [...tempset].sort().map((x) => {let splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
    // points just flat-out doesn't work.  Better to hope the inner and outer area's centers aren't close.
    let pstamp = 0
    if (!tempset.has([x,y].join(','))) {
      pstamp = [...tempset].length
      const picmid = Math.floor(startcoordssort.length / 2)
      //x = startcoordssort[picmid][0]
      //y = startcoordssort[picmid][1]
    }
    while(everyonespoints.length < i + 1) {
      everyonespoints.push([])
    }
    everyonespoints[i] = [x, y, pstamp]
  }

  let usedpoints = {}
  for (let i = 0; i < realoutputs.length; i++) {    
    if (usedpoints[i]) continue
    if (!everyonespoints[i] || everyonespoints[i] === undefined) continue
    let [x, y] = everyonespoints[i]
    const symmetricPoints = getSymmetryPoints(x, y, false)
    let thisarea = []
    for (let j = 0; j < everyonespoints.length; j++) {
      let mindist = 999999
      let winnerpick = 0
      let counterpick = -1
      if (everyonespoints[j] && !usedpoints[j]) {
        // get these out in order of symmetricPoints
        let counter = 0
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          let idx = (xx + yy * width)
          let thisdist = euclidDistance(xx, yy, everyonespoints[j][0], everyonespoints[j][1])
          // if the number of points is stamped, make sure it's similar
          // if (everyonespoints[i][2] > 50) console.log('pstamp comparison:', everyonespoints[i][2], everyonespoints[j][2])
          if (thisdist < mindist && everyonespoints[j][2] > everyonespoints[i][2] - 125 && everyonespoints[j][2] < everyonespoints[i][2] + 125) {
            mindist = thisdist
            winnerpick = j
            counterpick = counter
          }
          counter = counter + 1
        }
      }
      //myrad = euclidDistance(symmetricPoints[0][0], symmetricPoints[0][1], xCenter, xCenter)
      //if (mindist <= myrad / 24) {
      if (mindist < 4) {
        //console.log(mindist, everyonespoints[winnerpick], winnerpick)
        usedpoints[winnerpick] = 1
        while(thisarea.length < counterpick + 1) {
          thisarea.push([])
        }
        thisarea[counterpick] = realoutputs[winnerpick]
      }
    }
    const actarr = []
    for (let i = 0; i < thisarea.length; i++) {
      if (thisarea[i] && thisarea[i][0]) actarr.push(thisarea[i])
    }
    fillableAreas.push(actarr)
  }  

  // check for unfilled areas
  for(let i = 0; i < realoutputs.length; i++) {
    if (!usedpoints[i]) {
      console.log("unfilled area", i, realoutputs[i][0], realoutputs[i][1])
      // don't color the background
      if ((realoutputs[i][0] === 0 || realoutputs[i][0] === width - 1) && (realoutputs[i][1] === 0 || realoutputs[i][1] === width - 1)) {
        console.log("don't add, edge exclusion")
        continue
      } else {
        //console.log(realoutputs[i])
      }
      fillableAreas.push([realoutputs[i]])
    }
  }
}

function stackSweepOnAreas(bgdata, realoutputs, fillableAreas, width, slider1) {
  // do the standard setup
  let seen = new Set()
  for (let i = 0; i < realoutputs.length; i++) {
    if (realoutputs[i] === undefined || realoutputs[i].length < 3) {
      continue
    }
    let tempset = new Set()
    //for (let k = 0; k < startlength; k += 2) {
    let startlength = realoutputs[i].length
    for (let k = 0; k < realoutputs[i].length; k++) {
      //tempset.add([startcoords[k], startcoords[k + 1]].join(','))
      tempset.add([realoutputs[i][k][0], realoutputs[i][k][1]].join(','))
    }
    let total = [...tempset].reduce((acc, curr) => {
      let mycurr = curr.split(',')
      acc[0] += Number(mycurr[0])
      acc[1] += Number(mycurr[1])
      return acc
    }, [0, 0])
    let x = Math.round(total[0]  / startlength)
    let y = Math.round(total[1]  / startlength)
    // let's try a guaranteed point towards the middleish
    // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
    const loopprog = performance.now()
    const startcoordssort = [...tempset].sort().map((x) => {let splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
    if (!tempset.has([x,y].join(','))) {
      const picmid = Math.floor(startcoordssort.length / 2)
      x = startcoordssort[picmid][0]
      y = startcoordssort[picmid][1]
    }
    const symmetricPoints = []
    let presymmetricPoints = getSymmetryPoints(x, y, false)
    for (let [xx, yy] of presymmetricPoints) {
      xx = Math.round(xx)
      yy = Math.round(yy)
      let idx = (xx + yy * width)
      symmetricPoints.push([xx, yy])
      seen[idx] = 1
    }
    for (let val of startcoordssort) {
      seen[val[0] + width * val[1]] = 1
    }
    let thisArea = []
    for (let [xx, yy] of symmetricPoints) {
      xx = Math.round(xx)
      yy = Math.round(yy)
      let i = (yy * width + xx) * 4
      // only fill white pixel areas
      let canWhite = (bgdata[i] > 30 && bgdata[i + 1] > 30 && bgdata[i + 2] > 30)
      if (canWhite) {
        let [allcoords, alllength] = getAdjacentWhite(bgdata, xx, yy, width, width, false)
        if (alllength > 0) {
          let exclusion = false
          for (let k = 0; k < allcoords.length; k += 2) {
            let x = allcoords[k]
            let y = allcoords[k + 1]
            seen[x + width * y] = 1
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
            thisArea.push(allcoords)
            if (notan && thisArea.length >= slider1) {
              fillableAreas.push(thisArea)
              thisArea = []
            }
          }
        }
      } else {
        //console.log(`not white pixel ${xx} ${yy}`)
      }
    }
    if (thisArea.length >= slider1.length / 2) {
      fillableAreas.push(thisArea)
    }
  }
}

function naivePushAreas(realoutputs, fillableAreas) {
  for(let i = 0; i < realoutputs.length; i++) {
    fillableAreas.push([realoutputs[i]])
  }
}

function getAllFillable(width, slider1, bgdata, fillableAreas) {
  const starttime = performance.now()
  const realoutputs = []
  getAllWhiteAreas(bgdata, realoutputs, slider1, width)
  const midpoint = performance.now()
  console.log('first half', midpoint - starttime)
  let donaive = false

  if (donaive) {
    naivePushAreas(realoutputs, fillableAreas)
  } else {
    if (fillablesStyle) { 
      areaBasedSymmetry(realoutputs, fillableAreas, width)
    } else {
      stackSweepOnAreas(bgdata, realoutputs, fillableAreas, width, slider1)
    }
  }
  console.log('second half', performance.now() - midpoint)
}

function getFillableAreas(width, slider1, bgdata, fillableAreas) {
  // get the fillable areas we want to fill
  // use the symmetry to cut down on calls
  // we want something wide enough to carry one symmetry in all cases
  let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
  const igdata = bgdata.slice()
  if (wideFactor < 5) wideFactor = 5
  const seen = new Uint8Array(width * width)
  const start = performance.now()
  let timeup = performance.now() - start
  let timeone = 0
  let timetwo = 0
  let starttime = performance.now()
  // pre-sweep for big empty areas
  let sweepy = 0
  for (sweepy = 0; sweepy < xCenter; sweepy++) {
    let doublebreak = false
    for (let sweepx = 0; sweepx < width; sweepx++) {
      idx = (sweepx + width * sweepy) * 4
      if (bgdata[idx] < 240 && bgdata[idx + 1] < 240 && bgdata[idx + 2] < 240) {
        doublebreak = true
        break
      }
    }
    if (doublebreak) {
      break
    }
  }
  for (let prex = 0; prex < wideFactor; prex++) {
    for (let prey = 0; prey < width / 2 - sweepy; prey++) {
      const loopstart = performance.now()
      // reflect a little that we're working a triangle
      // but if we cut too many pixels out, we leave unfilled areas
      if (prey > width / 32 && prey < width / 8 && (prex < 1 * wideFactor / 8 || prex > 7 * wideFactor / 8)) continue
      if (prey >= width / 8 && prey < 3 * width / 16 && (prex < 1 * wideFactor / 4 || prex > 3 * wideFactor / 4)) continue
      // more space at the edges
      if (prey > 3 * width / 8 && prex % 4 === 3) continue
      // work outward from the center (for order of color purposes)
      // we skip some pixels for speed; that can miss areas sometimes if they're very small
      let x = prex % 2 === 0 ? Math.abs(width / 2 - prex) : width / 2 + prex
      let y = prey % 2 === 0 ? Math.abs(width / 2 - prey) : width / 2 + prey
      idx = (x + y * width)
      if (seen[idx]) {
        continue
      }
      // do this in symmetric points order
      // don't revisit seen points
      // get the center of area first
      blackfun = true
      let [startcoords, startlength] = getAdjacentWhite(igdata, x, y, width, width, blackfun)
      if (startlength < 3) continue
      let tempset = new Set()
      for (let k = 0; k < startlength; k += 2) {
        tempset.add([startcoords[k], startcoords[k + 1]].join(','))
      }
      /*
      let total = startcoords.reduce((acc, curr, index) => {
        if (index % 2 === 0) {
          acc[0] += curr
        } else {
          acc[1] += curr
        }
        return acc
      }, [0, 0])
      */
      let total = [...tempset].reduce((acc, curr) => {
        let mycurr = curr.split(',')
        acc[0] += Number(mycurr[0])
        acc[1] += Number(mycurr[1])
        return acc
      }, [0, 0])
      // * 2 -- the new way startlength holds data, one for x, one for y, instead of counting pairs
      x = Math.round(total[0] * 2 / startlength)
      y = Math.round(total[1] * 2 / startlength)
      // let's try a guaranteed point towards the middleish
      // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
      timeone = timeone + performance.now() - loopstart
      const loopprog = performance.now()
      startcoordssort = [...tempset].sort(
        /*(a, b) => {
        const [aS, bS] = [a[0], b[0]]

        if (aS[0] !== bS[0]) {
          return aS[0] - bS[0]
        }

        return aS[1] - bS[1]
      }*/
      ).map((x) => {splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
      if (!tempset.has([x,y].join(','))) {
        const picmid = Math.floor(startcoordssort.length / 2)
        x = startcoordssort[picmid][0]
        y = startcoordssort[picmid][1]
      }
      const symmetricPoints = []
      let presymmetricPoints = getSymmetryPoints(x, y, false)
      for (let [xx, yy] of presymmetricPoints) {
        idx = (xx + yy * width)
        if (!seen[idx]) symmetricPoints.push([xx, yy])
        seen[idx] = 1
      }
      for (let val of startcoordssort) {
        seen[val[0] + width * val[1]] = 1
      }
      let emptyCounter = 0
      timetwo = timetwo + performance.now() - loopprog
      // capture the center
      const centerstart = performance.now()
      if ((prex === 0 && prey === 0) || true || symmetricPoints.length >= Math.floor(slider1)) {
        let thisArea = []
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          let i = (yy * width + xx) * 4
          // only fill white pixel areas
          let canWhite = isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})
          if (canWhite) {
            emptyCounter += 1
            let [allcoords, alllength] = getAdjacentWhite(bgdata, xx, yy, width, width, false)
            if (alllength > 0) {
              let exclusion = false
              for (let k = 0; k < allcoords.length; k += 2) {
                let x = allcoords[k]
                let y = allcoords[k + 1]
                seen[x + width * y] = 1
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
                thisArea.push(allcoords)
                if (notan && thisArea.length >= slider1) {
                  fillableAreas.push(thisArea)
                  thisArea = []
                }
              }
            }
          } else {
            //console.log(`not white pixel ${xx} ${yy}`)
          }
        }
        if (true || (prex === 0 && prey === 0) || emptyCounter >= Math.floor(slider1 / 2)) {
          fillableAreas.push(thisArea)
        }
      }
      let littledelta = performance.now() - centerstart
      timeup = timeup + littledelta
    }
  }
  console.log("time", performance.now() - starttime)
  /*
  console.log("outer time", performance.now() - start)
  console.log("one time", timeone)
  console.log("two time", timetwo)
  console.log("inner time", timeup)
  */
}

function stepThroughFillables(img2, fillableAreas, palArr, width) {
  // fillableAreas is an array of arrays of points that represent areas to fill in
  // in color stepping order (of palArr)
  const data = img2.data
  let palLocn = 0
  let altpal = 5
  for (let i = 0; i < fillableAreas.length; i++) {
    //palLocn = Math.floor(Math.random() * (palArr.length - 1))
    let usecolor = hexToRgb(palArr[palLocn][1])
    // sub out black
    if (usecolor.r === 0 && usecolor.g === 0 && usecolor.b === 0) {
      usecolor.r = 120
      usecolor.b = 160
    }
    let altcolor = hexToRgb(palArr[altpal][1])
    if (altcolor.r === 0 && altcolor.g === 0 && altcolor.b === 0) {
      altcolor.r = 120
      altcolor.b = 160
    }
    // Notan style
    if (notan) {
      usecolor = {r: 255, g: 255, b: 255}
      altcolor = {r: 0, g: 0, b: 0}
    }
    palLocn = palLocn + 1
    altpal = altpal + 1
    // -1 -- don't use white as an autofill color
    if (palLocn >= palArr.length - 1) palLocn = 0
    if (altpal >= palArr.length - 1) altpal = 0
    for (let k = 0; k < fillableAreas[i].length; k++) {
      let total = [...fillableAreas[i][k]].reduce((acc, curr, index) => {
        if (index % 2 == 0) {
          acc[0] += Number(curr)
        } else {
          acc[1] += Number(curr)
        }
        return acc
      }, [0, 0])
      let alllength = fillableAreas[i][k].length
      let mx = Math.round(total[0] * 2 / alllength)
      let my = Math.round(total[1] * 2 / alllength)
      let maxdist = 0
      let maxdists = []
      for (let m = 0; m < alllength; m += 2) {
        let xx = fillableAreas[i][k][m]
        let yy = fillableAreas[i][k][m + 1]
        let thisdist = euclidDistance(mx, my, xx, yy)
        let angle = Math.round(10 * Math.atan2(xx - mx, yy - my))
        if (thisdist > maxdist) {
          maxdist = thisdist
        }
        if (!maxdists[angle] || maxdists[angle] < thisdist) {
          maxdists[angle] = thisdist
        }
      }        
      for (let j = 0; j < fillableAreas[i][k].length; j += 2) {
        if (!fillableAreas[i][k][j]) continue
        let x = fillableAreas[i][k][j]
        let y = fillableAreas[i][k][j + 1]      
        const l = (y * width + x) * 4
        // (k % 4 === 1 || k % 4 === 2)
        let thisdist = euclidDistance(x, y, mx, my)
        const conditional = slider2.value % 2 === 0 && k % 2 === 1
        let basehsv
        if (conditional) { //|| (notan && ((i % 2 === 0)))) {
        // if ((!notan && slider2.value % 2 == 0 && k % 2 === 1) || (notan && ((i % 2 === 0 && k % 2 === 0) ||
        // (i % 2 === 1 && k % 2 === 1)))) {
        //if (k > Math.floor(fillableAreas[i].length / 2)) {
          basehsv = rgbToHsv(usecolor.r, usecolor.g, usecolor.b)
        } else {
          basehsv = rgbToHsv(altcolor.r, altcolor.g, altcolor.b)
        }
        let angle = Math.round(10 * Math.atan2(x - mx, y - my))
        if (dograd === 1) {
          basehsv.h = basehsv.h - 60 * thisdist / maxdists[angle]
        } else if (dograd === 2) {
          basehsv.s = 0.8 * ( 1 - thisdist / maxdists[angle]) + 0.2
        } else if (dograd === 3) {
          basehsv.v = 0.8 * ( 1 - thisdist / maxdists[angle]) + 0.2
        }
        if (basehsv.h < 0) basehsv.h += 360
        let tusecolor = hsvToRgb(basehsv.h, basehsv.s, basehsv.v)
        data[l]     = tusecolor.r
        data[l + 1] = tusecolor.g
        data[l + 2] = tusecolor.b
        data[l + 3] = 255
      }
    }
  }  
}

document.getElementById("autofill").addEventListener("click", autofill)
