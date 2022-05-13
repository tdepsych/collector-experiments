var list = createListOfNNumbersBetweenAAndB(10, 1, 60);
var burstPoint = transfomListToExactMeanAndSd(list, 30, 13);

//console.log('transformed list, mean and sd', burstPoint, computeMeanSdAndItervalRangeMinMax(burstPoint));
//console.log('original list, mean and sd', list, computeMeanSdAndItervalRangeMinMax(list));

function createListOfNNumbersBetweenAAndB(n, a, b) {
  const listOfN = Array(...new Array(n));
  return listOfN.map(() => Math.round(Math.random() * (b - a) + a));
}

function computeMeanSdAndItervalRangeMinMax(list) {
  const sum = list.reduce((a, b) => a + b, 0);
  const mean = sum / list.length;
  const sumMinusMean = list.reduce((a, b) => a + (b - mean) * (b - mean), 0);

  return {
    mean: mean,
    sd: Math.sqrt(sumMinusMean / (list.length - 1)),
    range: [Math.min(...list), Math.max(...list)]
  };
}

function transfomListToExactMeanAndSd(list, mean, sd) {
  const current = computeMeanSdAndItervalRangeMinMax(list);
  return list.map(n => Math.round(sd * (n - current.mean) / current.sd + mean));
}