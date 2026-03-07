import React from 'react'
import { Button, Form, Row, Col, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import { MandalaLib } from './mandalalibraries'
import ColorChooser from './ColorChooser'
import { autoFill } from './autoFill'
import { randomDraw} from './draw'

export function MandalaControls({slider1, handleSlider1Change, slider2, handleSlider2Change, slider3, handleSlider3Change, myLightDark, myPalette, setMyPalette, setCurrentColor,
    toastId, resetCanvas, ctxRef, color, width, radioValue, handleRadioChange, handleMandalaFileInput, fileInputRef}) {
    return <>
    <Row><Col className='text-center'>
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
      </Col></Row><Row><Col className='text-center'>
    <h2>Click and drag to draw, Control-Click to fill</h2>
    <ColorChooser myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette} setCurrentColor={setCurrentColor} skipPalButton={true}
      handleFileInput={(event) => {return MandalaLib.handleFileInput(event, toastId, myPalette, setMyPalette, myLightDark)}} />
    </Col></Row><Row><Col className='text-center'>
      <div style={{display: 'inline-block'}}>
        <Button onClick={resetCanvas}>Reset Canvas</Button> 
      </div>
      <div style={{display: 'inline-block', marginLeft: '20px'}}>
        <Button onClick={() => {randomDraw(width, slider1, slider2, ctxRef, color)}}>Random Mandala</Button>
      </div>
      <div style={{display: 'inline-block', marginLeft: '20px'}}>
        <Button onClick={() => {autoFill.autoFill(ctxRef, width, myPalette, slider1, slider3, radioValue)}}>Automatically Fill Areas</Button>
      </div>
    </Col></Row><Row><Col className='text-center'>
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
    </Col></Row>
    <Row><Col className='text-center'>
    <Form.Label htmlFor="file-input"><h3>Reload a saved PNG Mandala:</h3></Form.Label>
      <div style={{width: '80%'}}>
        <Form.Control id="file-input" accept="image/png" onChange={handleMandalaFileInput} multiple={false} ref={fileInputRef}
            type={'file'} style={{display: 'inline-block', marginLeft: '21%', marginRight: '25%' }} className="form-control" />
      </div>   </Col></Row> 
    </>
}