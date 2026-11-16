import { getMandalaHelpers } from './getlocalcoordinates.js'

export class autoFill {

  static getFillableAreas = (width, slider1, bgdata, fillableAreas, radioValue, xylist, doCenterUp, seen) => {
    // get the fillable areas we want to fill
    // use the symmetry to cut down on calls
    // we want something wide enough to carry one symmetry in all cases
    let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
    // hat tip to testing and other cases where the canvas isn't hundreds of pixels wide and wideFactor can be negative
    if (wideFactor < 5) wideFactor = 5
    // pre-sweep for big empty areas
    let idx = 0
    let countup = 0
    let doublebreak = false
    let stepsize = 5
    if (width > 600) stepsize = 10
    if (!doCenterUp) stepsize = 1
    let starttime = performance.now()
    let sweepy = 0
    for (sweepy = 0; sweepy < width / 2; sweepy++) {
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
    for (let prey = 0; prey < width / 2 - sweepy; prey += stepsize) {
      if (doublebreak) break
        for (let prex = 0; prex < wideFactor; prex += stepsize) {      
        //countup++
        //if (countup > 10000) {console.log('emergency stop'); doublebreak = true; break}
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

        let symmetricPoints = []   
        let flavor = 0     
        if (doCenterUp) {
          idx = x + y * width
          // marking areas taken
          //xylist.push([x, y, flavor])
          if (seen[idx]) {
            continue
          }
          // do this in symmetric points order
          let startPoints = getMandalaHelpers.getAdjacentWhite(bgdata, x, y, width, width, radioValue)
          if (startPoints.length < 5) continue
          let tempset = new Set()
          for (let k = 0; k < startPoints.length; k += 2) {
            tempset.add([startPoints[k], startPoints[k + 1]].join(','))
          }
          let total = [...tempset].reduce((acc, curr) => {
            let mycurr = curr.split(',')
            acc[0] += Number(mycurr[0])
            acc[1] += Number(mycurr[1])
            return acc
          }, [0, 0])
          x = Math.round(total[0] / [...tempset].length)
          y = Math.round(total[1] / [...tempset].length)
          // let's try a guaranteed point towards the middleish
          // in pathological conditions with the above algo, x,y can be outside the actual list of coordinates
          let startcoordssort = [...tempset].sort((a, b) => a.localeCompare(b))
          startcoordssort = startcoordssort.map((x) => {const splitty = x.split(','); return [Number(splitty[0]), Number(splitty[1])]})
          if (!tempset.has([x,y].join(','))) {
            const picmid = Math.floor(startcoordssort.length / 2)
            x = Math.round(startcoordssort[picmid][0])
            y = Math.round(startcoordssort[picmid][1])
            flavor = 255
          }
          idx = (x + y * width)
          //if (seen[idx]) continue
          //xylist.push([x, y, flavor])
          const littlecheck = new Uint8Array(width * width)
          let presymmetricPoints = getMandalaHelpers.getSymmetryPoints(x, y, width, slider1, tessel, false)
          for (let [xx, yy] of presymmetricPoints) {
            xx = Math.round(xx)
            yy = Math.round(yy)
            //xylist.push([xx, yy, flavor])
            idx = (xx + yy * width)
            symmetricPoints.push([xx, yy])
            littlecheck[idx] = 1
          }
        } else {
          idx = x + y * width
          // marking areas taken
          if (seen[idx]) continue
          symmetricPoints = getMandalaHelpers.getSymmetryPoints(x, y, width, slider1, tessel, false)
        }
        const subAreas = []
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.round(xx)
          yy = Math.round(yy)
          idx = (yy * width + xx)
          const i = idx * 4
          // only fill areas not already filled
          if (seen[idx]) {
            //console.log('removing point', xx, yy)
          } else {
            countup++
            let allcoords = getMandalaHelpers.getAdjacentWhite(bgdata, xx, yy, width, width, radioValue)
            if (allcoords.length > 1) {
              const pushcoords = []
              let exclusion = false
              for (let m = 0; m < allcoords.length; m += 2) {
                x = allcoords[m]
                y = allcoords[m + 1]
                // don't use the edge areas
                if ((x === 0 && (y === 0 || y === width - 1)) || (x === width - 1 && (y === 0 || y === width - 1))) {
                  exclusion = true
                }
                idx = x + y * width
                seen[idx] = 1
                pushcoords.push([x, y])
              }
              if (!exclusion) {
                // this does the actual filling (pass by reference)
                subAreas.push(pushcoords)
              }
            }
          }
        }
        if (subAreas.length > 0) {
          fillableAreas.push(subAreas)
        }
      }
    }  
    console.log('time', performance.now() - starttime)
    //console.log(`countup ${countup}`)      
    //console.log(fillableAreas)
  }

