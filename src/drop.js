import { getMandalaHelpers } from './getlocalcoordinates'
import { MandalaLib } from './mandalalibraries'
import { updateColor } from './ColorChooser'

export default function drop(event, chartRef, ctx, selectedColor, colors, setColorHelper, setCurrentColor, setMyPalette) {
  var coord = getMandalaHelpers.getLocalCoordinates(event, chartRef)
  if (event.buttons == 1 || event.type == "touchmove" || event.type == "click") {
    const { data } = ctx.getImageData(coord[0], coord[1], 1, 1)
    //console.log(`dropper, ${data[0]} ${data[1]} ${data[2]}`)
    updateColor(selectedColor, MandalaLib.rgbToHex(data[0], data[1], data[2]), colors, setColorHelper, setCurrentColor, true, setMyPalette)
  }

}