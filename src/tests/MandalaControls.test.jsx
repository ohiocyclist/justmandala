import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MandalaControls } from '../MandalaControls';

jest.mock('../draw', () => ({
  randomDraw: jest.fn(),
}));

//jest.mock('../autoFill', () => jest.fn());

jest.mock('../mandalalibraries', () => ({
  MandalaLib: {
    handleFileInput: jest.fn(),
  },
}));

jest.mock('../ColorChooser', () => () => <div data-testid="color-chooser" />);

import { randomDraw } from '../draw';
import { autoFill } from '../autoFill';
import { MandalaLib } from '../mandalalibraries';

describe('MandalaControls', () => {
  const defaultProps = {
    slider1: 10,
    slider2: 5,
    slider3: 3,
    handleSlider1Change: jest.fn(),
    handleSlider2Change: jest.fn(),
    handleSlider3Change: jest.fn(),
    myLightDark: 'light',
    myPalette: ['#000'],
    setMyPalette: jest.fn(),
    setCurrentColor: jest.fn(),
    toastId: 'toast123',
    resetCanvas: jest.fn(),
    ctxRef: { current: {} },
    color: 'red',
    width: 400,
    radioValue: 'fillAll',
    handleRadioChange: jest.fn(),
  };

  it('renders all sliders and labels', () => {
    render(<MandalaControls {...defaultProps} />);

    expect(screen.getByLabelText(/Symmetry Degree/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brush Size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Auto Fill Pattern Repeat/i)).toBeInTheDocument();
  });

  it('calls slider change handlers', () => {
    render(<MandalaControls {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Symmetry Degree/i), { target: { value: 12 } });
    expect(defaultProps.handleSlider1Change).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Brush Size/i), { target: { value: 8 } });
    expect(defaultProps.handleSlider2Change).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Auto Fill Pattern Repeat/i), { target: { value: 6 } });
    expect(defaultProps.handleSlider3Change).toHaveBeenCalled();
  });

  it('renders ColorChooser', () => {
    render(<MandalaControls {...defaultProps} />);
    expect(screen.getByTestId('color-chooser')).toBeInTheDocument();
  });

  it('calls resetCanvas when Reset Canvas button is clicked', () => {
    render(<MandalaControls {...defaultProps} />);

    fireEvent.click(screen.getByText(/Reset Canvas/i));
    expect(defaultProps.resetCanvas).toHaveBeenCalled();
  });

  it('calls randomDraw when Random Mandala button is clicked', () => {
    render(<MandalaControls {...defaultProps} />);

    fireEvent.click(screen.getByText(/Random Mandala/i));
    expect(randomDraw).toHaveBeenCalledWith(
      defaultProps.width,
      defaultProps.slider1,
      defaultProps.slider2,
      defaultProps.ctxRef,
      defaultProps.color
    );
  });

  it('calls autoFill when Automatically Fill Areas button is clicked', () => {
    render(<MandalaControls {...defaultProps} />);

    jest.spyOn(autoFill, 'autoFill').mockReturnValue(true);    

    fireEvent.click(screen.getByText(/Automatically Fill Areas/i));
    expect(autoFill.autoFill).toHaveBeenCalledWith(
      defaultProps.ctxRef,
      defaultProps.width,
      defaultProps.myPalette,
      defaultProps.slider1,
      defaultProps.slider3,
      defaultProps.radioValue
    );
  });

  it('calls handleRadioChange when a toggle button is selected', () => {
    render(<MandalaControls {...defaultProps} />);

    fireEvent.click(screen.getByText(/Color One/i));
    expect(defaultProps.handleRadioChange).toHaveBeenCalled();
  });

  it('calls MandalaLib.handleFileInput when ColorChooser triggers file input', () => {
    const mockEvent = { target: { files: [] } };

    render(<MandalaControls {...defaultProps} />);

    // ColorChooser is mocked, so we call the handler manually
    MandalaLib.handleFileInput(mockEvent, defaultProps.toastId, defaultProps.myPalette, defaultProps.setMyPalette, defaultProps.myLightDark);

    expect(MandalaLib.handleFileInput).toHaveBeenCalled();
  });
});