  static stepThroughFillables = (img2, fillableAreas, palArr, width, slider3) => {
    // fillableAreas is an array of arrays of points that represent areas to fill in
    // in color stepping order (of palArr)
    const data = img2.data
    let palLocn = 0
    let altLocn = Math.min(5, slider3)
    for (let i = 0; i < fillableAreas.length; i++) {
      let usecolor = getMandalaHelpers.hexToRgb(palArr[palLocn])
      palLocn = palLocn + 1
      if (palLocn >= palArr.length || palLocn >= slider3) palLocn = 0
      let altcolor = getMandalaHelpers.hexToRgb(palArr[altLocn])
      altLocn = altLocn + 1
      if (altLocn >= palArr.length || altLocn >= slider3) altLocn = 0
      for (let m = 0; m < fillableAreas[i].length; m++) {
        for (let j = 0; j < fillableAreas[i][m].length; j += 2) {
          if (!fillableAreas[i][m][j]) continue
          let x = fillableAreas[i][m][j]
          let y = fillableAreas[i][m][j + 1]
          const k = (y * width + x) * 4
          if (m % 2 === 0) {
            data[k]     = usecolor.r
            data[k + 1] = usecolor.g
            data[k + 2] = usecolor.b
            data[k + 3] = 255
          } else {
            data[k]     = altcolor.r
            data[k + 1] = altcolor.g
            data[k + 2] = altcolor.b
            data[k + 3] = 255
          }
        }
      }
    }  
  }

