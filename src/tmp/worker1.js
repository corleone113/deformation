onmessage = () => {
	postMessage(sum1(len1));
    // asyncSum(len1).then(sum=>{
    //     postMessage(sum)
    // })
	close();
}

function sum1(len) {
	let sum = 0;
	for (let i = 0; i < len; ++i) {
		sum += 1;
	}
	return sum;
}


function asyncSum(len, asyncNum = 1000) {
    let total = asyncNum > len ? len : asyncNum,
      sum = 0;
    const tasks = [];
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

const len1 = 10000000;
// self.addEventListener('message', (e) => {
//     self.postMessage('You said ' + e.data);
// })
// this.addEventListener('message', (e) => {
//     this.postMessage('You said ' + e.data);
// })