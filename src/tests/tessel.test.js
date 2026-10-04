import { JSDOM } from 'jsdom'
import 'jest-canvas-mock'
import { ImageData } from 'canvas'
import { copyRegions, tesselDeTransparency, initializeTesselCanvas, setTesselCanvasProperties, findTesselTransparency } from '../tessel'

global.ImageData = ImageData

describe('tessel test', () => {
  const dom = new JSDOM(`
    <html>
      <body>
        <canvas id="sourceCanvas" width="${16}" height="${16}"></canvas>
        <canvas id="destCanvas" width="${16}" height="${16}"></canvas>
      </body>
    </html>
  `)
  const referenceColors = [100, 150, 200] // Sample R, G, B reference color
  let mockCtx
  let mockTesselCanvas
  let mockImageData
  let mockD3
  let mockCanvasNode
  let width
  const rawData = new Uint8ClampedArray([255, 255, 255, 255, 128, 128, 128, 255])

  beforeEach(() => {
    global.document = dom.window.document
    mockImageData = { data: rawData }

    mockCtx = {
      getImageData: jest.fn().mockReturnValue(mockImageData),
      putImageData: jest.fn(),
      drawImage: jest.fn()
    }

    mockCanvasNode = { id: 'mock-canvas-node' }

    mockTesselCanvas = {
      id: '',
      width: 8,  // needed for findTesselTransparency
      height: 8,
      style: {
        position: '',
        top: '',
        left: '',
        zIndex: '',
        pointerEvents: ''
      }
    }

  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('findTesselTransparency should report the reference color in the upper left corner of the raw data', () => {
    const trace = {'trace': []}
    width = 8
    // 158, 44, 192, 255 -- test leaving non background color pixels transparency alone
    const betterRaw = new Uint8ClampedArray(
        [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 128, 64, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 128, 64, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 158, 44, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 128, 64, 192, 255, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 158, 44, 192, 255, 128, 64, 192, 128, 128, 64, 192, 255, 128, 64, 192, 255, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    // this tests setting the background color to transparent
    const expectedOut = new Uint8ClampedArray(
        [
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
        128, 64, 192, 0, 128, 64, 192, 0, 128, 64, 192, 0, 128, 64, 192, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0, 128, 64, 192, 0, 128, 64, 192, 0, 128, 64, 192, 0, 128, 64, 192, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0, 158, 44, 192, 255, 128, 64, 192, 0,
        128, 64, 192, 0, 128, 64, 192, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
        158, 44, 192, 255, 128, 64, 192, 0, 128, 64, 192, 0, 128, 64, 192, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0,
          0,  0,   0, 0,   0,  0,   0, 0,   0,  0,   0, 0, 0,  0,   0, 0
        ]
        
    )
    const mockNewImage = { data: betterRaw }

    const mockNewCtx = {
      getImageData: jest.fn().mockReturnValue(mockNewImage),
      putImageData: jest.fn(),
      drawImage: jest.fn()
    }
    let referenceNewColors = findTesselTransparency(mockNewCtx, mockTesselCanvas, width, trace)
    expect(referenceNewColors).toEqual([128, 64, 192]) // matching the data we provided
    expect(mockNewCtx.putImageData).toHaveBeenCalledWith(mockNewImage, 0, 0)
    const callArg = mockNewCtx.putImageData.mock.calls[0][0];

    const actualDataArray = Array.from(callArg.data);
    const expectedDataArray = Array.from(expectedOut);
    //console.dir(actualDataArray, { 'maxArrayLength': null})

    expect(actualDataArray).toEqual(expectedDataArray);

  })

  test('setTesselCanvasProperties should correctly configure canvas properties, styles, and append it to the ref container', () => {
    let mockHideRef
    const canvasName = 'my-tessel-canvas'
    const zIndex = '10'
    const width = 501 // Using an odd number to verify Math.floor calculation
    mockHideRef = {
      current: {
        appendChild: jest.fn()
      }
    }
    // Run the function
    setTesselCanvasProperties(mockTesselCanvas, mockHideRef, canvasName, zIndex, width)

    // --- 1. Verify Element Attribute Mutations ---
    expect(mockTesselCanvas.id).toBe(canvasName)
    
    // Math.floor(501 / 2) should be 250
    expect(mockTesselCanvas.width).toBe(250)
    expect(mockTesselCanvas.height).toBe(250)

    // --- 2. Verify Style Applications ---
    expect(mockTesselCanvas.style.position).toBe('absolute')
    expect(mockTesselCanvas.style.top).toBe('0')
    expect(mockTesselCanvas.style.left).toBe('0')
    expect(mockTesselCanvas.style.zIndex).toBe(zIndex)
    expect(mockTesselCanvas.style.pointerEvents).toBe('none')

    // --- 3. Verify Ref Appending ---
    expect(mockHideRef.current.appendChild).toHaveBeenCalledTimes(1)
    expect(mockHideRef.current.appendChild).toHaveBeenCalledWith(mockTesselCanvas)
  })

  test('should fill fully transparent pixels with reference colors and set all alphas to 255', () => {
    width = 4
    const rawData = new Uint8ClampedArray([
      0, 0, 0, 0,       
      0, 0, 0, 50,      
      255, 0, 0, 255,   
      0, 255, 0, 0      
    ])

    mockImageData = {
      data: rawData
    }

    let mockContext = {
      getImageData: jest.fn().mockReturnValue(mockImageData),
      putImageData: jest.fn()
    }
    tesselDeTransparency(mockContext, referenceColors, width, null)

    expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 2, 2)

    const finalData = Array.from(mockImageData.data)

    const expectedData = [
      // Pixel 0: Was fully transparent -> filled with reference color + 255 alpha
      100, 150, 200, 255,
      // Pixel 1: Had alpha 50 -> left black, alpha forced to 255
      0, 0, 0, 255,
      // Pixel 2: Was solid red -> unchanged
      255, 0, 0, 255,
      // Pixel 3: Had green content but 0 alpha -> left green, alpha forced to 255
      0, 255, 0, 255
    ]

    expect(finalData).toEqual(expectedData)

    expect(mockContext.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0)
  })

  test('should clear the canvas to zeros and draw the correct cropped/scaled variations', () => {
    width = 100
    const mockSelection = {
      node: jest.fn().mockReturnValue(mockCanvasNode)
    }
    mockD3 = {
      select: jest.fn().mockReturnValue(mockSelection)
    }
    // Run the initialization function
    initializeTesselCanvas(mockD3, mockCtx, width)

    // --- 1. Test Zero Initialization ---
    // Should query the full canvas bounds
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, width, width)
    
    // Ensure every single item in the pixel data array was muted to 0
    const clearedData = Array.from(mockImageData.data)
    expect(clearedData.every(val => val === 0)).toBe(true)
    
    // Ensure it wrote the cleared pixels back out
    expect(mockCtx.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0)

    // --- 2. Test D3 Selector Interaction ---
    // Ensure D3 looks up the exact canvas element id
    expect(mockD3.select).toHaveBeenCalledWith('#drawcanvas')

    // --- 3. Test drawImage Operations ---
    // It should perform exactly two copy/scale draw operations
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(2)

    // First draw call: copy top left 10x10 corner behind everything up to 50% scale
    // Math: width * 0.5 = 50
    expect(mockCtx.drawImage).toHaveBeenNthCalledWith(
      1,
      mockCanvasNode,     // source node
      0, 0, 10, 10,       // sx, sy, sw, sh
      0, 0, 50, 50        // dx, dy, dw, dh
    )

    // Second draw call: copy and shrink the original image
    // Math: width * 0.05 = 5, width * 0.4 = 40
    expect(mockCtx.drawImage).toHaveBeenNthCalledWith(
      2,
      mockCanvasNode,     // source node
      0, 0, 100, 100,     // sx, sy, sw, sh
      5, 5, 40, 40        // dx, dy, dw, dh
    )
  })

  it('copies regions from source canvas to destination context', () => {
    //const sourceCanvas = document.getElementById('sourceCanvas')
    //const destCanvas = document.getElementById('destCanvas')
    const sourceCanvas = dom.window.document.querySelectorAll('canvas')[0]
    const destCanvas = dom.window.document.querySelectorAll('canvas')[0]
    const destContext = destCanvas.getContext('2d')

    // Set up mock data
    const imageData = new Uint8ClampedArray(16 * 16 * 4); // assuming 32-bit RGBA images
    for (let i = 0; i < imageData.length; i++) {
      imageData[i] = 0
    }
    for (let i = 4; i < 12; i++) {
        for (let j = 4; j < 12; j++) {
            const locn = i * 4 + j * 4 * 16
            imageData[locn] = 255
            imageData[locn + 1] = 128
            imageData[locn + 2] = 64
            imageData[locn + 3] = 255
        }
    }
    sourceCanvas.width = 16
    sourceCanvas.height = 16
    sourceCanvas.getContext('2d').putImageData(new ImageData(imageData, 16, 16), 0, 0)

    const width = 16

    // Call the function under test
    copyRegions(sourceCanvas, destContext, width)

    // Verify that the destination context has been modified correctly  
    const actualData = Array.from(destContext.getImageData(0, 0, 16, 16).data)
    //console.dir(actualData, { 'maxArrayLength': null})
    const expectedData =       [
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255,
        255, 128, 64, 255, 255, 128, 64, 255,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0,   0,   0,  0,   0,   0,   0,  0,   0,
          0,   0,  0,   0
      ]
    //console.log('expected', expectedData)

    expect(actualData).toEqual(expectedData)
  })
})
