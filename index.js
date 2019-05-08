// Global variables

const YCOLUMN = 1
var DRAWDELAY = 1000
var GRAPHBORDER = 60 	// distance between graph and canvas
var DATABORDER = .05 	// proportion of gap between graph and data in graph
var AXIS_TICK_SIZE = 10
var HEIGHT = 700
var WIDTH = 700
var COLORS = ['red','blue','green','orange','purple']


var canvas; 
var ctx;
var data;
var labels;
var means = [];
var assignments = [];
var dataExtremes;
var dataRange;

var promise;

var Session = /** @class */ (function () {
	function Session() {
		var _this = this;
		document.getElementById('input-file').addEventListener('change', _this.run)
		document.getElementById('run_button').addEventListener('click', console.log('click'))
	}
	
	function readFileContent(file) {
		const reader = new FileReader()
	  return new Promise((resolve, reject) => {
		reader.onload = event => resolve(event.target.result)
		reader.onerror = error => reject(error)
		reader.readAsText(file)
	  })
	}

	Session.prototype.run = function (event) {

		data = [];
		means = [];
		assignments = [];

		const input = event.target
		if ('files' in input && input.files.length > 0) {
			promise = readFileContent(input.files[0]).then(content => {

				// read has succesfully occurred

				text = content
				//console.log("in readFileContent: \n" + text)
				
				var allData = text.split('\n');

				for(var i = 0; i < allData.length; i++) {
					var temp = allData[i].split(',');
					allData[i] = temp;
				}
		
				var X = [];
				var Y = [];
		
				//console.log('allData')
				for(var i = 1; i < allData.length; i++) {
					//console.log(allData[i]);
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
		
				/*console.log('Y')
				console.log(Y)
				console.log('X')
				console.log(X)*/

				data = X
				labels = Y
				kmeans(5)
			}).catch(error => console.log(error))
		}
	};
	return Session;
}());

function kmeans(k) {
	setup(k)
}

function setup(k) {

	dataExtremes = getDataExtremes(data);
	dataRange = getDataRanges(dataExtremes);
	means = initMeans(k);

	makeAssignments();
	draw();

	setTimeout(run, DRAWDELAY);
}

function getDataRanges(extremes) {
	var ranges = [];
	for (var dimension in extremes)
	{
		ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
	}
	return ranges;
}

function getDataExtremes(points) {
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

	// add data border by pushing out extremes
	for (var dimension in extremes) {
		extremes[dimension].min -= DATABORDER * extremes[dimension].min
		extremes[dimension].max += DATABORDER * extremes[dimension].max
	}

	return extremes;
}

function initMeans(k) {
	if ( ! k ) {
		k = 3;
	}
	while (k--) {
		var mean = [];

		for (var dimension in dataExtremes) {
			mean[dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
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
			console.log("Mean with no points");
			console.log(sums[mean_index]);

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

function run() {
	var moved = moveMeans();
	draw();

	if (moved) {
		setTimeout(run, DRAWDELAY);
	} else {
		// algorithm has found clusters
		document.getElementById('results').innerHTML = "Done!"
	}
}

function draw() {
	/*console.log('data')
	console.log(data)
	console.log('labels')
	console.log(labels)
	console.log('assignments')
	console.log(assignments)    
	console.log('means')
	console.log(means)*/

	// clear canvas
	ctx.clearRect(0,0,WIDTH, HEIGHT);

	setupGraph();
	labelAxes();
	
	// draw lines between points and mean
	//drawLines()
	
	// draw points
	drawData()

	// draw means
	drawMeans()
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
		var y = (point[0] - dataExtremes[0].min + 1) * (WIDTH / (dataRange[0] + 2) );
		var x = (point[1] - dataExtremes[1].min + 1) * (HEIGHT / (dataRange[1] + 2) );

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
		ctx.lineWidth = 2
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
			(point[0] - dataExtremes[0].min + 1) * (WIDTH / (dataRange[0] + 2) ),
			(point[1] - dataExtremes[1].min + 1) * (HEIGHT / (dataRange[1] + 2) )
		);
		ctx.lineTo(
			(mean[0] - dataExtremes[0].min + 1) * (WIDTH / (dataRange[0] + 2) ),
			(mean[1] - dataExtremes[1].min + 1) * (HEIGHT / (dataRange[1] + 2) )
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
	ctx.fillText(Math.round(dataExtremes[1]["max"]), GRAPHBORDER - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// x-axis right
	ctx.fillText(Math.round(dataExtremes[1]["min"]), WIDTH - GRAPHBORDER - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// y-axis top
	ctx.fillText(Math.round(dataExtremes[0]["min"]), GRAPHBORDER - AXIS_TICK_SIZE - 30, GRAPHBORDER + 5);
	// y-axis bottom
	ctx.fillText(Math.round(dataExtremes[0]["max"]), GRAPHBORDER - AXIS_TICK_SIZE - 30, HEIGHT - GRAPHBORDER + 5);

	// x-axis label
	ctx.fillText("F2", WIDTH/2 - 10, HEIGHT - GRAPHBORDER + AXIS_TICK_SIZE + 15);
	// y-axis label
	ctx.fillText("F1", GRAPHBORDER - AXIS_TICK_SIZE - 25, HEIGHT/2 + 5);

	ctx.restore();
}

// start the app
canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
setupGraph();
new Session();