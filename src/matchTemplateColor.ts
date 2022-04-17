// Utils
import { throwError } from './utils'

// Class
import { Img } from './Img'

// Types
import type { Rect } from './types'

interface Options
{
  /**
   * 每个块的大小
   */
  blockSize?: number

  /**
   * 是否开启调试
   */
  debug?: boolean
}

/**
 * 根据颜色匹配模板
 */
export async function matchTemplateColor (image: string, templ: string, options?: Options) {
  const blockSize = options?.blockSize
  try {
    const large = await Img.from(image)
    const small = await Img.from(templ)
    const cropped = await small.grabCut(
      blockSize
        ? {
          x: (small.width - blockSize) / 2,
          y: (small.height - blockSize) / 2,
          width: blockSize,
          height: blockSize,
        }
        : undefined
    )
    const fingerprint = cropped.getColorFingerprint()
    let max: { rect?: Rect, value: number } = { value: 0 }
    large.forEachBlock((rect) => {
      const value = large.crop(rect)
        .getColorFingerprint()
        .cosineSimilarity(fingerprint)
      if (max.value < value) {
        max = { rect, value }
      }
    }, blockSize ?? small.width, blockSize ?? small.height)

    return max;
  } catch (err) {
    return throwError(err)
  }
}