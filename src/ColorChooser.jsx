import React, { useRef, useState, useEffect } from 'react'
import { Button, Row, Col, Form } from 'react-bootstrap'
import { HexColorPicker } from 'react-colorful'

function resetPalette(colors, setMyPalette) {
  let newvals = JSON.stringify(colors.current)
  newvals = encodeURIComponent(newvals)
  setMyPalette(newvals)
}

export function ColorChooser({ myPalette, setMyPalette, myLightDark, handleFileInput, setCurrentColor, skipPalButton, colors, colorHelper, 
  setColorHelper, selectedColor, setSelectedColor}) {

  const [borderColor, setBorderColor] = useState('white')

  useEffect(() => {colors.current = [...colorHelper]}, [colorHelper])

  const fileInputRef = useRef()
  const newSelectColor = (idx) => {
    setSelectedColor(idx)
    if (setCurrentColor) {
      setCurrentColor(colors.current[idx])
    }
    if (skipPalButton) {
      resetPalette(colors, setMyPalette)
    }
  }

  useEffect(() => {
    if (myPalette) {
        let usePalette = decodeURIComponent(myPalette)
        if (usePalette.charAt(0) !== '[') {
            usePalette = usePalette.substring(1, usePalette.length - 1)
        }
        usePalette = JSON.parse(usePalette)
        let prevColors = [...colors.current]
        let anyUpdate = false
        for (let i = 0; i < 25; i++) {
            if (i < usePalette.length) {
                if (prevColors[i] !== usePalette[i]) {
                    anyUpdate = true
                }
                prevColors[i] = usePalette[i]
            }
        }
        if (anyUpdate) {
            colors.current = prevColors
            setColorHelper(prevColors)
            if (setCurrentColor) {
              setCurrentColor(prevColors[selectedColor])
            }
        }
    }
  }, [myPalette])

  useEffect( () => {
    if (myLightDark === 0) {
      setBorderColor('lime')
    } else {
      setBorderColor('white')
    }
  }, [myLightDark])

  // set the color on startup
  useEffect( () => {
    // if myPalette is set to nothing, some things could interpret that as all black
    // always make sure myPalette is set to something (this will ding the URL)
    if (!myPalette) {
      resetPalette(colors, setMyPalette)
    }
    if (setCurrentColor) {
      setCurrentColor(colors.current[0])
    }
  }, [])

  return <>
    <h1>Select Mandala Colors:</h1>
    <Row className="justify-content-center">
      <Col>
          <div key='swatch' style={{ width: "210px", height: "230px", marginTop: "20px" }}>
            <HexColorPicker
              data-testid="color-picker"
              style={{height: '200px', width: '200px'}}
              color={colorHelper[selectedColor]}
              onChange={(newColor) => updateColor(selectedColor, newColor, colors, setColorHelper, setCurrentColor, skipPalButton, setMyPalette)}
            />
            <div key={`swatch-selector`} style={{backgroundColor: colorHelper[selectedColor], height: "40px", width: "200px", marginBottom: "10px"}} >  </div>
          </div>
      </Col>
      <Col>
        <Row id='colorgrid' style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {colorHelper.map((color, index) => (
            <Col key={`colorbuttonholder-${index}`}>
            <Button key={`ColorButtons-${index}`} onClick={() => newSelectColor(index)} style={{backgroundColor: color, width: ((index == selectedColor) && `60px`) || '50px', 
              height: ((index == selectedColor) && `60px`) || '50px', border: ((index == selectedColor) && `6px solid ${borderColor}`) || ('0px'), marginBottom: "10px"}} />
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
    {!skipPalButton && <Button onClick={resetPalette(colors, setMyPalette)}>Update Palette</Button>  }
    <Row className="justify-content-center">
      <Form.Label htmlFor="file-input"><h3>Choose Colors from a file:</h3></Form.Label>
      <div style={{ textAlign: 'center', width: '80%'}} >
        <Form.Control id="file-input" accept="image/jpeg,image/png" onChange={handleFileInput} multiple={false} ref={fileInputRef}
            type={'file'} style={{display: 'inline-block', marginLeft: '8%', marginRight: '20%' }} className="form-control" />
      </div>
    </Row>
  </>
}

export function updateColor (index, newColor, colors, setColorHelper, setCurrentColor, skipPalButton, setMyPalette) {
  // need to update the useRef to avoid a race condition
  colors.current = colors.current.map((color, i) => (i === index ? newColor : color))
  setColorHelper(colors.current)
  if (setCurrentColor) {
    setCurrentColor(newColor)
  }
  if (skipPalButton) {
    resetPalette(colors, setMyPalette)
  }
}
