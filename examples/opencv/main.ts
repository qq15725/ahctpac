import cv from 'opencv-4'
import { setupOpencv, matchTemplateColor } from 'ahctpac'

import items from './data/type1.json'

async function onLoad () {
  for (const [image, templ] of items) {
    console.log(
      await matchTemplateColor(image, templ, {
        blockSize: 20,
      })
    )
  }
}

setupOpencv(cv, onLoad)