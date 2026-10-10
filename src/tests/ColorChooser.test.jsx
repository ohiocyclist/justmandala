/**
 * @jest-environment jsdom
 */

jest.mock('react-colorful', () => {
  return {
    HexColorPicker: ({ onChange }) => (
      <input 
        data-testid="mock-picker" 
        onChange={(e) => onChange(e.target.value)} 
      />
    )
  };
});

import { render, screen, fireEvent } from '@testing-library/react'
import { ColorChooser } from '../ColorChooser'

describe('ColorChooser', () => {
  const mockSetMyPalette = jest.fn()
  const mockSetCurrentColor = jest.fn()
  const updateColor = jest.fn()
  const mockHandleFileInput = jest.fn()

  const defaultProps = {
    myPalette: null,
    setMyPalette: mockSetMyPalette,
    myLightDark: 1,
    handleFileInput: mockHandleFileInput,
    setCurrentColor: mockSetCurrentColor,
    skipPalButton: false,
    colors: {current: [
      "#68840D",
      "#4BB329",
      "#993030",
      "#986209",
      "#0D7052",
      "#590D06",
      "#5A4906",
      "#668044",
      "#C1A355",
      "#C99605",
      "#30BAB2",
      "#1D3612",
      "#36086A",
      "#959F4B",
      "#B3942C",
      "#530102",
      "#0233B9",
      "#94C40D",
      "#4D5C03",
      "#90C1F9",
      "#025001",
      "#F6DE01",
      "#72408F",
      "#06B1E0",
      "#1F1572"
    ]},
    colorHelper: [
      "#68840D",
      "#4BB329",
      "#993030",
      "#986209",
      "#0D7052",
      "#590D06",
      "#5A4906",
      "#668044",
      "#C1A355",
      "#C99605",
      "#30BAB2",
      "#1D3612",
      "#36086A",
      "#959F4B",
      "#B3942C",
      "#530102",
      "#0233B9",
      "#94C40D",
      "#4D5C03",
      "#90C1F9",
      "#025001",
      "#F6DE01",
      "#72408F",
      "#06B1E0",
      "#1F1572"
    ], 
    setColorHelper: jest.fn(),
    selectedColor: 0,
    setSelectedColor: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders 25 color buttons', () => {
    render(<ColorChooser {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(25)
  })

  test('selecting a color updates selectedColor and calls setCurrentColor', () => {
    render(<ColorChooser {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const secondButton = buttons[1]

    fireEvent.click(secondButton)

    expect(mockSetCurrentColor).toHaveBeenCalled()
  })

  test('HexColorPicker updates color and calls setCurrentColor', () => {
    render(<ColorChooser {...defaultProps} />)

    const picker = screen.getByTestId("mock-picker")

    fireEvent.change(picker, {target: { value: '#123456' } })

    expect(mockSetCurrentColor).toHaveBeenCalledWith('#123456')
  })

  test('resetPalette is called when clicking Update Palette', () => {
    render(<ColorChooser {...defaultProps} />)

    const updateButton = screen.getByText(/Update Palette/i)
    fireEvent.click(updateButton)

    expect(mockSetMyPalette).toHaveBeenCalled()
  })

  test('file input triggers handleFileInput', () => {
    render(<ColorChooser {...defaultProps} />)

    const fileInput = screen.getByLabelText(/Choose Colors from a file/i)
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(mockHandleFileInput).toHaveBeenCalled()
  })
  test('lime highlight', () => {
    const { rerender } = render(<ColorChooser {...defaultProps} />)

    rerender(<ColorChooser {...defaultProps} myLightDark={0} />)

    // The first color button is selected by default (index 0)   
    const selectedButton = screen.getAllByRole('button')[0]
    expect(selectedButton).toHaveStyle('border: 6px solid lime')
  })

})