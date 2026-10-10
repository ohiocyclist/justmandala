import { drawLine, draw } from '../draw';
import { getMandalaHelpers } from '../getlocalcoordinates';

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
    drawImage: jest.fn()
  };
}

describe('drawLine', () => {
  it('draws a line for each symmetry point', () => {
    const ctx = mockCtx();

    getMandalaHelpers.getSymmetryPoints.mockReturnValue([
      [10, 20],
      [30, 40],
    ]);

    drawLine(0, 0, 100, 100, ctx, 200, 4, 2, 'red');

    expect(getMandalaHelpers.getSymmetryPoints).toHaveBeenCalledTimes(2);
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
    const isZoonRef = { current: false };

    getMandalaHelpers.getLocalCoordinates.mockReturnValue([50, 60]);
    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[50, 60]]);

    const prevXY = [10, 20];
    const event = { buttons: 1 };

    draw(event, {}, ctxRef, 200, 4, 2, 'blue', prevXY, isZoonRef);

    expect(getMandalaHelpers.getLocalCoordinates).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('updates prevXY on click', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };
    const isZoonRef = { current: false };

    getMandalaHelpers.getLocalCoordinates.mockReturnValue([80, 90]);
    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[80, 90]]);

    const prevXY = [0, 0];
    const event = { type: 'click' };

    draw(event, {}, ctxRef, 200, 4, 2, 'green', prevXY, isZoonRef);

    expect(prevXY).toEqual([80, 90]);
  });

  it('copies between canvases while zoomed in', () => {
    const ctx = mockCtx();
    const ctxRef = { current: ctx };
    const isZoonRef = { current: true };
    const quxRef = { current: 60 };
    const quyRef = { current: 155 };
    const zoomCanvasRef = { current: { getContext: (e) => {return mockCtx()} } };
    const canvasRef = { current: '' };

    getMandalaHelpers.getLocalCoordinates.mockReturnValue([80, 90]);
    getMandalaHelpers.getSymmetryPoints.mockReturnValue([[80, 90]]);

    const prevXY = [0, 0];
    const event = { type: 'click' };

    draw(event, {}, ctxRef, 200, 4, 2, 'green', prevXY, isZoonRef, zoomCanvasRef, canvasRef, quxRef, quyRef);

    expect(ctxRef.current.drawImage).toHaveBeenCalled()
    expect(prevXY).toEqual([100, 200]);
  });
});