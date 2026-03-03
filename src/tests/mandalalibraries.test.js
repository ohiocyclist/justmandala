/**
 * @jest-environment jsdom
 */

// mandalalibraries.test.js

jest.mock('react-toastify', () => {
  const toast = jest.fn();     // this is the callable toast()
  toast.dismiss = jest.fn();   // attach dismiss()
  return { toast };
});


import { MandalaLib } from '../mandalalibraries.js'
import { toast } from 'react-toastify'

describe("MandalaLib.reshapeArray1D2D", () => {
  test("correctly reshapes 1D → 2D", () => {
    const arr = [1,2,3,4,5,6];
    const result = MandalaLib.reshapeArray1D2D(arr, 2, 3);

    expect(result).toEqual([
      [1,2,3],
      [4,5,6]
    ]);
  });

  test("throws on mismatched size", () => {
    expect(() => 
      MandalaLib.reshapeArray1D2D([1,2,3], 2, 2)
    ).toThrow("The size of the 1D array does not match the dimensions of the 2D array.");
  });
});

describe("MandalaLib.rgbToHex", () => {
  test("converts rgb to hex", () => {
    expect(MandalaLib.rgbToHex(255, 0, 128)).toBe("#FF0080");
    expect(MandalaLib.rgbToHex(0, 0, 0)).toBe("#000000");
    expect(MandalaLib.rgbToHex(17, 34, 51)).toBe("#112233");
  });
});

describe("MandalaLib.increaseGreen", () => {
  test("increases green channel by 50", () => {
    const img = [
      [[10, 10, 10], [20, 200, 20]],
      [[30, 240, 30], [40, 250, 40]]
    ];

    const result = MandalaLib.increaseGreen(img);

    expect(result).toEqual([
      [[10, 60, 10], [20, 250, 20]],
      [[30, 255, 30], [40, 255, 40]]
    ]);
  });
});

describe("MandalaLib.reshapeArray1D3D", () => {
  test("correctly reshapes 1D → 3D", () => {
    const arr = [1,2,3,4,5,6,7,8];
    const result = MandalaLib.reshapeArray1D3D(arr, 2, 2, 2);

    expect(result).toEqual([
      [
        [1,2],
        [3,4]
      ],
      [
        [5,6],
        [7,8]
      ]
    ]);
  });

  test("throws on mismatched size", () => {
    expect(() =>
      MandalaLib.reshapeArray1D3D([1,2,3], 2, 2, 2)
    ).toThrow("The size of the 1D array does not match the dimensions of the 3D array.");
  });
});

describe("MandalaLib.repeatArray", () => {
  test("repeats array N times", () => {
    expect(MandalaLib.repeatArray([1,2], 3)).toEqual([1,2,1,2,1,2]);
  });

  test("repeating zero times returns empty array", () => {
    expect(MandalaLib.repeatArray([1,2], 0)).toEqual([]);
  });
});

describe("MandalaLib.loadImageArrayToCanvas", () => {
  beforeAll(() => {
    ImageData = jest.fn(() => [0,0,0,0])    
    // jsdom canvas mock
    global.HTMLCanvasElement.prototype.getContext = () => ({
      putImageData: jest.fn()
    });
  });

  test("creates a canvas with correct dimensions for dims=3", () => {
    const img = [
      [[255,0,0,255], [0,255,0,255]],
      [[0,0,255,255], [255,255,0,255]]
    ];

    const canvas = MandalaLib.loadImageArrayToCanvas(img, 3);

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);
    expect(ImageData).toHaveBeenCalled()
  });

  test("creates a canvas with correct dimensions for dims=2", () => {
    const img = new Array(9).fill([255,0,0,255]); // 3×3
    const canvas = MandalaLib.loadImageArrayToCanvas(img, 2);

    expect(canvas.width).toBe(3);
    expect(canvas.height).toBe(3);
    expect(ImageData).toHaveBeenCalled()
  });
});

// Mock kmeans
jest.mock("ml-kmeans", () => ({
  kmeans: jest.fn(() => ({
    centroids: [
      [10, 20, 30],
      [100, 150, 200]
    ],
    clusters: [0, 1, 0, 1]
  }))
}))
import { kmeans } from 'ml-kmeans'

// Mock canvas + context
function createMockCanvas() {
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(300 * 300 * 4)
      })),
      putImageData: jest.fn()
    }),
    toDataURL: () => "data:image/png;base64,FAKE"
  }
}
global.document.createElement = jest.fn((tag) => {
  if (tag === "canvas") return createMockCanvas()
  return { style: {} }
})

// Mock Image
class MockImage {
  constructor() {
    setTimeout(() => this.onload && this.onload(), 0)
  }
  set src(v) {}
}
global.Image = MockImage

// Mock FileReader
class MockFileReader {
  readAsDataURL() {
    setTimeout(() => {
      this.onload({ target: { result: "data:image/png;base64,FAKE" } })
    }, 0)
  }
}
global.FileReader = MockFileReader

describe("MandalaLib.handleFileInput", () => {
  let setMyPalette
  let event
  let toastId

  beforeEach(() => {
    jest.clearAllMocks()

    setMyPalette = jest.fn()

    ImageData = jest.fn(() => [0,0,0,0])

    toastId = { current: "Has Toast" }

    document.body.innerHTML = `
      <div id="targetIMG"></div>
    `

    event = {
      target: {
        files: [new Blob(["fake"], { type: "image/png" })]
      }
    }
  })

  test("reads file, processes image, updates palette, and writes output image", async () => {
    await MandalaLib.handleFileInput(
      event,
      toastId,
      "[]",
      setMyPalette,
      false
    )

    await new Promise((res) => setTimeout(res, 20))

    expect(kmeans).toHaveBeenCalled()

    expect(setMyPalette).toHaveBeenCalled()

    const output = document.getElementById("targetIMG").innerHTML
    expect(output).toContain("<img src=\"data:image/png;base64,FAKE\">")
    expect(toast).toHaveBeenCalledWith('The Magic of color extraction will only be a moment....', {"theme": "light"})
  })

})