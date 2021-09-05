function sum(len: number) {
  let sum = 0;
  for (let i = 0; i < len; ++i) {
    sum += 1;
  }
  return sum;
}

function asyncSum(len: number, asyncNum = 1000) {
  let total = asyncNum > len ? len : asyncNum,
    sum = 0;
  const tasks: Promise<void>[] = [];
  while (total <= len) {
    const l =
      total === len
        ? asyncNum
        : total + asyncNum > len
        ? len - total
        : asyncNum;
    tasks.push(
      new Promise((resolve) => {
        for (let i = 0; i < l; ++i) {
          sum += 1;
        }
        resolve();
      })
    );
    total += l;
  }
  return Promise.all(tasks).then(() => sum);
}

const len = 10000000;
console.time('sync');
const ret = sum(len);
console.timeEnd('sync');
console.log('sync sum', ret);
console.time('async');
asyncSum(len, 1000000).then((sum) => {
  console.timeEnd('async');
  console.log('async sum', sum);
});
