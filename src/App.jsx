import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3"
import { useQueryParam, StringParam, withDefault, NumberParam } from 'use-query-params'
import { Container, Row, Col } from 'react-bootstrap'
import "bootstrap/dist/css/bootstrap.min.css"
import fill from './fill'
import { draw } from './draw'
import Collapse from 'react-bootstrap/Collapse'
import { MandalaControls } from './MandalaControls'


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
  const prevXY = useRef([])
  const [open, setOpen] = useState(false)

  let color = currentColor
  // width is square for width and height so setting to height on a landscape
  // display is correct
  const width = window.innerHeight - 100

  const resetCanvas = () => {
    let ctx
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
      fill(event, chartRef, ctxRef, color, width, slider1, radioValue)
    } else {
      draw(event, chartRef, ctxRef, width, slider1, slider2, color, prevXY.current)
    }
  }

  return (
    <>
      <div data-bs-theme={'dark'} className="justify-content-center align-items-center min-vh-100">
      <Container>
      <Row>
        <Col className='text-center'>
        <h1>Symmetry Based Mandalas</h1>
        </Col></Row><Row>
      <Col className='text-end'>
      <button onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} Controls</button>
      </Col></Row><Collapse in={open}>
        <div id="control-drawer">
      <Row><Col className='text-center'>
      <MandalaControls slider1={slider1} handleSlider1Change={handleSlider1Change} slider2={slider2} handleSlider2Change={handleSlider2Change}
        slider3={slider3} handleSlider3Change={handleSlider3Change} myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette}
        setCurrentColor={setCurrentColor} toastId={toastId} resetCanvas={resetCanvas} ctxRef={ctxRef} color={color} width={width}
        radioValue={radioValue} handleRadioChange={handleRadioChange}
      />
      </Col></Row>
      </div></Collapse>
      <Row><Col className='text-center'>
      <div
          id="drawCanvas"
          ref={chartRef}
          onMouseMove={overDraw}
          onTouchStart={() => {draw(event, chartRef, ctxRef, width, slider1, slider2, color, prevXY.current)}}
          onClick={overDraw}
          className="mx-auto"
          style={{width: `${width}px`, height: `${width}px`, backgroundColor: 'white', marginTop: '20px', display: 'block'}}
      >
      </div>
    </Col>
    </Row>
    </Container>
    </div>
    </>
  )
}

export default JustMandala;
