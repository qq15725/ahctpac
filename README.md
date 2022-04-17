# AHCTPAC

验证码识别库

## 安装

```sh
npm i ahctpac
```

使用 opencvjs 作为图像解析（推荐）

```sh 
npm i opencv-4
```

## 使用

```ts
import cv from 'opencv-4'
import { setupOpencv, matchTemplateColor } from 'ahctpac'

// 数据
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
```