/**
 * @jest-environment jsdom
 */

jest.mock('../getlocalcoordinates.js', () => ({getMandalaHelpers: {
  getLocalCoordinates: jest.fn(() => [32, 47]),
  getSymmetryPoints: jest.fn(() => [
      [3, 4],
      [6, 4],
      [3, 6],
      [6, 6]
    ]),
  hexToRgb: jest.fn(() => ({ r: 255, g: 0, b: 0 })),
  isWhite: jest.fn(() => true),
  getAdjacentWhite: jest.fn(() => [
      [3, 4],
      [4, 4],
      [3, 5]
    ])
}}))

jest.mock('../fill.js', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../creategrid', () => ({
  createGrid: jest.fn()
}))

import fill from '../fill.js'
import { fillWrap, zoom } from '../zoom.js'
import { getMandalaHelpers } from '../getlocalcoordinates.js'
import { createGrid } from "../creategrid"

describe('zoomfunctions()', () => {
  let ctx, mockImg, mockData

  const thischart = document.createElement("canvas")
  const chartRef = {
    current: thischart}
  const rawData = new Uint8ClampedArray([255, 255, 255, 255, 128, 128, 128, 255])
  const mockImageData = { data: rawData }
  const mockCtx = {
    getImageData: jest.fn().mockReturnValue(mockImageData),
    putImageData: jest.fn(),
    drawImage: jest.fn()
  }
  const canvasRef = {
    current: {getContext: jest.fn(() => mockCtx), drawImage: jest.fn()}}
  const color = '#ff0000'
  const width = 10
  const size = width * width * 4
  const slider1 = 17
  let radioValue = "fillAll"
  mockData = new Uint8ClampedArray(size).fill(255) // all white
  const ctxRef = {
    current: {
      getImageData: jest.fn(() => ({data: mockData})),
      putImageData: jest.fn(),
      drawImage: jest.fn(),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // 10×10 fake canvas
    mockData = new Uint8ClampedArray(size).fill(255) // all white
    // draw a box around the edges.  Function doesn't fill if it touches an edge
    for (let ii = 0; ii < width; ii++) {
      for (let jj = 0; jj < width; jj++) {
        if (ii === 0 || ii === width - 1 || jj === 0 || jj === width - 1) {
          let index = (jj * width + ii) * 4
          mockData[index] = 0
          mockData[index + 1] = 0
          mockData[index + 2] = 0
        }
      }
    }
    mockImg = { data: mockData }

    global.ctx = ctx
    global.symmetry = 10
    global.color = '#ff0000'    
    global.isZoomRef = {current: false}

  })

  const e = {buttons: 0, type: {includes: jest.fn(() => false)}}
  const f = {buttons: 1}
  const g = {type: 'click', clientX: 100, clientY: 150}
  const isZoomRef = {current: false}
  const zoomCanvasRef = {current: {getContext: jest.fn(() => ctxRef.current)}}
  const quxRef = {current: 60}
  const quyRef = {current: 85}
  const symmetrySlider = 16
  
  test('fillWrap gets local coordinates', () => {
    // as defined above
    const x = 32
    const y = 47 
    fillWrap(e, chartRef, ctxRef, color, width, slider1, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef)
    expect(getMandalaHelpers.getLocalCoordinates).toHaveBeenCalled()
    expect(fill).toHaveBeenCalledWith(e, x, y, ctxRef.current, color, width, slider1, radioValue)
  })

  test('fillWrap isZoomTranslate', () => {
    const trueZoomRef = {current: true}
    const x = 76
    const y = 109
    fillWrap(e, chartRef, ctxRef, color, width, slider1, radioValue, trueZoomRef, zoomCanvasRef, quxRef, quyRef)
    expect(zoomCanvasRef.current.getContext).toHaveBeenCalledWith("2d")
    expect(ctxRef.current.drawImage).toHaveBeenCalled()
    expect(fill).toHaveBeenCalledWith(e, x, y, ctxRef.current, color, width, slider1, radioValue)
  })

  test('Zoom Out', () => {
    const trueZoomRef = {current: true}
    zoom(g, trueZoomRef, canvasRef, chartRef, zoomCanvasRef, width, quxRef, quyRef, symmetrySlider)
    expect(quxRef.current).toBe(0)
    expect(quyRef.current).toBe(0)
    expect(trueZoomRef.current).toBe(false)
    expect(createGrid).toHaveBeenCalledWith(chartRef, symmetrySlider, width, isZoomRef, quxRef, quyRef)
    expect(mockCtx.drawImage).toHaveBeenCalledWith(zoomCanvasRef.current, 0, 0, 10, 10, 0, 0, 10, 10)
  })

  test('Zoom In', () => {
    zoom(g, isZoomRef, canvasRef, chartRef, zoomCanvasRef, width, quxRef, quyRef, symmetrySlider)
    expect(quxRef.current).toBe(5)
    expect(quyRef.current).toBe(5)
    expect(isZoomRef.current).toBe(true)
    expect(createGrid).toHaveBeenCalledWith(chartRef, symmetrySlider, width, isZoomRef, quxRef, quyRef)
    expect(mockCtx.drawImage).toHaveBeenCalledWith(zoomCanvasRef.current, 5, 5, 5, 5, 0, 0, 10, 10)
  })

})
