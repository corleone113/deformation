console.log('This is main js...');

const worker = new Worker('/src/tmp/worker1.js');
console.time('worker')
worker.postMessage('hello worker1');
worker.onmessage = (event) => {
    console.timeEnd('worker')
    console.log('received message:', event.data);
    worker.terminate();
}

function sum1(len: number) {
    let sum = 0;
    for (let i = 0; i < len; ++i) {
      sum += 1;
    }
    return sum;
  }

  const len1 = 10000000;
console.time('sync');
const ret1 = sum1(len1);
console.timeEnd('sync');
console.log('sync sum', ret1);