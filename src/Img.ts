// Class
import { Vector } from './Vector'

// OpenCV
import { cv } from './opencv'

// Types
import type { Rect } from './types'
import type { Mat } from 'opencv-4'

/**
 * 图像
 */
export class Img
{
  /**
   * OpenCV mat
   */
  mat?: Mat

  /**
   * Canvas
   */
  canvas: HTMLCanvasElement

  /**
   * 排除的点
   * Set<`${ x },${ y }`>
   */
  excluded = new Set<string>()

  /**
   * 宽
   */
  width: number

  /**
   * 高
   */
  height: number

  /**
   * 构造
   * @param image
   */
  constructor (image: HTMLImageElement | HTMLCanvasElement | Mat) {
    if (image instanceof HTMLImageElement) {
      this.mat = cv?.imread(image)
      this.canvas = document.createElement('canvas')
      this.canvas.width = image.width
      this.canvas.height = image.height
      this.canvas.getContext('2d')!.drawImage(
        image, 0, 0, image.width, image.height
      )
    } else if (image instanceof HTMLCanvasElement) {
      this.mat = cv?.imread(image)
      this.canvas = image
    } else {
      this.mat = image
      this.canvas = document.createElement('canvas')
      cv!.imshow(this.canvas, this.mat!)
    }
    this.width = this.mat?.cols ?? this.canvas.width
    this.height = this.mat?.rows ?? this.canvas.height
  }

  /**
   * 从图像 URL 创建
   * @param value
   */
  static from (value: string): Promise<Img> {
    const image = new Image()
    image.src = value
    return new Promise(resolve => image.onload = () => resolve(new Img(image)))
  }

  /**
   * 设置排除的点
   * @param value
   */
  setExcluded (value: Set<string>) {
    this.excluded = value
    return this
  }

  /**
   * 遍历每个块
   * @param callbackfn
   * @param width
   * @param height
   * @param offset
   */
  forEachBlock (callbackfn: (block: Rect) => void, width: number, height: number, offset?: number) {
    const maxX = this.width - width
    const maxY = this.height - height
    this.forEach(({ x, y }) => {
      callbackfn({
        x: (x + width) > this.width ? maxX : x,
        y: (y + height) > this.height ? maxY : y,
        width,
        height,
      })
    }, offset ?? width / 4)
  }

  /**
   * 遍历每个像素
   * @param callbackfn
   */
  forEachPixel (callbackfn: (pixel: { x: number, y: number, rgba: number[] }) => void) {
    let imageData: Uint8ClampedArray
    if (!this.mat) {
      imageData = this.canvas.getContext('2d')!
        .getImageData(0, 0, this.width, this.height)
        .data
    }
    const findPixel = this.mat
      ? (x: number, y: number) => this.mat!.ucharPtr(y, x)
      : (x: number, y: number) => {
        const i = x + y * this.width
        return [
          imageData[i],
          imageData[i + 1],
          imageData[i + 2],
          imageData[i + 3],
        ]
      }

    this.forEach(({ x, y }) => {
      callbackfn({
        x, y,
        rgba: findPixel(x, y),
      })
    })
  }

  /**
   * 遍历每个点
   * @param callbackfn
   * @param offset
   */
  forEach (callbackfn: (point: { x: number, y: number }) => void, offset = 1) {
    for (let y = 0; y < this.height; y += offset) {
      for (let x = 0; x < this.width; x += offset) {
        callbackfn({ x, y })
      }
    }
  }

  /**
   * 裁剪图像
   */
  crop (rect: Rect) {
    if (this.mat) {
      return new Img(this.mat.roi(new cv!.Rect(rect.x, rect.y, rect.width, rect.height)))
    } else {
      const canvas = document.createElement('canvas')
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        this.canvas,
        rect.x, rect.y, rect.width, rect.height,
        0, 0, rect.width, rect.height
      )
      return new Img(canvas)
    }
  }

  /**
   * OpenCV grabCut
   */
  grabCut (rect?: Rect) {
    if (!cv || !this.mat) {
      return rect ? this.crop(rect) : this
    }
    const dst_ = new cv.Mat()
    const mask = new cv.Mat()
    const bgd = new cv.Mat()
    const fgd = new cv.Mat()
    const cvRect = rect
      ? new cv.Rect(rect.x, rect.y, rect.width, rect.height)
      : new cv.Rect(0, 0, this.width - 1, this.height - 1)
    cv.cvtColor(this.mat, dst_, cv.COLOR_RGBA2RGB, 0)
    cv.grabCut(dst_, mask, cvRect, bgd, fgd, 4, cv.GC_INIT_WITH_RECT)
    const dst = rect ? dst_.roi(cvRect) : dst_
    rect && dst_.delete()
    const excluded = new Set<string>()
    for (let y = 0; y < dst.rows; y++) {
      for (let x = 0; x < dst.cols; x++) {
        if (mask.ucharPtr(cvRect.y + y, cvRect.x + x)[0] === 0
          || mask.ucharPtr(cvRect.y + y, cvRect.x + x)[0] === 2) {
          dst.ucharPtr(y, x)[0] = 255
          dst.ucharPtr(y, x)[1] = 255
          dst.ucharPtr(y, x)[2] = 255
          excluded.add(`${ x },${ y }`)
        }
      }
    }
    mask.delete()
    bgd.delete()
    fgd.delete()
    return new Img(dst).setExcluded(excluded)
  }

  /**
   * 获取颜色集指纹
   * @param blocks
   */
  getColorFingerprint (blocks = 4): Vector {
    const counter: Record<string, number> = {}
    for (let i = 0; i < blocks; i++) {
      for (let j = 0; j < blocks; j++) {
        for (let k = 0; k < blocks; k++) {
          counter[[i, j, k].join('')] = 0
        }
      }
    }
    const block = 256 / blocks
    this.forEachPixel(({ x, y, rgba }) => {
      if (!this.excluded.has(`${ x },${ y }`)) {
        counter[[~~(rgba[0] / block), ~~(rgba[1] / block), ~~(rgba[2] / block)].join('')]++
      }
    })
    return Vector.from(Object.values(counter)) as Vector
  }
}