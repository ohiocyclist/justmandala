/**
 * @jest-environment jsdom
 */

import { autoFill } from '../autoFill.js';

// Mock imported helper functions
jest.mock('../getlocalcoordinates.js', () => {
  const actual = jest.requireActual('../getlocalcoordinates.js');

  return {
    getMandalaHelpers: {
      ...actual.getMandalaHelpers,   // keep all real methods
      getSymmetryPoints: jest.fn(),
      isWhite: jest.fn(),
      getAdjacentWhite: jest.fn(),
      hexToRgb: jest.fn(),
      euclidDistance: jest.fn()
    }
  };
});

import {
  getMandalaHelpers
} from '../getlocalcoordinates.js';

describe("getFillableAreas", () => {
  test("collects fillable areas when white pixels are found", () => {
    const width = 10;
    const slider1 = 5;
    const radioValue = 'fillHalf';

    // Fake image data (RGBA)
    const bgdata = new Uint8ClampedArray(width * width * 4).fill(255);

    // edge exclusion
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < width; i++) {
        let idx = 0
        if (j === 0) {
          idx = i * 4
        } else if (j === 1) {
          idx = (i + width * (width - 1)) * 4
        } else if (j === 2) {
          idx = (width * i) * 4
        } else {
          idx = (width * i + width - 1) * 4
        }
        bgdata[idx] = 0
        bgdata[idx + 1] = 0
        bgdata[idx + 1] = 0
      }
    }

    // Mock euclid distance
    getMandalaHelpers.euclidDistance.mockReturnValue(2)

    // Mock symmetry points → always return one point
    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[5, 5], [4, 6], [5, 6], [4, 5]]);

    // Mock white detection → always white
    getMandalaHelpers.isWhite.mockReturnValue(true);

    // Mock adjacency → return a small cluster
    getMandalaHelpers.getAdjacentWhite.mockReturnValue([[4, 5], [5, 5], [6, 5]]);

    const fillableAreas = [];
    autoFill.getAllFillable(width, slider1, 'none', bgdata, fillableAreas);

    expect(fillableAreas.length).toBeGreaterThan(0);
    const thecompare = [...fillableAreas[0][0]].slice(0, 6)
    console.log('thecompare', thecompare)
    expect(thecompare).toEqual([8, 1, 7, 1, 6, 1]);
  });

  test("does not add areas that touch excluded corners", () => {
    const width = 10;
    const slider1 = 5;
    const radioValue = 1;

    const bgdata = new Uint8ClampedArray(width * width * 4).fill(255);

    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[5, 5], [5, 6], [6, 5], [6, 6]]);
    getMandalaHelpers.isWhite.mockReturnValue(true);

    // Adjacent area includes a forbidden corner
    getMandalaHelpers.getAdjacentWhite.mockReturnValue([[5, 5], [5, 6], [6, 5], [6, 6]]);

    const fillableAreas = [];
    autoFill.getAllFillable(width, slider1, bgdata, fillableAreas);

    expect(fillableAreas.length).toBe(0);
  });
});

describe("stepThroughFillables", () => {
  test("fills image data with palette and altpalette colors", () => {
    const width = 10;

    const img2 = {
      data: new Uint8ClampedArray(width * width * 4).fill(0)
    };

    const fillableAreas = [
      [[1, 1], [2, 1]],
      [[3, 3]]
    ];

    const palArr = ["#ff0000", "#00ff00", "#ff00ff", "#00ffff", "#0000FF", "#FF8080"];

    getMandalaHelpers.hexToRgb.mockImplementation(hex => {
      if (hex === "#ff0000") return { r: 255, g: 0, b: 0 };
      if (hex === "#00ff00") return { r: 0, g: 255, b: 0 };
      if (hex === "#FF8080") return { r: 255, g: 128, b: 128};
    });

    global.slider3 = 10; // required by function

    autoFill.stepThroughFillables(img2, fillableAreas, palArr, width, global.slider3);

    const idx1 = (1 * width + 1) * 4;
    expect(img2.data[idx1]).toBe(255); // red

    const idx2 = (3 * width + 3) * 4;
    expect(img2.data[idx2 + 1]).toBe(255); // green
  });
});

describe("autoFill", () => {
  test("calls canvas putImageData with modified image", () => {
    const width = 10;
    const slider1 = 5;
    const slider3 = 25;
    const radioValue = 1;
    const palette = encodeURIComponent('["#ff0000"]');

    // Fake canvas context
    const fakeData = new Uint8ClampedArray(width * width * 4).fill(255);

    const ctx = {
      getImageData: jest.fn(() => ({ data: fakeData.slice() })),
      putImageData: jest.fn()
    };

    const ctxRef = { current: ctx };

    // Mock helpers
    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[5, 5]]);
    getMandalaHelpers.isWhite.mockReturnValue(true);
    getMandalaHelpers.getAdjacentWhite.mockReturnValue([[5, 5]]);
    getMandalaHelpers.hexToRgb.mockReturnValue({ r: 255, g: 0, b: 0 });

    const canvasRef = {
      current: {
        toDataURL: jest.fn()
      }
    }

    const undoRef = {
      current: {}
    }

    const tessel = 'none'

    autoFill.autoFill(ctx, width, palette, slider1, slider3, tessel, radioValue);

    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    const finalImg = ctx.putImageData.mock.calls[0][0].data;

    const idx = (5 * width + 5) * 4;
    expect(finalImg[idx]).toBe(255); // red
  });
});

