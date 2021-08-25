/**
 * 求解四元一次方程组(保留此函数是为了方便理解下面的解多元一次方程组的函数代码)
 * @param eq1 方程1的已知量(包含系数和等号右侧的已知量)数组
 * @param eq2 方程2的已知量数组
 * @param eq3 方程3的已知量数组
 * @param eq4 方程4的已知量数组
 * @returns 解数组
 */
export function solveEquation4(
  eq1: number[],
  eq2: number[],
  eq3: number[],
  eq4: number[]
) {
  const [a, b, c, d, e] = eq1;
  // 消掉四元一次方程组中第二系数得到三元一次方程组
  const eq11 = elimination(eq1, eq2);
  const eq12 = elimination(eq2, eq3);
  const eq13 = elimination(eq3, eq4);
  const [a1, c1, d1, e1] = eq11;
  // 消掉三元一次方程组中第二系数得到二元一次方程组
  const eq21 = elimination(eq11, eq12);
  const eq22 = elimination(eq12, eq13);
  const [a2, d2, e2] = eq21;

  // 消掉二元一次方程组中第二系数得到一元一次方程
  const [a3, e3] = elimination(eq21, eq22);

  // 代入一元一次方程解得x
  const x = e3 / a3;
  // 代入二元一次方程解得w
  const w = (e2 - a2 * x) / d2;
  // 代入三元一次方程解得z
  const z = (e1 - a1 * x - d1 * w) / c1;
  // 代入四元一次方程解得y
  const y = (e - a * x - c * z - d * w) / b;
  return [x, y, z, w];
}

/**
 * 求解多元一次方程组(ps: 求解n元一次方程组，可能结合实际需求场景n不会太大，不过因为没有涉及复杂的数据结构，所以还是优先选择迭代的方式)
 * @param eqs 多元一次方程组已知量数组的数组，是一个n x (n+1)维的数组
 * @returns 解数组
 */
export function solveEquation(...eqs: number[][]) {
  if (
    eqs[0].length < 2 ||
    (eqs.length > 1 && eqs[0].length !== eqs[1].length)
  ) {
    throw new Error('非多元一次方程组');
  }
  // 一元一次方程
  if (eqs[0].length === 2) {
    return [eqs[0][1] / eqs[0][0]];
  }
  let eq1 = eqs[0];
  // 保存新的方程组的已知量数组的缓存数组
  let eqsCache = [...eqs];
  // 缓存每个方程组中第一个方程稍后用于求解
  const eqStack = [eq1];
  // 已知量数组大于2，即两元以上时才需要消元
  while (eq1.length > 2) {
    const oldCache = [...eqsCache];
    // 重置缓存
    eqsCache = [];
    // 两两消元依次得到降元后的已知量数组并缓存起来
    for (let i = 0; i < oldCache.length - 1; ++i) {
      eqsCache.push(elimination(oldCache[i], oldCache[i + 1]));
    }
    eq1 = eqsCache[0];
    eqStack.push(eq1);
  }
  let eq: number[] | undefined;
  let ret: number[] = [];
  // 出栈依次求解未知量
  while ((eq = eqStack.pop())) {
    // 一元一次方程直接导入求解
    if (eq.length === 2) {
      ret.push(eq[1] / eq[0]);
    } else {
      // 代入已得的解得到的和
      let knownSum = 0;
      for (let i = 0, j = 0; i < ret.length; ++i) {
        // 解数组从第二个开始和已知量数组中第三个开始对应
        if (i === 1) {
          j += 1;
        }
        knownSum += ret[i] * eq[j];
        j += 1;
      }
      // 代入多元(两元及以上)一次方程求解未知量
      ret.push((eq[eq.length - 1] - knownSum) / eq[1]);
    }
    // 已解得的未知量个数大于2时需要将末尾的未知量移到第二位
    if (ret.length > 2) {
      const [last] = ret.splice(ret.length - 1, 1);
      ret.splice(1, 0, last);
    }
  }
  return ret;
}

/**
 * 消元并返回新的已知量数组, 只有一元以上才需要消元
 * @param eq1 需要消元的方程1
 * @param eq2 需要消元的方程2
 * @returns
 */
function elimination(eq1: number[], eq2: number[]) {
  // 消元时乘以的系数
  const e = eq1[1] / eq2[1];
  // 保存消元后得到的新已知量的数组
  const ret: number[] = [];
  for (let i = 0; i < eq1.length; ++i) {
    if (i !== 1) {
      ret.push(eq1[i] - eq2[i] * e);
    }
  }
  return ret;
}

const eqs: [number[], number[], number[], number[]] = [
  [6, 3, 4, -5, -6],
  [6, 7, -8, 9, 96],
  [10, 16, 12, 13, 312],
  [14, 15, 16, 17, 416],
];
console.log('tmp', solveEquation4(...eqs));
console.log('complete', solveEquation(...eqs));
console.log(
  'cubic',
  solveEquation([4, 5, 7, 9], [3, 6, 8, 15], [12, 14, 16, 155])
);
