/**
 * @jest-environment jsdom
 */

jest.mock('./getlocalcoordinates.js', () => ({
  getLocalCoordinates: jest.fn(() => [3.2, 4.7]),
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
}))

import fill from './fill.js'
import { getLocalCoordinates, getSymmetryPoints, hexToRgb, isWhite, getAdjacentWhite } from './getlocalcoordinates.js'

describe('fill()', () => {
  let ctx, mockImg, mockData

  const thischart = document.createElement("canvas")
  const chartRef = {
    current: thischart}
  const color = '#ff0000'
  const width = 10
  const size = width * width * 4
  const slider1 = 17
  let radioValue = "fillAll"
  mockData = new Uint8ClampedArray(size).fill(255) // all white
  const ctxRef = {
    current: {
      getImageData: jest.fn(() => ({data: mockData})),
      putImageData: jest.fn()
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

  })

  const e = {buttons: 0}
  const f = {buttons: 1}

  test('does nothing when e.buttons != 1', () => {
    fill(e, chartRef, ctxRef, color, width, slider1, radioValue)
    expect(ctxRef.current.getImageData).not.toHaveBeenCalled()
    expect(ctxRef.current.putImageData).not.toHaveBeenCalled()
  })

  test('gets local coordinates and symmetry points', () => {
    fill(f, chartRef, ctxRef, color, width, slider1, radioValue)
    expect(getLocalCoordinates).toHaveBeenCalled()
    expect(getSymmetryPoints).toHaveBeenCalledWith(3, 4, width, slider1)
  })

  test('fills all adjacent white pixels with chosen color', () => {
    fill(f, chartRef, ctxRef, color, width, slider1, radioValue)

    // check a few pixels
    const i = (4 * symmetry + 3) * 4
    expect(mockData[i]).toBe(255)     // R
    expect(mockData[i + 1]).toBe(0)   // G
    expect(mockData[i + 2]).toBe(0)   // B
    expect(mockData[i + 3]).toBe(255) // A
  })

  test('calls putImageData exactly once', () => {
    fill(f, chartRef, ctxRef, color, width, slider1, radioValue)
    expect(ctxRef.current.putImageData).toHaveBeenCalledTimes(1)
    expect(ctxRef.current.putImageData).toHaveBeenCalledWith(mockImg, 0, 0)
  })

  test('skips 3 out of 4 symmetry points when fillOrOther="other"', () => {
    radioValue = 'fillHalf'
    fill(f, chartRef, ctxRef, color, width, slider1, radioValue)

    // getAdjacentWhite should be called only for idx % 4 == 0
    // with 4 symmetry points, only index 0 should run
    expect(getAdjacentWhite).toHaveBeenCalledTimes(1)
    expect(getAdjacentWhite).toHaveBeenCalledWith(mockData, 3, 4, 10, 10, radioValue)
  })
})