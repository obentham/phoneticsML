import { KMeans } from 'kalimdor/cluster';
import Chart from 'chart.js';
import randomColour from 'randomcolor';
import trainData from './train.json'; // Training data is already preprocessed

// Data processing
const organiseData = (data) => {
  const organisedData = [];
  for (let i = 0; i < data.length; i++) {
    const newRow = [];
    const curRow = data[i];
    newRow.push(curRow.Distance_Feature);
    newRow.push(curRow.Speeding_Feature);
    organisedData.push(newRow);
  }
  return organisedData;
}

// Training
const kmeans1 = new KMeans({ k: 2 });

kmeans1.fit({ X: organiseData(trainData) });
const clusters = kmeans1.toJSON().clusters;

// Prediction demo
const pred = [[ 71.24, 28 ], [ 67.55, 4 ]];
const result1 = kmeans1.predict({ X: pred });
document.getElementById('predictions').innerHTML = `prediction of ${JSON.stringify(pred)} result ${result1}`;

// Plotting
const bubbleData = [];
for(let ci = 0; ci < clusters.length; ci++) {
  const cluster: any[] = clusters[ci];
  const newCluster = [];
  for (let ri = 0; ri < cluster.length; ri++) {
    const row = cluster[ri];
    newCluster.push({
      x: row[0],
      y: row[1],
      r: 3,
    })
  }
  const colour = randomColour();
  bubbleData.push({
    label: [`Cluster #${ci}`],
    backgroundColor: colour,
    borderColor: colour,
    data: newCluster
  });
}

const ctx = document.getElementById("myChart");
var myBubbleChart = new Chart(ctx,{
    type: 'bubble',
    data: {
      datasets: bubbleData
    },
});
