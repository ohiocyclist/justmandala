/**
 * @jest-environment jsdom
 */

import { getFillableAreas, stepThroughFillables } from '../autoFill.js';
import autoFill from '../autoFill.js';

// Mock imported helper functions
jest.mock('../getlocalcoordinates.js', () => ({
  getSymmetryPoints: jest.fn(),
  isWhite: jest.fn(),
  getAdjacentWhite: jest.fn(),
  hexToRgb: jest.fn(),
  //getFillableAreas: jest.requireActual('./getlocalcoordinates.js').getFillableAreas,
  //stepThroughFillables: jest.requireActual('./getlocalcoordinates.js').stepThroughFillables
}));

import {
  getSymmetryPoints,
  isWhite,
  getAdjacentWhite,
  hexToRgb
} from '../getlocalcoordinates.js';

describe("getFillableAreas", () => {
  test("collects fillable areas when white pixels are found", () => {
    const width = 10;
    const slider1 = 5;
    const radioValue = 'fillHalf';

    // Fake image data (RGBA)
    const bgdata = new Uint8ClampedArray(width * width * 4).fill(255);

    // Mock symmetry points → always return one point
    getSymmetryPoints.mockReturnValue([[5, 5]]);

    // Mock white detection → always white
    isWhite.mockReturnValue(true);

    // Mock adjacency → return a small cluster
    getAdjacentWhite.mockReturnValue([[5, 5], [6, 5]]);

    const fillableAreas = [];
    getFillableAreas(width, slider1, bgdata, fillableAreas, radioValue);

    expect(fillableAreas.length).toBeGreaterThan(0);
    expect(fillableAreas[0]).toEqual([[5, 5], [6, 5]]);
  });

  test("does not add areas that touch excluded corners", () => {
    const width = 10;
    const slider1 = 5;
    const radioValue = 1;

    const bgdata = new Uint8ClampedArray(width * width * 4).fill(255);

    getSymmetryPoints.mockReturnValue([[0, 0]]);
    isWhite.mockReturnValue(true);

    // Adjacent area includes a forbidden corner
    getAdjacentWhite.mockReturnValue([[0, 0]]);

    const fillableAreas = [];
    getFillableAreas(width, slider1, bgdata, fillableAreas, radioValue);

    expect(fillableAreas.length).toBe(0);
  });
});

describe("stepThroughFillables", () => {
  test("fills image data with palette colors", () => {
    const width = 10;

    const img2 = {
      data: new Uint8ClampedArray(width * width * 4).fill(0)
    };

    const fillableAreas = [
      [[1, 1], [2, 1]],
      [[3, 3]]
    ];

    const palArr = ["#ff0000", "#00ff00"];

    hexToRgb.mockImplementation(hex => {
      if (hex === "#ff0000") return { r: 255, g: 0, b: 0 };
      if (hex === "#00ff00") return { r: 0, g: 255, b: 0 };
    });

    global.slider3 = 10; // required by function

    stepThroughFillables(img2, fillableAreas, palArr, width, global.slider3);

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
    getSymmetryPoints.mockReturnValue([[5, 5]]);
    isWhite.mockReturnValue(true);
    getAdjacentWhite.mockReturnValue([[5, 5]]);
    hexToRgb.mockReturnValue({ r: 255, g: 0, b: 0 });

    autoFill(ctxRef, width, palette, slider1, radioValue);

    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    const finalImg = ctx.putImageData.mock.calls[0][0].data;

    const idx = (5 * width + 5) * 4;
    expect(finalImg[idx]).toBe(255); // red
  });
});
