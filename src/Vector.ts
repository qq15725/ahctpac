/**
 * 向量
 */
export class Vector extends Array<number>
{
  /**
   * 计算和另一个向量的余弦相似度
   * @param target
   */
  cosineSimilarity (target: Vector) {
    const { dotProduct, squareProductA, squareProductB } = this.reduce(
      (state, source, i) => {
        state.dotProduct += source * target[i]
        state.squareProductA += source * source
        state.squareProductB += target[i] * target[i]
        return state
      },
      { squareProductA: 0, squareProductB: 0, dotProduct: 0 }
    )
    return dotProduct / ((Math.sqrt(squareProductA)) * (Math.sqrt(squareProductB)))
  }
}