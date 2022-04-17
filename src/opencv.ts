import type cv_ from 'opencv-4'

export let cv: typeof cv_ | undefined

export function setupOpencv (value: any, onRuntimeInitialized?: () => void) {
  if (onRuntimeInitialized) {
    value.onRuntimeInitialized = onRuntimeInitialized
  }
  cv = value
}