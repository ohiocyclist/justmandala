import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3"
import { useQueryParam, StringParam, withDefault, NumberParam } from 'use-query-params'
import { Button, Form, Container, Row, Col, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import ColorChooser from './ColorChooser'
import { MandalaLib } from './mandalalibraries'
import "bootstrap/dist/css/bootstrap.min.css"

function JustMandala() {
  const chartRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const slider1Default = withDefault(NumberParam, 17)
  const [slider1, setSlider1] = useQueryParam('Symmetry', slider1Default)
  const slider2Default = withDefault(NumberParam, 4)
  const [slider2, setSlider2] = useQueryParam('Brushsize', slider2Default)
  const slider3Default = withDefault(NumberParam, 16)
  const [slider3, setSlider3] = useQueryParam('AutoRepeat', slider3Default)
  const [myLightDark, setMyLightDark] = useState(0)
  const toastId = ''
  const paletteDefault = withDefault(StringParam,'')
  const [myPalette, setMyPalette] = useQueryParam('palette', paletteDefault)  
  const [currentColor, setCurrentColor] = useState('')
  const fillDefault = withDefault(StringParam, 'fillAll')
  const [radioValue, setRadioValue] = useQueryParam('fillstyle', fillDefault)

  var ctx, prevX, prevY
  let color = currentColor
  const width = 1200
  let xCenter = width / 2

  const resetCanvas = () => {
    d3.select(chartRef.current).selectAll("canvas").remove()
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width
    chartRef.current.appendChild(canvas)
    canvasRef.current = canvas
    ctx = canvas.getContext("2d")
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, width)
    ctxRef.current = ctx
  }

  const handleRadioChange = (event) => {
    setRadioValue(event)
  }

  const handleSlider1Change = (event) => {
    const value = Number(event.target.value)
    // let the user mix symmetry degrees in one mandala
    //resetCanvas()
    setSlider1(value)
  }

  const handleSlider2Change = (event) => {
    const value = Number(event.target.value)
    setSlider2(value)
  }

  const handleSlider3Change = (event) => {
    const value = Number(event.target.value)
    setSlider3(value)
  }

  useEffect(() => {
    resetCanvas()
  }, [])

  function overDraw(event) {
    if (event.ctrlKey) {
      fill(event)
    } else {
      draw(event)
    }
  }

  function isWhite({ r, g, b }) {
    return r > 215 && g > 215 && b > 215
  }

  function getAdjacentWhite(data, startX, startY, width, height) {
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

  function hexToRgb(hex) {
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

  function autoFill() {
    // first, traverse the entire image and find all the fillable areas
    const fillableAreas = []
    const ctx = ctxRef.current
    const img = ctx.getImageData(0, 0, width, width)
    const bgdata = img.data
    let palLocn = 0
    // all this is necessary to turn this into an array of hex sequences
    const palArr = decodeURIComponent(myPalette).replace("[", "").replace("]", "").replaceAll(`"`, "").split(",")
    // use the symmetry to cut down on calls
    // we want something wide enough to carry one symmetry in all cases
    let wideFactor = (width / 2 - 20) * Math.PI / Number(slider1) * 1.1
    for (let prex = 0; prex < wideFactor; prex++) {
      for (let prey = 0; prey < width / 2; prey++) {
        // work outward from the center (for order of color purposes)
        let x = 0
        if (prex % 2 === 0) {
          x = Math.abs(500 - prex)
        } else {
          x = 500 + prex
        }
        let y = 0 
        if (prey % 2 === 0) {
          y = Math.abs(500 - prey)
        } else {
          y = 500 + prey
        }
        // do this in symmetric points order
        let symmetricPoints = getSymmetryPoints(x, y)
        for (let [xx, yy] of symmetricPoints) {
          xx = Math.floor(xx)
          yy = Math.floor(yy)
          const i = (yy * width + xx) * 4
          if (isWhite({r: bgdata[i], g: bgdata[i + 1], b: bgdata[i + 2], a: 255})) {
            let allcoords = getAdjacentWhite(bgdata, xx, yy, width, width)
            if (allcoords.length > 0) {
              let exclusion = false
              for (const [x, y] of allcoords) {
                // don't use the edge areas
                if ((x === 0 && (y === 0 || y === width - 1)) || (x === width - 1 && (y === 0 || y === width - 1))) {
                  exclusion = true
                }
                const j = (y * width + x) * 4
                bgdata[j]     = 0
                bgdata[j + 1] = 0
                bgdata[j + 2] = 0
                bgdata[j + 3] = 255
              }
              if (!exclusion) {
                fillableAreas.push(allcoords)
              }
            }
          }
        }
      }
      console.log("done")
    }
    // then step through fillable areas
    const img2 = ctx.getImageData(0, 0, width, width)
    const data = img2.data
    for (let i = 0; i < fillableAreas.length; i++) {
      let usecolor = hexToRgb(palArr[palLocn])
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
    ctx.putImageData(img2, 0, 0)
  }

  function fill(e) {
    var coord = getLocalCoordinates(e);
    if (e.buttons == 1) {
      var x = Math.floor(coord[0])
      var y = Math.floor(coord[1])
      let symmetricPoints = getSymmetryPoints(x, y)
      const ctx = ctxRef.current
      const img = ctx.getImageData(0, 0, width, width)
      const data = img.data
      let usecolor = hexToRgb(color)
      let idx = 0
      for (const [prex, prey] of symmetricPoints) {
        // there tend to be two mirrors in one white zone, necessitating division by 4 to hit every other white zone
        if (idx % 4 != 0 && radioValue === 'fillHalf') {
          idx = idx + 1
          continue
        }
        idx = idx + 1
        let allcoords = []
        const i = (Math.floor(prey) * width + Math.floor(prex)) * 4
        if (radioValue === 'fillOne' || isWhite({r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3]})) {
          allcoords = getAdjacentWhite(data, Math.floor(prex), Math.floor(prey), width, width)
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

  function getSymmetryPoints(x, y) {
    // The coordinate system has its origin at the center of the canvas,
    // has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
    var ctrX = width / 2;
    var ctrY = width / 2;
    var relX = x - ctrX;
    var relY = ctrY - y;
    var dist = Math.hypot(relX, relY);
    var angle = Math.atan2(relX, relY); // Radians
    var result = [];
    for (var i = 0; i < slider1; i++) {
      var theta = angle + ((Math.PI * 2) / slider1) * i; // Radians
      x = ctrX + Math.sin(theta) * dist;
      y = ctrY - Math.cos(theta) * dist;
      result.push([x, y]);
      x = ctrX - Math.sin(theta) * dist;
      result.push([x, y]);
    }

    return result;
  }

  function drawLine(x1, y1, x2, y2) {
    let startPoints = getSymmetryPoints(x1, y1);
    let endPoints = getSymmetryPoints(x2, y2);

    for (var i = 0; i < startPoints.length; i++) {
      ctx = ctxRef.current
      ctx.beginPath()
      ctx.imageSmoothingEnabled = false
      ctx.lineWidth = Number(slider2)
      ctx.strokeStyle = color
      ctx.lineCap = "round"
      ctx.moveTo(Math.floor(startPoints[i][0]), Math.floor(startPoints[i][1]))
      ctx.lineTo(Math.floor(endPoints[i][0]), Math.floor(endPoints[i][1]))
      ctx.stroke()
    }

    ctx.stroke();
  }

  function getLocalCoordinates(ev) {
    if (ev.type == "touchstart") {
      var touch = ev.touches[0] || ev.changedTouches[0];
      var realTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      ev.offsetX = touch.clientX - realTarget.getBoundingClientRect().x;
      ev.offsetY = touch.clientY - realTarget.getBoundingClientRect().y;
    }
    const rect = chartRef.current.getBoundingClientRect()
    return [ev.clientX - rect.left + 0.5, ev.clientY - rect.top + 0.5];
  }

  function draw(e) {
    var coord = getLocalCoordinates(e);
    // console.log(" getLocalCoordinates[0] " + coord[0]);

    var x = coord[0];
    var y = coord[1];

    // (2 * Math.PI) / 16

    ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = Number(slider2)

    if (e.buttons == 1) {
      drawLine(prevX, prevY, x, y)
    } else if (e.type == "click") {
      prevX = x
      prevY = y
      drawLine(prevX, prevY, x, y)
    }
    prevX = x
    prevY = y
  }

  function randomDraw() {
    let ctx = ctxRef.current
    let holdColor = color
    // the user can draw the outline in any color they like but autodraw is black
    color = 'black'
    if (ctx) {
      // four styles of random mandala
      let randNum = Math.random()
      if (randNum < 0.2) {
        // spiral style
        ctx.strokeStyle = color
        let endx = xCenter
        let endy = xCenter
        let angle = 0
        for (let i = 0; i < 6; i++) {
          // draw the center and then move out a bit
          if (i === 1 || i === 2) {
            continue
          }
          let step = (i + 1) * 30 + (i + 1) * 10 * Math.random()
          let startx = 0
          let starty = 0
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
      } else if (Math.random() < 0.2) {
        // just a bunch of straight lines style
        ctx.strokeStyle = color
        let offset = 40 * Math.random()
        drawLine(offset, xCenter - offset, xCenter, xCenter - offset)
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
          drawLine(startx, starty, startx + offset, Math.abs(width - starty))
        }
      } else if (Math.random() < 0.5) {
        // interlocking crossing lines style
        let workfactor = 12
        let ifactor = 2
        let startx = 0
        let starty = 0
        for(let i = 0; i < workfactor - 3; i++) {
          ctx.strokeStyle = color
          // draw in the center to start, then push towards the edges
          let useifactor = 0
          let endx = 0
          let endy = 0
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
          if (endy > width - edgekeep) {
            endy = width - edgekeep
          }
          drawLine(startx, starty, endx, endy)
        }
      } else {
        // push from the edge to the center style
        let yLocn = 20
        let xLocn = xCenter
        let yStep = 12
        let currentStart = [xCenter, 5]
        // vary the step size for a more organic feel
        let stepSize = 0.25
        for(yLocn; yLocn < xCenter - 5; yLocn += yStep * 2 * Math.random() - yStep / 6) {
          let wideFactor = (xCenter - yLocn) * 2 * Math.PI / Number(slider1) * 1.5
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
    color = holdColor
  }


  // that's kind of a kludge, there's already a useEffect for myPalette in ColorChooser why isn't it updating?
  useEffect(() => {setMyLightDark(myLightDark === 0 ? 1 : 0)}, [myPalette])

  return (
    <>
      <div data-bs-theme={'dark'} className="justify-content-center align-items-center min-vh-100">
      <Container>
      <Row>
      <Col className='text-center'>
      <div
          id="drawCanvas"
          ref={chartRef}
          onMouseMove={overDraw}
          onTouchStart={draw}
          onClick={overDraw}
          style={{width: '1200px', height: '1200px', backgroundColor: 'white'}}
      >
      </div>
    <Form>
      <Form.Label className="text-white" htmlFor="slider1">Symmetry Degree: {slider1}</Form.Label>
      <Form.Range
          id={"slider1"}
          min={2}
          max={50}
          value={slider1}
          onChange={(e) => handleSlider1Change(e)}
      />
      <Form.Label className="text-white" htmlFor="slider2">Brush Size: {slider2}</Form.Label>
      <Form.Range
          id={"slider2"}
          min={2}
          max={24}
          value={slider2}
          onChange={(e) => handleSlider2Change(e)}
      />      
      <Form.Label className="text-white" htmlFor="slider3">Auto Fill Pattern Repeat: {slider3}</Form.Label>
      <Form.Range
          id={"slider3"}
          min={2}
          max={25}
          value={slider3}
          onChange={(e) => handleSlider3Change(e)}
      />      
    </Form>
    <h2>Click and drag to draw, Control-Click to fill</h2>
    <ColorChooser myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette} setCurrentColor={setCurrentColor} skipPalButton={true}
      handleFileInput={(event) => {return MandalaLib.handleFileInput(event, toastId, myPalette, setMyPalette, myLightDark)}} />
    <div>
      <div style={{display: 'inline-block'}}>
        <Button onClick={resetCanvas}>Reset Canvas</Button> 
      </div>
      <div style={{display: 'inline-block', marginLeft: '20px'}}>
        <Button onClick={randomDraw}>Random Mandala</Button>
      </div>
      <div style={{display: 'inline-block', marginLeft: '20px'}}>
        <Button onClick={autoFill}>Automatically Fill Areas</Button>
      </div>
    </div>
    <h2>Choose fill behavior:</h2>
    <ToggleButtonGroup type="radio" name="radioGroup" defaultValue="fillAll" onChange={handleRadioChange}>
      <ToggleButton
        id="allselect"
        value="fillAll"
        variant="outline-primary">
      Color all symmetrical</ToggleButton>
      <ToggleButton
        id="halfselect"
        value="fillHalf"
        variant="outline-primary">
      Color every other symmetrical</ToggleButton>
      <ToggleButton
        id="oneselect"
        value="fillOne"
        variant="outline-primary">
      Color One</ToggleButton>
    </ToggleButtonGroup>
    </Col>
    </Row>
    </Container>
    </div>
    </>
  )
}

export default JustMandala;
