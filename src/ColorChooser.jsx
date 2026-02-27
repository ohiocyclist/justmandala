import React, { useRef, useState, useEffect } from 'react'
import { Button, Row, Col, Form } from 'react-bootstrap'
import { HexColorPicker } from 'react-colorful'

function ColorChooser({ myPalette, setMyPalette, myLightDark, handleFileInput, setCurrentColor, skipPalButton}) {

  const [selectedColor, setSelectedColor] = useState(0)
  const [borderColor, setBorderColor] = useState('white')  
  const [colors, setColors] = useState([
    "#68840D",
    "#4BB329",
    "#993030",
    "#986209",
    "#0D7052",
    "#590D06",
    "#5A4906",
    "#668044",
    "#C1A355",
    "#C99605",
    "#30BAB2",
    "#1D3612",
    "#36086A",
    "#959F4B",
    "#B3942C",
    "#530102",
    "#0233B9",
    "#94C40D",
    "#4D5C03",
    "#90C1F9",
    "#025001",
    "#F6DE01",
    "#72408F",
    "#06B1E0",
    "#1F1572"
  ])

  const fileInputRef = useRef()
  const newSelectColor = (idx) => {
    setSelectedColor(idx)
    if (setCurrentColor) {
      setCurrentColor(colors[idx])
    }
    if (skipPalButton) {
      resetPalette()
    }
  }

  useEffect(() => {
    if (myPalette) {
        let usePalette = decodeURIComponent(myPalette)
        if (usePalette.charAt(0) !== '[') {
            usePalette = usePalette.substring(1, usePalette.length - 1)
        }
        usePalette = JSON.parse(usePalette)
        let prevColors = colors
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
            setColors(prevColors)
        }
    }
  }, [myPalette])

  const updateColor = (index, newColor) => {
    setColors((prevColors) =>
      prevColors.map((color, i) => (i === index ? newColor : color))
    )
    if (setCurrentColor) {
      setCurrentColor(newColor)
    }
  }

  const resetPalette = () => {
    let newvals = JSON.stringify(colors)
    newvals = encodeURIComponent(newvals)
    setMyPalette(newvals)
  }

  useEffect( () => {
    if (myLightDark === 0) {
      setBorderColor('lime')
    } else {
      setBorderColor('white')
    }
  }, [myLightDark])

  useEffect( () => {
    if (setCurrentColor) {
      setCurrentColor(colors[0])
    }
    if (skipPalButton) {
      resetPalette()
    }
  }, [colors])

  return <>
    <h1>Select Mandala Colors:</h1>
    <Row className="justify-content-center">
      <Col>
          <div key='swatch' style={{ width: "210px", height: "230px", marginTop: "20px" }}>
            <HexColorPicker
              style={{height: '200px', width: '200px'}}
              color={colors[selectedColor]}
              onChange={(newColor) => updateColor(selectedColor, newColor)}
            />
            <div key={`swatch-selector`} style={{backgroundColor: colors[selectedColor], height: "40px", width: "200px", marginBottom: "10px"}} >  </div>
          </div>
      </Col>
      <Col>
        <Row id='colorgrid' style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {colors.map((color, index) => (
            <Col key={`colorbuttonholder-${index}`}>
            <Button key={`ColorButtons-${index}`} onClick={() => newSelectColor(index)} style={{backgroundColor: color, width: ((index == selectedColor) && `60px`) || '50px', 
              height: ((index == selectedColor) && `60px`) || '50px', border: ((index == selectedColor) && `6px solid ${borderColor}`) || ('0px'), marginBottom: "10px"}} />
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
    {!skipPalButton && <Button onClick={resetPalette}>Update Palette</Button>  }
    <Row className="justify-content-center">
      <Form.Label><h3>Choose Colors from a file:</h3></Form.Label>
      <div style={{ textAlign: 'center', width: '80%'}} >
        <Form.Control accept="image/jpeg,image/png" onChange={handleFileInput} multiple={false} ref={fileInputRef}
            type={'file'} style={{display: 'inline-block', marginLeft: '8%', marginRight: '20%' }} className="form-control" />
      </div>
    </Row>
  </>
}

export default ColorChooser;
