import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { kmeans } from 'ml-kmeans'
import { toast } from 'react-toastify'


export class MandalaLib {

  static oldHandleFileInput = async (event, toastId, mylink, setMyBData, setMyPalette) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      toastId.current = toast('Processing')
      if (document?.getElementById(elementID)) {
        document.getElementById(elementID).innerHTML = ""
      }
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      try {
        const response = await axios.post(mylink, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const data=response.data;
        setMyBData(data.BData)
        // avoid stubs
        if (data.Palette.length > 5) {
          setMyPalette(JSON.stringify(data.Palette))
        }
        toast.dismiss(toastId.current)
      } catch (error) {
        console.log(`Error uploading file ${error}`);
      }

    }      
  }

  static reshapeArray1D2D(oneDArray, rows, depth) {
    if (oneDArray.length !== rows * depth) {
      throw new Error("The size of the 1D array does not match the dimensions of the 2D array.");
    }

    const twoDArray = []
    for (let i = 0; i < rows; i++) {
      twoDArray[i] = []
      for (let j = 0; j < depth; j++) {
        twoDArray[i][j] = []
        const index = (i) * depth + j
          twoDArray[i][j] = oneDArray[index]
        }
      }
    return twoDArray;
  }

  static rgbToHex = (r, g, b) => {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`
  }  

  static increaseGreen = (imageArray) => {
    return imageArray.map(row =>
        row.map(pixel => {
            pixel[1] = Math.min(pixel[1] + 50, 255)
            return pixel
        })
    )
  }

  static reshapeArray1D3D(oneDArray, rows, cols, depth) {
    if (oneDArray.length !== rows * cols * depth) {
      throw new Error("The size of the 1D array does not match the dimensions of the 3D array.");
    }

    const threeDArray = []
    for (let i = 0; i < rows; i++) {
      threeDArray[i] = []
      for (let j = 0; j < cols; j++) {
        threeDArray[i][j] = []
        for (let k = 0; k < depth; k++) {
          const index = (i * cols + j) * depth + k
          threeDArray[i][j][k] = oneDArray[index]
        }
      }
    }
    return threeDArray;
  }

  static repeatArray(arr, times) {
    const newArray = []
    for (let i = 0; i < times; i++) {
      newArray.push(...arr)
    }
      return newArray
  } 

  static loadImageArrayToCanvas = (imageArray, dims=3) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    let width = 300
    let height = 300

    if (dims === 2) {
      width = height = Math.round(Math.sqrt(imageArray.length))
    } else {
      width = imageArray[0].length
      height = imageArray.length
    }
    canvas.width = width
    canvas.height = height

    const flatArray = new Uint8ClampedArray(imageArray.flat(dims))
    const imageData = new ImageData(flatArray, width, height)

    ctx.putImageData(imageData, 0, 0)

    return canvas
  }

  
  static handleFileInput = async (event, toastId, myPalette, setMyPalette, myLightDark) => {
    if (toastId != '') {
      toastId.current = toast('The Magic of color extraction will only be a moment....', {theme: (myLightDark && 'dark') || 'light'} )
    }
    const selectedFile = event.target.files[0]

    if (selectedFile) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        
        img.onload = () => {
          let canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          //canvas.width = img.width;
          //canvas.height = img.height;
          canvas.width = 300
          canvas.height = 300
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const depth = 4
          let imageArray = this.reshapeArray1D2D(imageData.data, canvas.width * canvas.height, depth)

          const kClusters = 25
          let ans = kmeans(imageArray, kClusters)

          const roundedCentroids = ans.centroids.map(center => center.map(Math.round))
          // update Palette
          const paletteCentroids = roundedCentroids.map(rgb => MandalaLib.rgbToHex(rgb[0], rgb[1], rgb[2]))
          let newPalette = JSON.stringify(paletteCentroids)

          // strip enclosing quotes otherwise it doesn't match
          if (newPalette.charAt(0) == '"') {
            newPalette = newPalette.substring(1, newPalette.length - 1)
          }
          newPalette = encodeURIComponent(newPalette)
          if (newPalette !== myPalette) {
            console.log("resetting palette from color chooser")
            setMyPalette(newPalette)
          }

          const answerKey = ans.clusters.map(index => roundedCentroids[index])

          canvas = this.loadImageArrayToCanvas(answerKey, 2)          
          const imgUrl = canvas.toDataURL()
          const outputDiv = document.getElementById("targetIMG")
          if (outputDiv) {
            outputDiv.innerHTML = `<img src="${imgUrl}" />`
          }
          if (toastId != '') {
            toast.dismiss(toastId.current)
          }
        }
      }

      reader.readAsDataURL(selectedFile);
    } else {
      toast.dismiss(toastId.current)
    }
  }

  static runTimeout = (setSlider1, animateDirection, setSlider2, myStyle, setMyStyle, myColor, setMyColor, setMyInners, setMyHalf, setMyStepSize, setMyPalette, setSliderTitle2, setJitternum, intervalRef, dorepeat) => {

    let myChoice = Math.random()
    let sliderTwo = false
    if (setSlider1) {
        setSlider1((prevSlider) => {
            let thisdir = animateDirection.current
            if (prevSlider < 9) {
                animateDirection.current = true
                thisdir = true
            }
            if (prevSlider > 29) {
                animateDirection.current = false
                thisdir = false
            }
            if (myStyle === 'STARS' && prevSlider % 2 === 0 && 
                (slider2 > 5 || animateDirection) && 
                (slider2 < Math.round(prevSlider / 2) - 2 || !animateDirection)) {
                sliderTwo = true
            }
            // always truncate for non stars
            if (myStyle !== 'STARS') {
                sliderTwo = true
            }
            return thisdir ? prevSlider + 1 : prevSlider - 1
        })
        if (sliderTwo) {
            setSlider2((previousSlider2) => {
                return (myStyle !== 'STARS' && previousSlider2 > 6) ? 6 : ((animateDirection.current || previousSlider2 < 8) ? previousSlider2 + 1 : previousSlider2 - 1)
            })
        }
        if (myChoice < 0.15) {
            setMyStyle('STARS')
            setSliderTitle2('Star Skip Rate')
        } else if (myChoice < 0.3) {
            setMyStyle('KITES')
            setSliderTitle2('Repeat Depth')
            if (myColor === 1) {
                setMyColor(0)
            }
        } else if (myChoice < 0.35) {
            setMyStyle('SMILES')
            setSliderTitle2('Repeat Depth')
            if (myColor === 1) {
                setMyColor(0)
            }
        } else if (myChoice < 0.4) {
            setMyStyle('SMILEALT')
            setSliderTitle2('Repeat Depth')
            if (myColor === 1) {
                setMyColor(0)
            }        
        } else if (myChoice < 0.44) {
            setMyInners(0)
        } else if (myChoice < 0.48) {
            setMyInners(1)
        } else if (myChoice < 0.52) {
            setMyInners(2)
        } else if (myChoice < 0.56) {
            setMyInners(3)
        } else if (myChoice < 0.6) {
            setMyInners(4)
        } else if (myChoice < 0.63) {
            setMyHalf(0)
            setMyStepSize(0)
        } else if (myChoice < 0.66) {
            setMyHalf(1)
            setMyStepSize(1)
        } else if (myChoice < 0.69) {
            setJitternum(0)
        } else if (myChoice < 0.72) {
            setJitternum(2)
        } else if (myChoice < 0.75) {
            setMyHalf(2)
            setMyStepSize(2)
        } else if (myChoice < 0.78) {
            setMyHalf(3)
        } else if (myChoice < 0.82) {
            setMyHalf(4)
        } else if (myChoice < 0.86) {
            setMyHalf(5)
        } else {
            let myDx = Math.round((Math.random() - 0.001) * 16)
            setMyPalette((oldpal) => {
                let usePalette = decodeURIComponent(oldpal)
                if (usePalette.charAt(0) !== '[') {
                    usePalette = usePalette.substring(1, usePalette.length - 1)
                }
                if (usePalette.length > 3) {
                    usePalette = JSON.parse(usePalette)
                } else {
                    usePalette = []
                    for (let ii = 0; ii < 16; ii++) {
                        usePalette.push(this.rgbToHex(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)))
                    }
                }
                // random in a new color
                usePalette[myDx] = this.rgbToHex(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255))
                let newPalette = JSON.stringify(usePalette)

                // strip enclosing quotes otherwise it doesn't match
                if (newPalette.charAt(0) == '"') {
                    newPalette = newPalette.substring(1, newPalette.length - 1)
                }
                newPalette = encodeURIComponent(newPalette)
                return newPalette
            })
        }
    }
    if (dorepeat) {
      intervalRef.current = setTimeout(() => {this.runTimeout(setSlider1, animateDirection, setSlider2, myStyle, setMyStyle, myColor, setMyColor, setMyInners, setMyHalf, setMyStepSize, setMyPalette, setSliderTitle2, setJitternum, intervalRef, dorepeat)}, 850)    
    }
  }

  static runWind = (xdisplace, setXdisplace, windRef) => {
    var lxd = xdisplace.current + 1
    if (lxd === undefined || lxd > 1400) {
      lxd = 0
    }
    setXdisplace(lxd)
    xdisplace.current = lxd

    windRef.current = setTimeout(() => {this.runWind(xdisplace, setXdisplace, windRef)}, 5)
  }

  static runBlink = (blinkMarch, setMyBlink, blinkRef) => {
    var lxd = blinkMarch.current + 1
    if (lxd === undefined || lxd > 3) {
      lxd = 0
    }
    setMyBlink(lxd)
    blinkMarch.current = lxd

    blinkRef.current = setTimeout(() => {this.runBlink(blinkMarch, setMyBlink, blinkRef)}, 500)
  }

}