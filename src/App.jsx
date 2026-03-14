import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3"
import { useQueryParam, StringParam, withDefault, NumberParam } from 'use-query-params'
import { Container, Row, Col } from 'react-bootstrap'
import "bootstrap/dist/css/bootstrap.min.css"
import fill from './fill'
import { draw, drawGrid } from './draw'
import { getMandalaHelpers } from './getlocalcoordinates'
import Collapse from 'react-bootstrap/Collapse'
import { MandalaControls } from './MandalaControls'
import "./App.css"

function JustMandala() {
  // refs for the drawings.  topCtxRef holds the gridlines, on top of and transparent to the drawing
  const chartRef = useRef(null)
  const ctxRef = useRef(null)
  const topCtxRef = useRef(null)
  // QueryParam set sliders.  Slider 1 is number of points.  Slider 2 is brushsize.  Slider 3 is color repeat
  const slider1Default = withDefault(NumberParam, 17)
  const [symmetrySlider, setSymmetrySlider] = useQueryParam('Symmetry', slider1Default)
  const slider2Default = withDefault(NumberParam, 4)
  const [brushSizeSlider, setBrushSizeSlider] = useQueryParam('Brushsize', slider2Default)
  const slider3Default = withDefault(NumberParam, 16)
  const [autoRepeatSlider, setAutoRepeatSlider] = useQueryParam('AutoRepeat', slider3Default)
  // always in dark mode
  const myLightDark = 0
  // we probably should use toast when autofilling because it's slow, but we don't
  // the extract color from a file library needs at least a toast placeholder.
  const toastId = ''
  // store the entire palette on the URL so we can get it back on reload or trade links
  const paletteDefault = withDefault(StringParam,'')
  const [myPalette, setMyPalette] = useQueryParam('palette', paletteDefault)  
  // the color that is selected
  const [currentColor, setCurrentColor] = useState('')
  // fill options -- all, half, or one. All and Half only overfill white.  One can overfill anything.
  const fillDefault = withDefault(StringParam, 'fillAll')
  const [fillOption, setFillOption] = useQueryParam('fillstyle', fillDefault)
  // last point to connect to when drawing.  400, 400 is always overwritten.
  const prevXY = useRef([[400, 400]])
  // is the control tray open?
  const [trayOpen, setTrayOpen] = useState(false)
  // allow the user to open files
  const fileInputRef = useRef()  
  // allow the user to undo, save the previous state of the image
  const undoRef = useRef()
  const canvasRef = useRef(null)
  const lastUpdateRef = useRef(0)
  // toggle between drawing mode on click/touch and fill mode on click/touch.  Needed since touch can't CTRL-click.
  const drawFill = useRef('draw')
  // set the image size that best matches the target screen
  // run this once on startup.  Don't worry about resizes or rotations, let the user reload if they want
  // choose a size on landscape vs portrait
  const [width, setWidth] = useState(() => {if (window.innerWidth > window.innerHeight) {
      return window.innerHeight - 120
    } else {
      return window.innerWidth - 60
    }})

  let color = currentColor

  const resetCanvas = () => {
    // initialize the canvas for drawing at startup.  Also redo the canvas if the user asks to clear it.
    let ctx
    d3.select(chartRef.current).selectAll("canvas").remove()
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width
    // allow the grid to place overtop
    chartRef.current.style.position = 'relative'
    chartRef.current.appendChild(canvas)
    canvasRef.current = canvas
    ctx = canvas.getContext("2d")
    // put a white rectangle in the back so if the user saves the Mandala it won't be clear to dark mode back there
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, width)
    ctxRef.current = ctx
    // if there is already something in the undo buffer, don't overwrite it with blank.  
    if (!undoRef.current) {
      undoRef.current = canvas.toDataURL("image/png")
    }
    createGrid(symmetrySlider)
  }

  const createGrid = (value) => {
    // allow resetting the grid when changing the symmetry slider to reflect the new symmetry
    // place a canvas atop the other canvas so we can deal independently with the grid and not save it
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
    topCtxRef.current = topCtx
    // react doesn't keep up with the slider1 value for here, we need to keep up for ourselves
    drawGrid(topCtxRef, width, value)
  }

  const handleUndo = () => {
    // undo button pressed.  Revert to the item in the buffer.
    ctxRef.current.clearRect(0, 0, width, width)
    const img = new Image()
    img.src = undoRef.current
    img.onload = () => {
      ctxRef.current.drawImage(img, 0, 0, width, width)    
    }      
  }

  const handleRadioChange = (event) => {
    setFillOption(event)
  }

  const handleSlider1Change = (event) => {
    const value = Number(event.target.value)
    // let the user mix symmetry degrees in one mandala (by not running this)
    //resetCanvas()
    // but do update the grid
    d3.select(chartRef.current).select('#gridcanvas').remove()
    setSymmetrySlider(value)
    createGrid(value)
  }

  // these are simple setter handle functions
  const handleSlider2Change = (event) => {
    const value = Number(event.target.value)
    setBrushSizeSlider(value)
  }

  const handleSlider3Change = (event) => {
    const value = Number(event.target.value)
    setAutoRepeatSlider(value)
  }

  const handleTouchStart = (e) => {
    // clear previous draw coordinates when a touch starts so we don't connect to the previous touch
    e.preventDefault()
    if (!prevXY.current[0]) {
      var coord = getMandalaHelpers.getLocalCoordinates(e)
      prevXY.current[0] = Math.floor(coord[0])
      prevXY.current[1] = Math.floor(coord[1])
    }
    // draw or fill
    overDraw(e, canvasRef, undoRef)
  } //, { passive: false }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!prevXY.current[0]) {
      var coord = getMandalaHelpers.getLocalCoordinates(e)
      prevXY.current[0] = Math.floor(coord[0])
      prevXY.current[1] = Math.floor(coord[1])
    }
    overDraw(e, canvasRef, undoRef)
  } //, { passive: false }

  const handleTouchEnd = (e) => {
    // finish what we started
    e.preventDefault()
    overDraw(e, canvasRef, undoRef)
  }

  // initialize the canvas on startup
  useEffect(() => {
    resetCanvas()
  }, [])

  // choose drawing or filling
  function overDraw(event, canvasRef, undoRef) {
    // reset the undo buffer every 4 seconds.  This is a fallback choice; we'd rather say one fill or one fluid touch/mouse move
    // but the trouble is that the buffer keeps getting set to AFTER the last thing we did rather than before
    // this is random in a bad way; depending on how the user catches that 4 second heartbeat determines how much gets undone
    // and there's no redo function right now.
    if (event.buttons === 1 || event.type.includes("touch") || event.type.includes('click')) {
      const now = Date.now()
      if (lastUpdateRef.current === 0 || now - lastUpdateRef.current > 4000) {
        undoRef.current = canvasRef.current.toDataURL("image/png")    
        lastUpdateRef.current = now
      }
    }
    // always fill on ctrl-click.  Mouse users can ignore if they like the toggle and just click vs ctrl-click.
    if (event.ctrlKey || drawFill.current === 'fill') {
      fill(event, chartRef, ctxRef, color, width, symmetrySlider, fillOption)
    } else {
      draw(event, chartRef, ctxRef, width, symmetrySlider, brushSizeSlider, color, prevXY.current)
    }
  }

  const handleOpen =() => {
    setTrayOpen(!trayOpen)
  }

  const handleMandalaFileInput = async (event) => {
    const selectedFile = event.target.files[0]

    if (selectedFile) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          ctxRef.current.drawImage(img, 0, 0, width, width)    
        }      
      }
      reader.readAsDataURL(selectedFile);
    }
  }

  const handleDrawFillChange = (event) => {
    if (event === 'draw') {
      drawFill.current = 'draw'
    } else {
      drawFill.current = 'fill'
    }
  }

  // the controls are all pushed to a child library.  This is untidy in how many parameters need to be passed, but it shrinks the code here and allows for better
  // unit testing.
  return (
    <>
      <div data-bs-theme={'dark'} className="justify-content-center align-items-center min-vh-100">
      <Container>
      <Row>
        <Col className='text-center'>
        <h1>Symmetry Based Mandalas</h1>
        </Col></Row><Row><Col><p><font color="#FFF">Click and drag to draw, change button to fill, Gridlines in gray are not part of the output, or</font></p></Col>
      <Col className='text-end'>
      <button onClick={handleOpen}>{(trayOpen ? 'Hide' : 'Show')} Controls</button>
      </Col></Row><Collapse in={trayOpen}>
        <div id="control-drawer">
      <Row><Col className='text-center'>
      <MandalaControls slider1={symmetrySlider} handleSlider1Change={handleSlider1Change} slider2={brushSizeSlider} handleSlider2Change={handleSlider2Change}
        slider3={autoRepeatSlider} handleSlider3Change={handleSlider3Change} myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette}
        setCurrentColor={setCurrentColor} toastId={toastId} resetCanvas={resetCanvas} ctxRef={ctxRef} color={color} width={width}
        radioValue={fillOption} handleRadioChange={handleRadioChange} handleMandalaFileInput={handleMandalaFileInput} fileInputRef={fileInputRef}
        handleUndo={handleUndo} canvasRef={canvasRef} undoRef={undoRef} handleDrawFillChange={handleDrawFillChange}
      />
      </Col></Row>
      </div></Collapse>
      <Row><Col className='text-center'>
      <div
          id="drawCanvas"
          ref={chartRef}
          onMouseMove={(e) => {overDraw(e, canvasRef, undoRef)}}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {overDraw(e, canvasRef, undoRef)}}
          className="mx-auto"
          style={{width: `${width}px`, height: `${width}px`, backgroundColor: 'white', marginTop: '20px', display: 'block', touchAction: 'none' }}
      ></div>
    </Col>
    </Row>
    </Container>
    </div>
    </>
  )
}

export default JustMandala;
