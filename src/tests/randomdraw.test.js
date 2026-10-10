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
  it('runs without throwing and calls drawLine at least once', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    // Force predictable randomness
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[10, 10]]);

    expect(() =>
      randomDraw(200, 4, 2, ctxRef, 'purple')
    ).not.toThrow();

    expect(drawLine).toHaveBeenCalled();
  });
});
