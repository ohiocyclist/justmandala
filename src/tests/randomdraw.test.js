import { randomDraw } from '../randomdraw';
import { getMandalaHelpers } from '../getlocalcoordinates';
import { drawLine } from '../draw';

jest.mock('../draw', () => ({
  drawLine: jest.fn(),
}))

jest.mock('../getlocalcoordinates', () => {
  const actual = jest.requireActual('../getlocalcoordinates.js')
  //const actualHelpers = actual.getMandalaHelpers()
  const euclidDistance = actual.getMandalaHelpers.euclidDistance
  
  return {
    getMandalaHelpers: {
      ...actual.getMandalaHelpers,
      euclidDistance,
      getLocalCoordinates: jest.fn(),
      getSymmetryPoints: jest.fn(),
      //getLocalCoordinates: actual.getMandalaHelpers.getLocalCoordinates
    }
  }
});

function mockCtx() {
  return {
    arc: jest.fn(),
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
    const ctx = mockCtx()
    const ctxRef = { current: ctx }

    // Force predictable randomness
    for (let i = 0; i < 10; i++) {
      jest.spyOn(Math, 'random').mockReturnValue((i) / 10 + 0.05)

      getMandalaHelpers.getSymmetryPoints.mockReturnValue([[10, 10]])

      expect(() =>
        randomDraw(400, 8, 4, ctx, 'purple')
      ).not.toThrow()

      expect(drawLine).toHaveBeenCalled()
    }
  })
})
