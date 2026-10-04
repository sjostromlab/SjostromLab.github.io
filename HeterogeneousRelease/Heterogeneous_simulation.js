// Bypass the legacy Plotly Safari download path using a PNG Blob.
function downloadPlotPNG(plot) {
  var filenames = {myDiv: 'HeterogeneousRelease_distribution', myDiv3: 'HeterogeneousRelease_cumulative'};
  return Plotly.toImage(plot, {
    format: 'png', width: plot._fullLayout.width, height: plot._fullLayout.height, scale: 2
  }).then(function(dataURL) {
    var binary = atob(dataURL.split(',')[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([bytes], {type: 'image/png'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = (filenames[plot.id] || 'HeterogeneousRelease_plot') + '.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
  }).catch(function(error) {
    console.error('PNG export failed:', error);
    window.alert('The PNG could not be generated. Please try again.');
  });
}

var config = {
  responsive: true,
  modeBarButtonsToRemove: ['toImage'],
  modeBarButtonsToAdd: [{
    name: 'Download plot as a png',
    icon: Plotly.Icons.camera,
    click: downloadPlotPNG
  }]
};

var layout = {
	title: '<b>Quantal Release</b>',
	height: 450,
	xaxis: {
		title: '<b>EPSC Amplitude (pA)</b>'
	},
	yaxis: {
		title: '<b>Probability</b>'
	},
	autosize: true,
	paper_bgcolor: '#c7c7c7',
	showlegend: false,
	hovermode: 'closest'
};

var layout2 = {
	title: '<b>Cumulative Plot</b>',
	height: 450,
	xaxis: {
		title: '<b>EPSC Amplitude (pA)</b>'
	},
	yaxis: {
		title: '<b>Counts (%)</b>'
	},
	autosize: true,
	paper_bgcolor: '#c7c7c7',
	showlegend: false,
};

var layout3 = {
	title: '<b>Cumulative Plot</b>',
	height: 450,
	xaxis: {
		title: '<b>EPSC Amplitude (pA)</b>'
	},
	yaxis: {
		title: '<b>Counts (%)</b>'
	},
	autosize: true,
	paper_bgcolor: '#c7c7c7',
	showlegend: false,
	bargap: 0.05
};

var layout4 = {
	title: '<b>Quantal Release</b>',
	height: 450,
	xaxis: {
		title: '<b>EPSC Amplitude (pA)</b>'
	},
	yaxis: {
		title: '<b>Probability</b>'
	},
	autosize: true,
	paper_bgcolor: '#c7c7c7',
	showlegend: false,
	bargap: 0.05
};

// Keep plot text, parameter labels, and summary statistics in step with the text-size slider.
function setAxisLabelSize(size) {
  document.querySelectorAll('.parameter-label, #myDiv2').forEach(function(label) {
    label.style.fontSize = size + 'px';
  });
  [layout, layout2, layout3, layout4].forEach(function(plotLayout) {
    var heading = plotLayout.title;
    plotLayout.title = {
      text: typeof heading === 'string' ? heading : heading.text,
      font: {size: size}
    };
    ['xaxis', 'yaxis'].forEach(function(axis) {
      var title = plotLayout[axis].title;
      plotLayout[axis].title = {
        text: typeof title === 'string' ? title : title.text,
        font: {size: size}
      };
      plotLayout[axis].tickfont = {size: size};
      plotLayout[axis].automargin = true;
    });
  });
}

setAxisLabelSize(22);

document.getElementById('axisFontSize').addEventListener('input', function(event) {
  var size = Number(event.target.value);
  setAxisLabelSize(size);
  document.getElementById('axisFontSizeValue').textContent = size + ' px';
  ['myDiv', 'myDiv3'].forEach(function(id) {
    Plotly.relayout(id, {
      'title.font.size': size,
      'xaxis.title.font.size': size,
      'yaxis.title.font.size': size,
      'xaxis.tickfont.size': size,
      'yaxis.tickfont.size': size,
      'xaxis.automargin': true,
      'yaxis.automargin': true
    });
  });
});

var expon = 5;

var n = 1;
var p_r = 0.6;
var p_2 = 0;
var p_3 = 0;
var q_1 = 6;
var q_2 = 0;
var q_3 = 0;

var noise = 0;	// 

var p_rMin = 0; //
var p_2Min = 0;	//
var p_3Min = 0;	//
var q_1Min = 0.5; 	//
var q_2Min = 0; 	//
var q_3Min = 0; 	//

var p_rMax = 1; 	//
var p_2Max = 1; 	//
var p_3Max = 1; 	//
var q_1Max = 20; 	//
var q_2Max = 20; 	//
var q_3Max = 20; 	//

var nStep = 1; 	//
var p_rStep = 0.01; 	//
var p_2Step = 0.01; 	//
var p_3Step = 0.01; 	//
var q_1Step = 0.5; 	//
var q_2Step = 0.5; 	//
var q_3Step = 0.5; 	//

var noiseMin = 0; 	//
var noiseMax = 6;
var noiseStep = 0.01;

var leftLocked = 0;
var bottomLocked = 0; 	//

var showingMore = 0; 	//

var theMean = 0;
var sq_Mean = 0;
var theSD = 0;
var theVar = 0;
var CV = 0;
var pTotal = 0;

var xAxis = [];
var yAxis = [];
var xdata = [];
var ydata = [];
var cumulative = [];
var yAxish = [];
var xdatah = [];
var ydatah = [];
var cumulativeh = [];



var userreset = document.getElementById("reset");
var usertoggle = document.getElementById("toggle");
var userhistogFlag = document.getElementById("histogram");
var userplinkFlag = document.getElementById("p_linked");
var userqlinkFlag = document.getElementById("q_linked");

var userp2hidden = document.getElementById("p2hidden");
var userp2hidden_max = document.getElementById("p2hidden_max");
var userp2hidden_grid = document.getElementById("p2hidden_grid");

var userp3hidden = document.getElementById("p3hidden");
var userp3hidden_max = document.getElementById("p3hidden_max");
var userp3hidden_grid = document.getElementById("p3hidden_grid");

var userq2hidden = document.getElementById("q2hidden");
var userq2hidden_max = document.getElementById("q2hidden_max");
var userq2hidden_grid = document.getElementById("q2hidden_grid");

var userq3hidden = document.getElementById("q3hidden");
var userq3hidden_max = document.getElementById("q3hidden_max");
var userq3hidden_grid = document.getElementById("q3hidden_grid");

var usermorePanel = document.getElementById("morePanel");
var usermean = document.getElementById("mean");
var usersDev = document.getElementById("sDev");
var userCV = document.getElementById("CV");

var usernumOfSyn = document.getElementById("numOfSyn");
var userrelPro = document.getElementById("relPro");
var userrelPro2 = document.getElementById("relPro2");
var userrelPro3 = document.getElementById("relPro3");
var userpRange = document.getElementById("pRange");
var userp2Range = document.getElementById("p2Range");
var userp3Range = document.getElementById("p3Range");
var userquanAmp1 = document.getElementById("quanAmp1");
var userquanAmp2 = document.getElementById("quanAmp2");
var userquanAmp3 = document.getElementById("quanAmp3");
var userq1Range = document.getElementById("q_1Range");
var userq2Range = document.getElementById("q_2Range");
var userq3Range = document.getElementById("q_3Range");

var userpMax = document.getElementById("pMax");
var userp2Max = document.getElementById("p2Max");
var userp3Max = document.getElementById("p3Max");
var userq_1Max = document.getElementById("q_1Max");
var userq_2Max = document.getElementById("q_2Max");
var userq_3Max = document.getElementById("q_3Max");

var usernoise = document.getElementById("noise");
var usernoiseRange = document.getElementById("noiseRange");

var usermoreLegend = document.getElementById("moreLegend");
var usernVal = parseInt(document.getElementById('numOfSyn').value);
var userpVal = document.getElementById("pVal");
var userp2Val = document.getElementById("p2Val");
var userp3Val = document.getElementById("p3Val");
var userq1Val = document.getElementById("q_1Val");
var userq2Val = document.getElementById("q_2Val");
var userq3Val = document.getElementById("q_3Val");
var usernoiseVal = document.getElementById("noiseVal");
var usermeanVal = document.getElementById("meanVal");
var usersDevVal = document.getElementById("sDevVal");
var userCVVal = document.getElementById("CVVal");
var userpTotal = document.getElementById("pTotal");
var userp2Total = document.getElementById("p2Total");
var userp3Total = document.getElementById("p3Total");


document.getElementById("reset").addEventListener("click", resetPanel);
document.getElementById("toggle").addEventListener("click", toggle);
document.getElementById("p_linked").addEventListener("click", link_p);
document.getElementById("q_linked").addEventListener("click", link_q);

document.getElementById("numOfSyn").addEventListener("input", submit);
document.getElementById("relPro").addEventListener("input", submit);
document.getElementById("relPro2").addEventListener("input", submit);
document.getElementById("relPro3").addEventListener("input", submit);
document.getElementById("pRange").addEventListener("input", submitSlider);
document.getElementById("p2Range").addEventListener("input", submitSlider);
document.getElementById("p3Range").addEventListener("input", submitSlider);
document.getElementById("quanAmp1").addEventListener("input", submit);
document.getElementById("quanAmp2").addEventListener("input", submit);
document.getElementById("quanAmp3").addEventListener("input", submit);
document.getElementById("q_1Range").addEventListener("input", submitSlider);
document.getElementById("q_2Range").addEventListener("input", submitSlider);
document.getElementById("q_3Range").addEventListener("input", submitSlider);

document.getElementById("pMax").addEventListener("change", submit);
document.getElementById("p2Max").addEventListener("change", submit);
document.getElementById("p3Max").addEventListener("change", submit);
document.getElementById("q_1Max").addEventListener("change", submit);
document.getElementById("q_2Max").addEventListener("change", submit);
document.getElementById("q_3Max").addEventListener("change", submit);

document.getElementById("noise").addEventListener("input", submit);
document.getElementById("noiseRange").addEventListener("input", submitSlider);
document.getElementById("histogram").addEventListener("change", draw);
document.getElementById("p_linked").addEventListener("change", draw);
document.getElementById("q_linked").addEventListener("change", draw);

let pq2 = [userp2hidden, userq2hidden, userp2hidden_max, userq2hidden_max,
	userp2hidden_grid, userq2hidden_grid];
let p2_all = [userp2hidden, userp2hidden_max, userp2hidden_grid];
let q2_all = [userq2hidden, userq2hidden_max, userq2hidden_grid];

let pq3 = [userp3hidden, userq3hidden, userp3hidden_max, userq3hidden_max,
	userp3hidden_grid, userq3hidden_grid];
let p3_all = [userp3hidden, userp3hidden_max, userp3hidden_grid];
let q3_all = [userq3hidden, userq3hidden_max, userq3hidden_grid];

cal_Mean();

window.addEventListener("load", (event) => {
	initialize();
});


function get_Axis(n, ps, qs, xAxis, yAxis) {
	let mergedPoints = {};
	const totalComb = 1 << n;

	for (let mask = 0; mask < totalComb; mask++) {
		let prob = 1;
		let amp = 0;

		for (let i = 0; i < n; i++) {
			if (mask & (1 << i)) {
				prob *= ps[i];
				amp += qs[i];
			} else {
				prob *= (1 - ps[i]);
			}
		}

		if (mergedPoints[amp]) {
			mergedPoints[amp] += prob;
		} else {
			mergedPoints[amp] = prob;
		}
	}


	let finalPoints = [];
	for (let x in mergedPoints) {
		finalPoints.push({ x: parseFloat(x), y: mergedPoints[x] });
	}
	finalPoints.sort((a, b) => a.x - b.x);

	for (let pt of finalPoints) {
		xAxis.push(pt.x);
		yAxis.push(pt.y);
	}

}



function initialize() {
	usernumOfSyn.value = n;
	userrelPro.value = p_r;
	userpRange.value = p_r;
	userrelPro2.value = p_2;
	userp2Range.value = p_2;
	userrelPro3.value = p_3;
	userp3Range.value = p_3;
	userquanAmp1.value = q_1;
	userquanAmp2.value = q_2;
	userquanAmp3.value = q_3;
	userq1Range.value = q_1;
	userq2Range.value = q_2;
	userq3Range.value = q_3;
	userpMax.value = p_rMax;
	userp2Max.value = p_2Max;
	userp3Max.value = p_3Max;
	userq_1Max.value = q_1Max;
	userq_2Max.value = q_2Max;
	userq_3Max.value = q_3Max;
	usernoise.value = noise;
	usernoiseRange.value = noise;
	for (let j = 0; j < pq3.length; j++) {
		hide(pq2[j], true);
		hide(pq3[j], true);
	}

	graph();
	updateLegend();
	draw();
}

function updateLegend() {
	usernVal.innerHTML = n;
	userpVal.innerHTML = p_r;
	userp2Val.innerHTML = p_2;
	userp3Val.innerHTML = p_3;
	userq1Val.innerHTML = q_1;
	userq2Val.innerHTML = q_2;
	userq3Val.innerHTML = q_3;
	usernoiseVal.innerHTML = noise;
	usermeanVal.innerHTML = theMean.toFixed(2);
	usersDevVal.innerHTML = theSD.toFixed(3);
	userCVVal.innerHTML = CV.toFixed(3);
	usermean.value = theMean.toFixed(3);
	usersDev.value = theSD.toFixed(5);
	userCV.value = CV.toFixed(6);
	userpTotal.innerHTML = pTotal.toFixed(4);
}

function submitSlider(event) {
	event.preventDefault();
	userrelPro.value = userpRange.value;
	userrelPro2.value = userp2Range.value;
	userrelPro3.value = userp3Range.value;
	userquanAmp1.value = userq1Range.value;
	userquanAmp2.value = userq2Range.value;
	userquanAmp3.value = userq3Range.value;
	usernoise.value = usernoiseRange.value;
	submit(event);
}


function resetPanel(event) {
	event.preventDefault();

	userhistogFlag.checked = false;
	userplinkFlag.checked = false;
	userqlinkFlag.checked = false;

	n = 1;
	p_r = 0.6;
	p_2 = 0;
	p_3 = 0;
	q_1 = 6;
	q_2 = 0;
	q_3 = 0;
	p_rMax = 1;
	p_2Max = 1;
	p_3Max = 1;
	q_1Max = 20;
	q_2Max = 20;
	q_3Max = 20;
	noise = 0;

	cal_Mean();
	initialize();
}

function submit(event) {
	event.preventDefault();

	p_rMax = parseFloat(userpMax.value);
	p_2Max = parseFloat(userp2Max.value);
	p_3Max = parseFloat(userp3Max.value);
	q_1Max = parseFloat(userq_1Max.value);
	q_2Max = parseFloat(userq_2Max.value);
	q_3Max = parseFloat(userq_3Max.value);
	foolProve();
	updateSlider();

	userpRange.value = userrelPro.value;
	userp2Range.value = userrelPro2.value;
	userp3Range.value = userrelPro3.value;
	userq1Range.value = userquanAmp1.value;
	userq2Range.value = userquanAmp2.value;
	userq3Range.value = userquanAmp3.value;
	usernoiseRange.value = usernoise.value;

	n = parseFloat(usernumOfSyn.value);
	p_r = parseFloat(userrelPro.value);

	if (userplinkFlag.checked) {
		p_2 = p_r;
		p_3 = p_r;
		for (let j = 0; j < p3_all.length; j++) {
			fade(p2_all[j], true);
			fade(p3_all[j], true);
		}
	}
	else {
		p_2 = parseFloat(userrelPro2.value);
		p_3 = parseFloat(userrelPro3.value);

		for (let i = 0; i < p2_all.length; i++) {
			fade(p2_all[i], false);
		}

		if (n == 3) {

			for (let i = 0; i < p3_all.length; i++) {
				fade(p3_all[i], false);
			}

		}
	}

	q_1 = parseFloat(userquanAmp1.value);

	if (userqlinkFlag.checked) {
		q_2 = q_1;
		q_3 = q_1;
		for (let j = 0; j < q3_all.length; j++) {
			fade(q2_all[j], true);
			fade(q3_all[j], true);
		}
	}
	else {
		q_2 = parseFloat(userquanAmp2.value);
		q_3 = parseFloat(userquanAmp3.value);

		for (let i = 0; i < p2_all.length; i++) {
			fade(q2_all[i], false);
		}

		if (n == 3) {
			for (let i = 0; i < q3_all.length; i++) {
				fade(q3_all[i], false);
			}
		}
	}

	noise = parseFloat(usernoise.value);


	if (n == 2 || n == 3) {
		for (let i = 0; i < pq2.length; i++) {
			hide(pq2[i], false);
		}

		if (n == 3) {
			for (let j = 0; j < pq3.length; j++) {
				hide(pq3[j], false);
			}
		}
		else {
			for (let j = 0; j < pq3.length; j++) {
				hide(pq3[j], true);
			}
		}

	}

	else {
		for (let j = 0; j < pq3.length; j++) {
			hide(pq2[j], true);
			hide(pq3[j], true);
		}
	}

	cal_Mean();
	graph();
	updateLegend();
	draw();
}


function graph() {
	pTotal = 0;
	t = Math.pow(10, expon);
	margin = Math.pow(10, (expon - 1));

	if (n == 2) {
		max_q = Math.max(q_1, q_2);
		V_max = q_1 + q_2;

	}
	else if (n == 3) {
		max_q = Math.max(q_1, q_2, q_3);
		V_max = q_1 + q_2 + q_3;
	}
	else {
		max_q = q_1;
		V_max = q_1;
	}

	if (noise) {margin = Math.floor(t * 3 * noise / V_max) };

	xAxis = [];
	yAxis = [];
	

	xdata = [];
	ydata = [];
	cumulative = [];

	yAxish = [];
	xdatah = [];
	ydatah = [];
	cumulativeh = [];

	let ps = [p_r, p_2, p_3];
	let qs = [q_1, q_2, q_3];

	get_Axis(n, ps, qs, xAxis, yAxis);

	var xholder = xAxis.slice().reverse();
	var yholder = yAxis.slice().reverse();

	for (var i = -margin; i <= (t + margin); i++) {
		let x_val;
		let y_val = 0;

		if (noise == 0) {
			x_val = i / t * V_max;
		} 
		
		else {
			if (i < 0) {
				x_val = i / margin * 3 * noise;
			} 
			
			else if (i >= 0 && i <= t) {
				x_val = i / t * V_max;
				
			} 
			
			else {
				x_val = (i - t) / margin * 3 * noise + V_max;
			}
		}

		xdata.push(x_val);


		if (xholder.length > 0 && Math.abs(x_val - xholder[xholder.length - 1]) < V_max / t / 1.5) {
			xholder.pop();
			y_val = yholder.pop()
		} 
		
		ydata.push(y_val);
		pTotal += y_val;
		cumulative.push(pTotal * 100);
	}

	if (noise) {
		pTotal = 0;
		xholder = xAxis.slice().reverse();
		var sigma = noise;
		var mu = 0;

		for (var x = -margin; x <= (t + margin); x++) {
			ydata[x + margin] = 0;
			cumulative[x + margin] = 0;
			xpos = xdata[x + margin];
			
			for (var i = 0; i < xAxis.length; i++) {
				mu = xAxis[i];
				ydata[x + margin] += yAxis[i] * Math.exp(-0.5 * Math.pow(((xpos - mu) / sigma), 2)) / (sigma * Math.sqrt(2 * Math.PI));
			}
			
			if (x < 0 || x > t) {
				pTotal += ydata[x + margin] * 3 * noise / margin;
			} 
			
			else {
				pTotal += ydata[x + margin] * V_max / t;
			}
			
			cumulative[x + margin] = (pTotal * 100).toFixed(4);
		}

		for (var x = -margin; x <= (t + margin); x++) {
			var holder = ydata[x + margin];
			if (x < 0 || x > t) {
				ydata[x + margin] = holder * 3 * noise / margin / pTotal;
			} 
			
			else {
				ydata[x + margin] = holder * V_max / t / pTotal;
			}
		}

		yAxis = [];
		for (var i = 0; i < xdata.length; i++) {
			var omg = xdata[i];
			if (xholder.length > 0 && Math.abs(omg - xholder[xholder.length - 1]) < V_max / t) {
				xholder.pop();
				yAxis.push(ydata[i]);
			}
		}
		

	}

	//histogram a-axis 
	var binwidth = 0;
	if (noise) {
		var xrange = V_max + 6 * noise;
		binwidth = xrange / 50;
		for (var i = 0; i < 51; i++) {
			xdatah.push(i / 50 * xrange - 3 * noise);
		}
	} 
	
	else {
		var xrange = V_max * 6 / 5;
		binwidth = xrange / 50;
		for (var i = 0; i < 51; i++) {
			xdatah.push(i / 50 * xrange - V_max / 10);
		}
	}

	//culmulative histogram y-axis 
	xholder = xdatah.slice().reverse();
	for (var i = 0; i < xdata.length; i++) {
		if (xholder.length > 0 && Math.abs(xdata[i] - xholder[xholder.length - 1]) < V_max / t) {
			xholder.pop();
			cumulativeh.push(cumulative[i]);
		}
	}

	//Q-release histogram y-axis 
	xholder = xdatah.slice().reverse();
	var currbin = xholder.pop();
	var itracker = 0;
	var bucket = 0;
	
	while (itracker < xdata.length) {
		if (Math.abs(xdata[itracker] - currbin) <= binwidth / 2) {
			bucket += ydata[itracker];
		} 
		
		else {
			ydatah.push(bucket);
			bucket = 0;
			currbin = xholder.pop();
			bucket += ydata[itracker];
		}

		itracker++;
	}

	xholder = xAxis.slice().reverse();
	currbin = xholder.pop();
	itracker = 0;
	bucket = 0;
	
	while (itracker < xdata.length) {
		if (Math.abs(xdata[itracker] - currbin) <= binwidth / 2) {
			bucket += ydata[itracker];
		} 
		
		else if ((xdata[itracker] - currbin) > binwidth / 2) {
			yAxish.push(bucket);
			bucket = 0;
			currbin = xholder.pop();
		}

		itracker++;
	}

}

function draw() {
	var Q_release = {
		x: xdata,
		y: ydata,
		fill: 'tozeroy',
		type: 'scatter',
		name: 'Q_release',
		line: {
			color: 'rgb(33, 118, 255)',
			width: 2
		},
		hoverinfo: 'x+y'
	};

	var m = {
		x: xAxis,
		y: yAxis,
		type: 'scatter',
		mode: 'markers',
		name: 'Markers',
		marker: {
			color: 'rgb(255, 255, 255)',
			size: 10,
			line: {
				color: 'rgb(33, 118, 255)',
				width: 2
			}
		},
		hoverinfo: 'x+y'
	};

	var cumul = {
		x: xdata,
		y: cumulative,
		fill: 'tozeroy',
		fillcolor: '',
		type: 'scatter',
		name: 'cumulative',
		line: {
			color: 'rgb(33, 118, 255)',
			width: 2
		}
	};

	var mh = {
		x: xAxis,
		y: yAxish,
		type: 'scatter',
		mode: 'markers',
		name: 'Markers',
		marker: {
			color: 'rgb(255, 255, 255)',
			size: 10,
			line: {
				color: 'rgb(33, 118, 255)',
				width: 2
			}
		},
		hoverinfo: 'x+y'
	};

	var Q_releaseh = {
		x: xdatah,
		y: ydatah,
		type: 'bar',
		name: 'Q_release histogram',
		marker: {
			color: 'rgb(33, 118, 255)',
		},
		hoverinfo: 'x+y'
	};

	var cumulh = {
		x: xdatah,
		y: cumulativeh,
		type: 'bar',
		name: 'cumulative histogram',
		marker: {
			color: 'rgb(33, 118, 255)',
		}
	};

	//Plotly.newPlot('myDiv', [Q_release, m], layout, config); 
	if (userhistogFlag.checked) {
		Plotly.newPlot('myDiv', [Q_releaseh, mh], layout4, config);
		Plotly.newPlot('myDiv3', [cumulh], layout3, config);
	} 
	
	else {
		Plotly.newPlot('myDiv', [Q_release, m], layout, config);
		Plotly.newPlot('myDiv3', [cumul], layout2, config);
	}
}

function toggle() {
	if (usertoggle.value.localeCompare("Show more") == 0) {
		usertoggle.value = "Show less";
		usermorePanel.classList.remove("hidden");
		usermoreLegend.classList.remove("hidden");
		usermorePanel.classList.add("shown");
		usermoreLegend.classList.add("shown");
	} 
	
	else {
		usertoggle.value = "Show more";
		usermorePanel.classList.remove("shown");
		usermoreLegend.classList.remove("shown");
		usermorePanel.classList.add("hidden");
		usermoreLegend.classList.add("hidden");

	}

}

function link_p() {
	if (userplinkFlag.checked && (n == 2 || n == 3)) {
		p_2 = p_r;

		for (let i = 0; i < p2_all.length; i++) {
			fade(p2_all[i], true);
		}

		if (n == 3) {
			p_3 = p_r;

			for (let i = 0; i < p3_all.length; i++) {
				fade(p3_all[i], true);
			}
		}
	}

	else {
		p_2 = parseFloat(userrelPro2.value);

		for (let i = 0; i < p2_all.length; i++) {
			fade(p2_all[i], false);
		}

		if (n == 3) {
			p_3 = parseFloat(userrelPro3.value);

			for (let i = 0; i < p3_all.length; i++) {
				fade(p3_all[i], false);
			}

		}
	}

	cal_Mean();
	graph();
}

function link_q() {
	if (userqlinkFlag.checked && (n == 2 || n == 3)) {
		q_2 = q_1;

		for (let i = 0; i < q2_all.length; i++) {
			fade(q2_all[i], true);
		}

		if (n == 3) {
			q_3 = q_1;

			for (let i = 0; i < q3_all.length; i++) {
				fade(q3_all[i], true);
			}
		}
	}

	else {
		q_2 = parseFloat(userquanAmp2.value);

		for (let i = 0; i < q2_all.length; i++) {
			fade(q2_all[i], false);
		}

		if (n == 3) {
			q_3 = parseFloat(userquanAmp3.value);

			for (let i = 0; i < q3_all.length; i++) {
				fade(q3_all[i], false);
			}
		}
	}

	cal_Mean();
	graph();
}

function hide(ele, show) {
	ele.classList.remove(show ? 'shown' : 'hidden');
	ele.classList.add(show ? 'hidden' : 'shown');
}

function fade(ele, show) {
	ele.classList.remove(show ? 'shown' : 'fadeout');
	ele.classList.add(show ? 'fadeout' : 'shown');
}

function cal_Mean() {
	const q = [q_1, q_2, q_3];
	const p = [p_r, p_2, p_3];


	theMean = 0;
	sq_Mean = 0;

	const totalComb = 1 << n;

	for (let mask = 1; mask < totalComb; mask++) {
		let prob = 1;
		let amp = 0;

		for (let i = 0; i < n; i++) {
			if (mask & (1 << i)) {
				prob *= p[i];
				amp += q[i];
			} 
			
			else {
				prob *= (1 - p[i]);
			}
		}

		theMean += prob * amp;
		sq_Mean += prob * (amp ** 2);
	}
	theVar = sq_Mean - theMean ** 2;
	theSD = Math.sqrt(theVar);
	CV = theSD / theMean;

	console.log(sq_Mean);

	updateLegend();
}


function foolProve() {
	if (userrelPro.value < p_rMin) { userrelPro.value = p_rMin; }
	if (userrelPro.value > p_rMax) { userrelPro.value = p_rMax; }
	if (userrelPro2.value < p_2Min) { userrelPro2.value = p_2Min; }
	if (userrelPro2.value > p_2Max) { userrelPro2.value = p_2Max; }
	if (userrelPro3.value < p_3Min) { userrelPro3.value = p_3Min; }
	if (userrelPro3.value > p_3Max) { userrelPro3.value = p_3Max; }
	if (userquanAmp1.value < q_1Min) { userquanAmp1.value = q_1Min; }
	if (userquanAmp1.value > q_1Max) { userquanAmp1.value = q_1Max; }
	if (userquanAmp2.value < q_2Min) { userquanAmp2.value = q_2Min; }
	if (userquanAmp2.value > q_2Max) { userquanAmp2.value = q_2Max; }
	if (userquanAmp3.value < q_3Min) { userquanAmp3.value = q_3Min; }
	if (userquanAmp3.value > q_3Max) { userquanAmp3.value = q_3Max; }
	if (usernoise.value < noiseMin) { usernoise.value = noiseMin; }
	if (usernoise.value > noiseMax) { usernoise.value = noiseMax; }
}

function updateSlider() {
	userpRange.min = p_rMin;
	userpRange.max = p_rMax;
	userp2Range.min = p_2Min;
	userp2Range.max = p_2Max;
	userp3Range.min = p_3Min;
	userp3Range.max = p_3Max;
	userq1Range.min = q_1Min;
	userq1Range.max = q_1Max;
	userq2Range.min = q_2Min;
	userq2Range.max = q_2Max;
	userq3Range.min = q_3Min;
	userq3Range.max = q_3Max;
	usernoiseRange.min = noiseMin;
	usernoiseRange.max = noiseMax;
}