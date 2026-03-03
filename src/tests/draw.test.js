import { drawLine, draw, randomDraw } from '../draw';
import { getLocalCoordinates, getSymmetryPoints } from '../getlocalcoordinates';

jest.mock('../getlocalcoordinates', () => ({
  ...jest.requireActual('../getlocalcoordinates'),
  getLocalCoordinates: jest.fn(),
  getSymmetryPoints: jest.fn(),
}));

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

describe('drawLine', () => {
  it('draws a line for each symmetry point', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    getSymmetryPoints.mockReturnValue([
      [10, 20],
      [30, 40],
    ]);

    drawLine(0, 0, 100, 100, ctxRef, 200, 4, 2, 'red');

    expect(getSymmetryPoints).toHaveBeenCalledTimes(2);
    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    expect(ctx.moveTo).toHaveBeenCalledTimes(2);
    expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).toHaveBeenCalledTimes(3); // 2 inside loop + final stroke()
  });
});

describe('draw', () => {
  it('calls drawLine when mouse is down', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    getLocalCoordinates.mockReturnValue([50, 60]);
    getSymmetryPoints.mockReturnValue([[50, 60]]);

    const prevXY = [10, 20];
    const event = { buttons: 1 };

    draw(event, {}, ctxRef, 200, 4, 2, 'blue', prevXY);

    expect(getLocalCoordinates).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('updates prevXY on click', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    getLocalCoordinates.mockReturnValue([80, 90]);
    getSymmetryPoints.mockReturnValue([[80, 90]]);

    const prevXY = [0, 0];
    const event = { type: 'click' };

    draw(event, {}, ctxRef, 200, 4, 2, 'green', prevXY);

    expect(prevXY).toEqual([80, 90]);
  });
});

describe('randomDraw', () => {
  it('runs without throwing and calls drawLine at least once', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };

    // Force predictable randomness
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    getSymmetryPoints.mockReturnValue([[10, 10]]);

    expect(() =>
      randomDraw(200, 4, 2, ctxRef, 'purple')
    ).not.toThrow();

    expect(ctx.beginPath).toHaveBeenCalled();
  });
});