  static getAllWhiteAreas(bgdata, realoutputs, slider1, width) {
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
        let whiteconditional = (bdx) => bgdata[bdx] < 215 || bgdata[bdx + 1] < 215 || bgdata[bdx + 2] < 215
        if (whiteconditional(bdx)) {
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
        if (prevNumber === 0) {areaNumber = areaNumber + 1; prevNumber = areaNumber; output[prevNumber] = []}
        areaMap[idx] = prevNumber
      }
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
        } else if (x < width - 1 && areaMap[idx + 1] !== 0 && areaMap[idx + 1] != undefined) {
          prevNumber = areaMap[idx + 1]
        } else if (x < width - 2 && areaMap[idx + 2] !== 0 && areaMap[idx + 2] != undefined) {
          prevNumber = areaMap[idx + 2]          
        } else if (x < width - 3 && areaMap[idx + 3] !== 0 && areaMap[idx + 3] != undefined) {
          prevNumber = areaMap[idx + 3]
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

    // merge step diagonals
    const equivs = {}

    // 2. Your updated loop structure
    for (let y = 0; y < width; y++) {
      for (let x = width - 2; x >= 0; x--) {
        const idx = x + y * width
        
        const leftArea = areaMap[idx]
        const rightArea = areaMap[idx + 1]
        
        // Only merge if both are valid areas and they aren't already the same literal ID
        if (leftArea > 0 && rightArea > 0 && leftArea !== rightArea) {
          
          // Find the ultimate boss of BOTH stripes
          const bossLeft = autoFill.findRootNode(leftArea, equivs)
          const bossRight = autoFill.findRootNode(rightArea, equivs)
          
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

    autoFill.pushRealOutput(areaNumber, output, equivs, width, realoutputs)
  }

  // 1. Helper function to find the absolute "boss" (root) of any area
  // This uses path compression, making future lookups near-instant O(1)
  static findRootNode(id, equivs) {
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

  static pushRealOutput(areaNumber, output, equivs, width, realoutputs) {
    const equivBuckets = {}
    const usedBuckets = {}

    // invalidate seen areas
    const deads = new Uint8Array(areaNumber + 1) // +1 to safely handle 1-based indexing
    const undeads = new Uint8Array(areaNumber + 1)

    for (let j = 1; j <= areaNumber; j++) {
      // Always resolve to the absolute, ultimate root boss
      const ultimateBoss = autoFill.findRootNode(j, equivs)

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

  static areaBasedSymmetry(realoutputs, fillableAreas, slider1, tessel, width) {
    // get the center of mass for all areas
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

    // now get the sister areas to all areas
    let usedpoints = {}
    for (let i = 0; i < realoutputs.length; i++) {    
      if (usedpoints[i]) continue
      let [x, y] = everyonespoints[i]
      const symmetricPoints = getMandalaHelpers.getSymmetryPoints(x, y, width, slider1, tessel, false)
      const thisarea = []
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
            let thisdist = getMandalaHelpers.euclidDistance(xx, yy, everyonespoints[j][0], everyonespoints[j][1])
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
        //myrad = getMandalaHelpers.euclidDistance(symmetricPoints[0][0], symmetricPoints[0][1], xCenter, xCenter)
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
      // don't push blanks into fillableAreas, they mess up the counting
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
        if (Math.max(realoutputs[i]) > width - 2 || Math.min(realoutputs[i]) < 1) {
          console.log("edge area, don't color")
          continue
        }
        fillableAreas.push([realoutputs[i]])
      }
    }
  }

  static getAllFillable(width, slider1, tessel, bgdata, fillableAreas) {
    const starttime = performance.now()
    const realoutputs = []
    this.getAllWhiteAreas(bgdata, realoutputs, slider1, width)
    const midpoint = performance.now()
    console.log('first half', midpoint - starttime)
    this.areaBasedSymmetry(realoutputs, fillableAreas, slider1, tessel, width)
    console.log('second half', performance.now() - midpoint)
  }


  static autoFill = (ctx, width, myPalette, slider1, slider3, tessel, radioValue) => {
    // first, traverse the entire image and find all the fillable areas
    let start = Date.now()
    const fillableAreas = []
    const xylist = []
    const img = ctx.getImageData(0, 0, width, width)
    const bgdata = img.data
    // all this is necessary to turn this into an array of hex sequences
    const palArr = decodeURIComponent(myPalette).replace("[", "").replace("]", "").replaceAll(`"`, "").split(",")
    // run once with the symmetric view and once to fill in the gaps
    const seen = new Uint8Array(width * width)
    const fillablesStyle = 1
    if (fillablesStyle === 2) {
      this.getFillableAreas(width, slider1, bgdata, fillableAreas, radioValue, xylist, true, seen)
    } else {
      this.getAllFillable(width, slider1, tessel, bgdata, fillableAreas)
    }
    // then step through fillable areas
    const img2 = ctx.getImageData(0, 0, width, width)
    this.stepThroughFillables(img2, fillableAreas, palArr, width, slider3)
    const data = img2.data
    // draw big x's where the xylist is
    //let startPoints = getMandalaHelpers.getAdjacentWhite(bgdata, 367, 496, width, width, radioValue)
    for (let [x, y, flavor] of xylist) {
      for (let j = -4; j < 5; j++) {
        for (let k = -4; k < 5; k++){
          const idx = (x + j + (y + k) * width) * 4
          data[idx] = flavor
          data[idx + 1] = 0
          data[idx + 2] = 0
          data[idx + 3] = 255
        }
      }
    }
    ctx.putImageData(img2, 0, 0)
    //console.log("done whole", Date.now() - start)
  }
}