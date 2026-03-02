/**
 * @jest-environment jsdom
 */

import { getLocalCoordinates, getSymmetryPoints, hexToRgb, isWhite, getAdjacentWhite } from "./getlocalcoordinates.js";

describe("getLocalCoordinates", () => {
  let chartRef;

  beforeEach(() => {
    // mock chartRef with a DOM element
    const div = document.createElement("div");
    div.getBoundingClientRect = () => ({
      left: 100,
      top: 200,
      width: 300,
      height: 300
    });
    chartRef = { current: div };
  });

  test("returns correct coordinates for mouse events", () => {
    const ev = { clientX: 150, clientY: 250, type: "mousemove" };
    const result = getLocalCoordinates(ev, chartRef);

    expect(result).toEqual([50 + 0.5, 50 + 0.5]); // (150-100, 250-200)
  });

  test("handles touch events by computing offsetX/Y", () => {
    // mock elementFromPoint
    const fakeTarget = document.createElement("div");
    fakeTarget.getBoundingClientRect = () => ({ x: 10, y: 20 });

    document.elementFromPoint = jest.fn(() => fakeTarget);

    const touch = { clientX: 200, clientY: 300 };
    const ev = {
      type: "touchstart",
      touches: [touch],
      changedTouches: [],
      clientX: 200,
      clientY: 300
    };

    const result = getLocalCoordinates(ev, chartRef);

    expect(ev.offsetX).toBe(200 - 10);
    expect(ev.offsetY).toBe(300 - 20);
    expect(result).toEqual([100 + 0.5, 100 + 0.5]); // (200-100, 300-200)
  });
});

describe("getSymmetryPoints", () => {
  test("returns correct number of symmetry points", () => {
    const pts = getSymmetryPoints(150, 150, 300, 4);

    // For each slice: 2 points (normal + mirrored)
    expect(pts.length).toBe(8);
  });

  test("points are symmetric around center", () => {
    const pts = getSymmetryPoints(200, 150, 300, 2);

    const [p1, p2, p3, p4] = pts;

    // First pair should be mirrored horizontally
    expect(p1[0]).toBeCloseTo(300 - p2[0]);
    expect(p1[1]).toBeCloseTo(p2[1]);

    // Second pair should also mirror
    expect(p3[0]).toBeCloseTo(300 - p4[0]);
    expect(p3[1]).toBeCloseTo(p4[1]);
  });
});

describe("hexToRgb", () => {
  test("converts full hex format", () => {
    expect(hexToRgb("#ff8800")).toEqual({ r: 255, g: 136, b: 0 });
  });

  test("converts shorthand hex format", () => {
    expect(hexToRgb("#fa3")).toEqual({ r: 255, g: 170, b: 51 });
  });

  test("works without # prefix", () => {
    expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe("isWhite", () => {
  test("returns true for white-ish values", () => {
    expect(isWhite({ r: 220, g: 220, b: 220, a: 255 })).toBe(true);
  });

  test("returns false for darker values", () => {
    expect(isWhite({ r: 200, g: 200, b: 200, a: 255 })).toBe(false);
  });

  test("ignores alpha channel", () => {
    expect(isWhite({ r: 230, g: 230, b: 230, a: 0 })).toBe(true);
  });
});

describe("getAdjacentWhite", () => {
  test("flood-fills all connected white pixels (default mode)", () => {
    // 4×4 grid, RGBA per pixel
    // W = white (255,255,255), B = black (0,0,0)
    //
    //  W W B B
    //  W W B B
    //  B B W W
    //  B B W W
    //
    const width = 4;
    const height = 4;
    const W = [255, 255, 255, 255];
    const B = [0, 0, 0, 255];

    const pixels = [
      ...W, ...W, ...B, ...B,
      ...W, ...W, ...B, ...B,
      ...B, ...B, ...W, ...W,
      ...B, ...B, ...W, ...W,
    ];

    const result = getAdjacentWhite(pixels, 0, 0, width, height, "white");

    // Expect the top-left 2×2 block only
    expect(result).toEqual(
      expect.arrayContaining([
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ])
    );
    expect(result.length).toBe(4);
  });

  test("does not cross into non-white regions (default mode)", () => {
    const width = 3;
    const height = 3;
    const W = [255, 255, 255, 255];
    const G = [200, 200, 200, 255]; // not white by threshold

    //  W W W
    //  W G W
    //  W W W
    const pixels = [
      ...W, ...W, ...W,
      ...W, ...G, ...W,
      ...W, ...W, ...W,
    ];

    const result = getAdjacentWhite(pixels, 0, 0, width, height, "white");

    // Should NOT include the center pixel (1,1)
    expect(result).not.toContainEqual([1, 1]);
    expect(result.length).toBe(8);
  });

  test("fillOne mode: only matches the exact starting color", () => {
    const width = 3;
    const height = 3;

    const R = [255, 0, 0, 255];
    const G = [0, 255, 0, 255];

    //  R R R
    //  R G R
    //  R R R
    const pixels = [
      ...R, ...R, ...R,
      ...R, ...G, ...R,
      ...R, ...R, ...R,
    ];

    const result = getAdjacentWhite(pixels, 0, 0, width, height, "fillOne");

    // Should include all red pixels but not the green center
    expect(result).not.toContainEqual([1, 1]);
    expect(result.length).toBe(8);
  });

  test("respects bounds and does not crash at edges", () => {
    const width = 2;
    const height = 2;
    const W = [255, 255, 255, 255];

    //  W W
    //  W W
    const pixels = [...W, ...W, ...W, ...W];

    const result = getAdjacentWhite(pixels, 0, 0, width, height, "white");

    expect(result.length).toBe(4);
    expect(result).toEqual(
      expect.arrayContaining([
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ])
    );
  });

  test("starting pixel is included even if isolated", () => {
    const width = 3;
    const height = 3;

    const W = [255, 255, 255, 255];
    const B = [0, 0, 0, 255];

    //  B B B
    //  B W B
    //  B B B
    const pixels = [
      ...B, ...B, ...B,
      ...B, ...W, ...B,
      ...B, ...B, ...B,
    ];

    const result = getAdjacentWhite(pixels, 1, 1, width, height, "white");

    expect(result).toEqual([[1, 1]]);
  });
});