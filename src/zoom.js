

export function zoom(event, isZoomRef, canvasRef, zoomRef, zoomCanvasRef, width, quxRef, quyRef) {
  if (event.buttons == 1 || event.type == "touchmove" || event.type == "click") {
    if (isZoomRef.current) {
        isZoomRef.current = false
        // copy back from the backup canvas
        let ctx = canvasRef.current.getContext("2d")
        ctx.drawImage(
            zoomCanvasRef.current,
            0, 0, width, width,
            0, 0, width, width
        )
    } else {
        isZoomRef.current = true
        // copy to the backup canvas and zoom the main canvas
        let ctx = zoomCanvasRef.current.getContext("2d")
        ctx.drawImage(
            canvasRef.current, 
            0, 0, width, width,
            0, 0, width, width
        )
        const hawidth = Math.floor(width / 2)
        // TODO:  allow these to track where the user clicks to zoom in
        quxRef.current = Math.round(width / 4)
        quyRef.current = Math.round(width / 4)
        ctx = canvasRef.current.getContext("2d")
        ctx.drawImage(
            zoomCanvasRef.current,
            quxRef.current, quyRef.current, hawidth, hawidth,
            0, 0, width, width
        )
    }
  }
}