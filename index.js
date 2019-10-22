var output = document.getElementById("output");
var inputFile = document.getElementById("inputFile");
var rawInputData = ""
var k = 5
var showMeans = true
var DRAWDELAY = 300


// Global variables
const YCOLUMN = 1
var GRAPHBORDER = 60 	// distance between graph and canvas
var DATABORDER = .05 	// proportion of gap between graph edge and data in graph
var AXIS_TICK_SIZE = 10
var HEIGHT = 750
var WIDTH = 750
var COLORS = ['red','blue','green','orange','purple','gray','navy','maroon', 'black', 'DarkGoldenRod', 'coral', 'deeppink']

var canvas; 
var ctx;
var data;
var plotData
var labels;
var means = [];
var assignments = [];
var plotDataExtremes;
var plotDataRange;
var dataExtremes;
var dataRange;

canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
setupGraph();

inputFile.addEventListener("change", function () {
	rawInputData = ""
	if (this.files && this.files[0]) {
		var myFile = this.files[0];
		var reader = new FileReader();
		reader.addEventListener('load', function (e) {
			rawInputData = e.target.result;
		});
		reader.readAsText(myFile);
	}   
});

function run() {
	// exits if file hasn't been provided
	if(rawInputData == "") {return}
	k = document.getElementById("inputK").value;
	if(k < 1 || k > COLORS.length) {return}
	document.getElementById('results').innerHTML = "RESULTS"
	radios = document.getElementsByName('showMean')
	showMeans = radios[0].checked == true
	text = rawInputData
	DRAWDELAY = document.getElementById("inputDelay").value;
	// console.log(rawInputData);
	// console.log(k);

	data = [];
	means = [];
	assignments = [];
	var allData = text.split('\n');

	for(var i = 0; i < allData.length; i++) {
		var temp = allData[i].split(',');
		allData[i] = temp;
	}

	var X = [];
	var Y = [];
	// console.log('allData')
	for(var i = 1; i < allData.length; i++) {
		// console.log(allData[i]);
		var temp = [];
		for(var j = 1; j < allData[i].length; j++) {
			if (j == YCOLUMN) {
				Y.push(allData[i][j]);
			} else {
				temp.push(parseFloat(allData[i][j]));
			}
		}
		X.push(temp);
	}

	// console.log('Y')
	// console.log(Y)
	// console.log('X')
	// console.log(X)

	data = X
	labels = Y

	console.log('calling kmeans with k = ' + k)
	kmeans(k)
}

function kmeans(k) {
	plotDataExtremes = getDataExtremes(data, false);
	plotDataRange = getDataRanges(plotDataExtremes);
	data = normalize(data)
	dataExtremes = getDataExtremes(data, true);
	dataRange = getDataRanges(dataExtremes);
	means = initMeans(k);

	makeAssignments();
	draw();

	setTimeout(run_kmeans, DRAWDELAY);
}

function normalize(data) {
	// console.log('data extremes and range')
	// console.log(plotDataExtremes)
	// console.log(plotDataRange)
	var normalized_data = []

	for (var row in data){
		var point = data[row]
		var newPoint = []
		for (var col in point) {
			var val = point[col]
			newPoint.push((val - plotDataExtremes[col].min)/ plotDataRange[col])
		}
		normalized_data.push(newPoint)
	}
	return normalized_data
}

function getDataRanges(extremes) {
	var ranges = [];
	for (var dimension in extremes)
	{
		ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
	}
	return ranges;
}

function getDataExtremes(points, normalized) {
	var extremes = [];

	for (var i in data) {
		var point = data[i];

		for (var dimension in point) {
			if ( ! extremes[dimension] ) {
				extremes[dimension] = {min: 1000, max: 0};
			}
			if (point[dimension] < extremes[dimension].min) {
				extremes[dimension].min = point[dimension];
			}
			if (point[dimension] > extremes[dimension].max) {
				extremes[dimension].max = point[dimension];
			}
		}
	}

	if (normalized == true) {
		// add data border by pushing out extremes
		for (var dimension in extremes) {
			extremes[dimension].min = 0 - DATABORDER
			extremes[dimension].max = 1 + DATABORDER
		}
	} else {
		// add data border by pushing out extremes
		for (var dimension in extremes) {
			extremes[dimension].min -= DATABORDER * extremes[dimension].min
			extremes[dimension].max += DATABORDER * extremes[dimension].max
		}
	}
	console.log(extremes)

	return extremes;
}

function initMeans(k) {
	while (k--) {
		var mean = [];

		for (var dimension in dataExtremes) {
			mean[dimension] = dataExtremes[dimension].min + (Math.random() * dataRange[dimension]);
		}
		means.push(mean);
	}
	return means;
};

