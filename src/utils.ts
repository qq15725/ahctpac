// OpenCV
import { cv } from './opencv'

export function throwError (err: any) {
  const exceptionFromPtr = (cv as any | undefined)?.exceptionFromPtr

  if (exceptionFromPtr) {
    if (typeof err === 'number') {
      if (!isNaN(err)) {
        err = new Error(exceptionFromPtr(err).msg)
      }
    } else if (typeof err === 'string') {
      let ptr = Number(err.split(' ')[0])
      if (!isNaN(ptr)) {
        err = new Error(exceptionFromPtr(ptr).msg)
      }
    }
  }

  throw err
}