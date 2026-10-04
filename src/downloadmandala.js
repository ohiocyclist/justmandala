export function downloadMandala(canvasPass) {
  const canvas = canvasPass?.current
  let fileName = prompt("Enter name to save image as:", "mandala.png")
  if (fileName) {
    fileName = fileName.replace(/[\/\\:*?"<>|]/g, "_")
    canvas.toBlob((blob) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()

      URL.revokeObjectURL(link.href)
    }, 'image/png')
  }
}
