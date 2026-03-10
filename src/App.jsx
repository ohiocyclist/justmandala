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
  const chartRef = useRef(null)
  const ctxRef = useRef(null)
  const topCtxRef = useRef(null)
  const slider1Default = withDefault(NumberParam, 17)
  const [slider1, setSlider1] = useQueryParam('Symmetry', slider1Default)
  const slider2Default = withDefault(NumberParam, 4)
  const [slider2, setSlider2] = useQueryParam('Brushsize', slider2Default)
  const slider3Default = withDefault(NumberParam, 16)
  const [slider3, setSlider3] = useQueryParam('AutoRepeat', slider3Default)
  const myLightDark = 0
  const toastId = ''
  const paletteDefault = withDefault(StringParam,'')
  const [myPalette, setMyPalette] = useQueryParam('palette', paletteDefault)  
  const [currentColor, setCurrentColor] = useState('')
  const fillDefault = withDefault(StringParam, 'fillAll')
  const [radioValue, setRadioValue] = useQueryParam('fillstyle', fillDefault)
  const prevXY = useRef([[400, 400]])
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef()  
  const undoRef = useRef()
  const canvasRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const drawFill = useRef('draw')
  const [width, setWidth] = useState(() => {if (window.innerWidth > window.innerHeight) {
      return window.innerHeight - 120
    } else {
      return window.innerWidth - 60
    }})

  let color = currentColor

  const resetCanvas = () => {
    let ctx
    d3.select(chartRef.current).selectAll("canvas").remove()
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width
    chartRef.current.style.position = 'relative'
    chartRef.current.appendChild(canvas)
    canvasRef.current = canvas
    ctx = canvas.getContext("2d")
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, width)
    ctxRef.current = ctx
    if (!undoRef.current) {
      undoRef.current = canvas.toDataURL("image/png")
    }
    let topcanvas = document.createElement('canvas')
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
    drawGrid(topCtxRef, width, slider1)
  }

  const handleUndo = () => {
    ctxRef.current.clearRect(0, 0, width, width)
    const img = new Image()
    img.src = undoRef.current
    img.onload = () => {
      ctxRef.current.drawImage(img, 0, 0, width, width)    
    }      
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

  const handleTouchStart = (e) => {
    // clear draw coordinates
    e.preventDefault()
    if (!prevXY.current[0]) {
      var coord = getMandalaHelpers.getLocalCoordinates(e)
      prevXY.current[0] = Math.floor(coord[0])
      prevXY.current[1] = Math.floor(coord[1])
    }
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
    e.preventDefault()
    overDraw(e, canvasRef, undoRef)
  }

  useEffect(() => {
    resetCanvas()
  }, [])

  function overDraw(event, canvasRef, undoRef) {
    if (event.buttons === 1 || event.type.includes("touch")) {
      const now = Date.now()
      if (lastUpdateRef.current === 0 || now - lastUpdateRef.current > 4000) {
        undoRef.current = canvasRef.current.toDataURL("image/png")    
        lastUpdateRef.current = now
      }
    }
    if (event.ctrlKey || drawFill.current === 'fill') {
      fill(event, chartRef, ctxRef, color, width, slider1, radioValue)
    } else {
      draw(event, chartRef, ctxRef, width, slider1, slider2, color, prevXY.current)
    }
  }

  const handleOpen =() => {
    setOpen(!open)
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

  return (
    <>
      <div data-bs-theme={'dark'} className="justify-content-center align-items-center min-vh-100">
      <Container>
      <Row>
        <Col className='text-center'>
        <h1>Symmetry Based Mandalas</h1>
        </Col></Row><Row><Col><p><font color="#FFF">Click and drag to draw, change button to fill, Gridlines in gray are not part of the output, or</font></p></Col>
      <Col className='text-end'>
      <button onClick={handleOpen}>{(open ? 'Hide' : 'Show')} Controls</button>
      </Col></Row><Collapse in={open}>
        <div id="control-drawer">
      <Row><Col className='text-center'>
      <MandalaControls slider1={slider1} handleSlider1Change={handleSlider1Change} slider2={slider2} handleSlider2Change={handleSlider2Change}
        slider3={slider3} handleSlider3Change={handleSlider3Change} myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette}
        setCurrentColor={setCurrentColor} toastId={toastId} resetCanvas={resetCanvas} ctxRef={ctxRef} color={color} width={width}
        radioValue={radioValue} handleRadioChange={handleRadioChange} handleMandalaFileInput={handleMandalaFileInput} fileInputRef={fileInputRef}
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
