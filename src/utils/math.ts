const { PI } = Math;
export function angleToRadian(a: number) {
  return (a / 180) * PI;
}

/**
 *
 * @param equation1 第一个三元方程系数及已知值构成的数组
 * @param equation2 第二个三元方程系数及已知值构成的数组
 * @param equation3 第三个三元方程系数及已知值构成的数组
 * @returns 解构成的对象
 */
export function solveEquation3(
  equation1: number[],
  equation2: number[],
  equation3: number[]
) {
  const [a1, b1, c1, d1] = equation1;
  const [a2, b2, c2, d2] = equation2;
  const [a3, b3, c3, d3] = equation3;

  // 消元后得到的4个系数及两个已知值
  const A1 = a1 - (b1 * a2) / b2;
  const C1 = c1 - (b1 * c2) / b2;
  const D1 = d1 - (b1 * d2) / b2;
  const A2 = a2 - (b2 * a3) / b3;
  const C2 = c2 - (b2 * c3) / b3;
  const D2 = d2 - (b2 * d3) / b3;

  //计算xyz
  const x = ((C1 / C2) * D2 - D1) / ((C1 / C2) * A2 - A1);
  const z = (D2 - A2 * x) / C2;
  const y = (d1 - a1 * x - c1 * z) / b1;

  return {
    x,
    y,
    z,
  };
}
