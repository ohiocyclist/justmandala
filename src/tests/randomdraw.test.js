import { randomDraw } from '../randomdraw';
import { getMandalaHelpers } from '../getlocalcoordinates';
import { drawLine } from '../draw';

jest.mock('../draw', () => ({
  drawLine: jest.fn(),
}))

jest.mock('../getlocalcoordinates', () => {
  const actual = jest.requireActual('../getlocalcoordinates.js');  
  
  return {
    getMandalaHelpers: {
      ...actual.getMandalaHelpers,
      getLocalCoordinates: jest.fn(),
      getSymmetryPoints: jest.fn(),
      euclidDistance: (x, y, w, z) => Math.sqrt(Math.pow((x - w), 2) + Math.pow((y - z), 2)), // not mocking this one
      //getLocalCoordinates: actual.getMandalaHelpers.getLocalCoordinates
    }
  }
});

function mockCtx() {
  return {
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    lineWidth: 0,
    strokeStyle: '',
    lineCap: '',
    imageSmoothingEnabled: false,
  };
}

describe('randomDraw', () => {
  it('runs without throwing and calls drawLine at least once per 8 random mandalas', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    // Force predictable randomness
    for (let i = 0; i < 8; i++) {
      jest.spyOn(Math, 'random').mockReturnValue((i) / 8)

      getMandalaHelpers.getSymmetryPoints.mockReturnValue([[10, 10]])

      expect(() =>
        randomDraw(400, 8, 4, ctxRef, 'purple')
      ).not.toThrow()

      expect(drawLine).toHaveBeenCalled()
    }
  })
})