describe('findRootNode', () => {
  const mockEquivs1 = { 'nodeA': 'nodeB', 'nodeC': 'nodeD' };
  const mockEquivs2 = { 'nodeX': 'nodeY', 'nodeZ': 'nodeA', 'nodeW': 'nodeX' };

  beforeEach(() => {
    // You can perform setup if needed
  });

  it('should return the root node for a given id when there are no equivalences', () => {
    expect(autoFill.findRootNode('nodeE', {})).toBe('nodeE');
  });

  it('should find the correct root node with some equivalences', () => {
    const result1 = autoFill.findRootNode('nodeC', mockEquivs1);
    expect(result1).toBe('nodeD');

    const result2 = autoFill.findRootNode('nodeW', mockEquivs2);
    expect(result2).toBe('nodeY');
  });

  it('should perform path compression to optimize the process of finding subsequent roots', () => {
    // Find root node for 'nodeZ' initially
    let starttime = performance.now()
    let editobjs = { ...mockEquivs2, 'nodeA': 'nodeB', 'nodeD': 'nodeC', 'nodeB': 'nodeX' }
    let result = autoFill.findRootNode('nodeZ', editobjs)
    expect(result).toBe('nodeY')
    expect(editobjs['nodeZ']).toBe('nodeY')
    console.log('Node compression starting time', performance.now() - starttime)
    starttime = performance.now()

    // Now finding the same 'nodeZ' should be faster due to path compression
    result = autoFill.findRootNode('nodeZ', { ...mockEquivs2, 'nodeA': 'nodeB', 'nodeD': 'nodeC', 'nodeB': 'nodeX' })
    expect(result).toBe('nodeY')
    console.log('Node compression repeat time', performance.now() - starttime)
  });

  it('should handle deep equivalence chains efficiently', () => {
    const mockDeepEquivs = {};
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        if (i !== j) {
          mockDeepEquivs[`${i}-${j}`] = `${i}-next`;
          mockDeepEquivs[`${i}-next`] = `${i}-final`;
        }
      }
    }

    const root = autoFill.findRootNode(`${30}-final`, mockDeepEquivs);
    expect(root).toBe(`${30}-final`);
  });
});

describe('push real output', () => {
  const areaNumber = 9
  const width = 100
  const equivs = {3: 9, 6: 9, 5: 8, 7: 8}
  let realoutputs = []
  const output = {
    1: [[10, 10], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [1, 2], [1, 12]],
    2: [[1, 10], [1, 2], [2, 2], [3, 3], [4, 4], [2, 1], [3, 10], [1, 13]],
    3: [[2, 10], [1, 3], [2, 3], [3, 4], [4, 5], [3, 1], [3, 12], [1, 14]],
    4: [[3, 10], [1, 4], [2, 4], [3, 5], [4, 6], [4, 1], [3, 14], [1, 15]],
    5: [[4, 10], [1, 5], [2, 5], [3, 6], [4, 7], [5, 1], [3, 16], [1, 16]],
    6: [[5, 10], [1, 6], [2, 6], [3, 7], [4, 8], [6, 1], [3, 18], [1, 17]],
    7: [[6, 10], [1, 7], [2, 7], [3, 8], [4, 9], [7, 1], [3, 20], [1, 18]],
    8: [[7, 10], [1, 8], [2, 8], [3, 9], [4, 10], [8, 1], [3, 22], [1, 19]],
    9: [[8, 10], [1, 9], [2, 9], [3, 10], [4, 11], [9, 1], [3, 24], [1, 20]],
  }

  test('should turn areas into realoutput chains', () => {
    autoFill.pushRealOutput(areaNumber, output, equivs, width, realoutputs)
    expect(realoutputs).toStrictEqual([
      [1,10,1,2,2,2,3,3,4,4,2,1,3,10,1,13,],
      [3,10,1,4,2,4,3,5,4,6,4,1,3,14,1,15,],
      [7,10,1,8,2,8,3,9,4,10,8,1,3,22,1,19,4,10,1,5,2,5,3,6,4,7,5,1,3,16,1,16,6,10,1,7,2,7,3,8,4,9,7,1,3,20,1,18,],
      [8,10,1,9,2,9,3,10,4,11,9,1,3,24,1,20,2,10,1,3,2,3,3,4,4,5,3,1,3,12,1,14,5,10,1,6,2,6,3,7,4,8,6,1,3,18,1,17,]])
  });
});