function makeAssignments() {
	for (var i in data) {
		var point = data[i];
		var distances = [];

		for (var j in means) {
			var mean = means[j];
			var sum = 0;

			for (var dimension in point) {
				var difference = point[dimension] - mean[dimension];
				difference *= difference;
				sum += difference;
			}
			distances[j] = Math.sqrt(sum);
		}
		assignments[i] = distances.indexOf( Math.min.apply(null, distances) );
	}

}

function moveMeans() {

	makeAssignments();

	var sums = Array( means.length );
	var counts = Array( means.length );
	var moved = false;

	for (var j in means) {
		counts[j] = 0;
		sums[j] = Array( means[j].length );
		for (var dimension in means[j]) {
			sums[j][dimension] = 0;
		}
	}

	for (var point_index in assignments) {
		var mean_index = assignments[point_index];
		var point = data[point_index];
		var mean = means[mean_index];

		counts[mean_index]++;

		for (var dimension in mean) {
			sums[mean_index][dimension] += point[dimension];
		}
	}

	for (var mean_index in sums) {
		// console.log(counts[mean_index]);
		if ( 0 === counts[mean_index] )  {
			sums[mean_index] = means[mean_index];
			// console.log("Mean with no points");
			// console.log(sums[mean_index]);

			for (var dimension in dataExtremes) {
				sums[mean_index][dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
			}
			continue;
		}

		for (var dimension in sums[mean_index]) {
			sums[mean_index][dimension] /= counts[mean_index];
		}
	}

	if (means.toString() !== sums.toString()) {
		moved = true;
	}
	means = sums;
	return moved;
}

function run_kmeans() {
	var moved = moveMeans();
	draw();

	if (moved) {
		setTimeout(run_kmeans, DRAWDELAY);
	} else {
		// algorithm has found clusters
		document.getElementById('results').innerHTML = "RESULTS Done!"
	}
}

function draw() {
	// console.log('data')
	// console.log(data)
	// console.log('labels')
	// console.log(labels)
	// console.log('assignments')
	// console.log(assignments)    
	// console.log('means')
	// console.log(means)

	// clear canvas
	ctx.clearRect(0,0,WIDTH, HEIGHT);

	setupGraph();
	labelAxes();
	
	// draw lines between points and mean
	// drawLines()
	
	// draw points
	drawData()

	// draw means
	if(showMeans) {
		drawMeans()
	}
}

function drawData() {
	ctx.globalAlpha = 1;

	for(var i = 0; i < data.length; i++) {
		ctx.save();

		var point = data[i];

		// column 0 (F1) actually goes on y and column 1 (F2) goes on x
		var y = (point[0] - dataExtremes[0].min) * (WIDTH / (dataRange[0]) );
		var x = (point[1] - dataExtremes[1].min) * (HEIGHT / (dataRange[1]) );

		// flip x to get axes alligned correctly, y is already reversed because of web coordinates
		x = WIDTH - x

		// rescale to add graph border
		// if canvas dims are 400x400, .8 adds 40 border
		scaleX = 1 - ((GRAPHBORDER * 2) / WIDTH)
		scaleY = 1 - ((GRAPHBORDER * 2) / HEIGHT)
		x = ((x - (WIDTH / 2)) * scaleX) + (WIDTH / 2)
		y = ((y - (HEIGHT / 2)) * scaleY) + (HEIGHT / 2)

		//console.log(point)

		ctx.font = "12px Arial";
		// print coordinates
		//ctx.fillText("x: " + point[0] + " y: " + point[1], x+10, y-10);
		
		// print label
		ctx.fillStyle = COLORS[assignments[i]]
		ctx.fillText(labels[i], x-3, y+4);

		/*ctx.strokeStyle = 'black'
		ctx.translate(x, y);
		ctx.beginPath();
		ctx.arc(0, 0, 3, 0, Math.PI*2, true);
		ctx.stroke();
		ctx.closePath();*/

		ctx.restore();
	}
}

function drawMeans() {
	for (var i in means) {
		ctx.save();

		var point = means[i];

		// column 0 (F1) actually goes on y and column 1 (F2) goes on x
		var y = (point[0] - dataExtremes[0].min) * (WIDTH / (dataRange[0]) );
		var x = (point[1] - dataExtremes[1].min) * (HEIGHT / (dataRange[1]) );

		// flip x to get axes alligned correctly, y is already reversed because of web coordinates
		x = WIDTH - x

		// rescale to add graph border
		// if canvas dims are 400x400, .8 adds 40 border
		scaleX = 1 - ((GRAPHBORDER * 2) / WIDTH)
		scaleY = 1 - ((GRAPHBORDER * 2) / HEIGHT)
		x = ((x - (WIDTH / 2)) * scaleX) + (WIDTH / 2)
		y = ((y - (HEIGHT / 2)) * scaleY) + (HEIGHT / 2)

		ctx.fillStyle = COLORS[i]
		ctx.strokeStyle = 'black'
		ctx.lineWidth = 0
		ctx.translate(x, y);
		ctx.beginPath();
		ctx.arc(0, 0, 5, 0, Math.PI*2, true);
		ctx.fill();
		ctx.stroke()
		ctx.closePath();

		ctx.restore();
	}
}

function drawLines() {
	ctx.globalAlpha = 0.3;
	for (var point_index in assignments) {
		var mean_index = assignments[point_index];
		var point = data[point_index];
		var mean = means[mean_index];

		ctx.save();

		ctx.strokeStyle = 'black';
		ctx.setLineDash([5, 5]);
		ctx.beginPath();

		// TODO: redo with flipped y
		ctx.moveTo(
			(point[0] - dataExtremes[0].min) * (WIDTH / (dataRange[0]) ),
			(point[1] - dataExtremes[1].min) * (HEIGHT / (dataRange[1]) )
		);
		ctx.lineTo(
			(mean[0] - dataExtremes[0].min) * (WIDTH / (dataRange[0]) ),
			(mean[1] - dataExtremes[1].min) * (HEIGHT / (dataRange[1]) )
		);
		ctx.stroke();
		ctx.closePath();
	
		ctx.restore();
	}
}

function setupGraph() {
		// outline canvas
		ctx.globalAlpha = 1;
		ctx.save();
		ctx.strokeStyle = 'black';
		ctx.lineWIDTH = 5
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(WIDTH,0);
		ctx.lineTo(WIDTH,HEIGHT);
		ctx.lineTo(0,HEIGHT);
		ctx.lineTo(0,0);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	
		// draw y and x axis
		ctx.globalAlpha = 1;
		ctx.save();
		ctx.strokeStyle = 'black';
		ctx.lineWIDTH = 1
		ctx.beginPath();

		// vertical left
		ctx.moveTo(GRAPHBORDER,GRAPHBORDER);
		ctx.lineTo(GRAPHBORDER,HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE);
		// vertical right
		ctx.moveTo(WIDTH - GRAPHBORDER,GRAPHBORDER);
		ctx.lineTo(WIDTH - GRAPHBORDER,HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE);
		// horizontal top
		ctx.moveTo(GRAPHBORDER - AXIS_TICK_SIZE,GRAPHBORDER);
		ctx.lineTo(WIDTH - GRAPHBORDER,GRAPHBORDER);
		// horizontal bottom
		ctx.moveTo(GRAPHBORDER - AXIS_TICK_SIZE,HEIGHT - GRAPHBORDER);
		ctx.lineTo(WIDTH - GRAPHBORDER, HEIGHT - GRAPHBORDER);

		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	
		// draw dashed lines at third intervals in graph
		ctx.globalAlpha = .2;
		ctx.save();
		ctx.strokeStyle = 'black';
		ctx.lineWIDTH = 1
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		var graphWidth = WIDTH - (2 * GRAPHBORDER)
		var graphHeight = HEIGHT - (2 * GRAPHBORDER)
	
		// vertical
		ctx.moveTo(GRAPHBORDER + (graphWidth / 3), GRAPHBORDER);
		ctx.lineTo(GRAPHBORDER + (graphWidth / 3), HEIGHT - GRAPHBORDER);
		ctx.moveTo(GRAPHBORDER + 2 * (graphWidth / 3), GRAPHBORDER);
		ctx.lineTo(GRAPHBORDER + 2 * (graphWidth / 3), HEIGHT - GRAPHBORDER);
		// horizontal
		ctx.moveTo(GRAPHBORDER, HEIGHT - GRAPHBORDER - (graphHeight / 3));
		ctx.lineTo(WIDTH - GRAPHBORDER, HEIGHT - GRAPHBORDER - (graphHeight / 3));
		ctx.moveTo(GRAPHBORDER, HEIGHT - GRAPHBORDER - 2 * (graphHeight / 3));
		ctx.lineTo(WIDTH - GRAPHBORDER, HEIGHT - GRAPHBORDER - 2 * (graphHeight / 3));
	
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
}

function labelAxes() {
	ctx.save();
	ctx.font = "12px Arial";
	ctx.globalAlpha = 1;

	// x-axis left
	ctx.fillText(Math.round(plotDataExtremes[1]["max"]), GRAPHBORDER - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// x-axis right
	ctx.fillText(Math.round(plotDataExtremes[1]["min"]), WIDTH - GRAPHBORDER - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// y-axis top
	ctx.fillText(Math.round(plotDataExtremes[0]["min"]), GRAPHBORDER - AXIS_TICK_SIZE - 30, GRAPHBORDER + 5);
	// y-axis bottom
	ctx.fillText(Math.round(plotDataExtremes[0]["max"]), GRAPHBORDER - AXIS_TICK_SIZE - 30, HEIGHT - GRAPHBORDER + 5);

	// x-axis label
	ctx.fillText("F2", WIDTH/2 - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// y-axis label
	ctx.fillText("F1", GRAPHBORDER - AXIS_TICK_SIZE - 25, HEIGHT/2 + 5);

	ctx.restore();
}