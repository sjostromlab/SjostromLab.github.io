var config = {responsive: true};

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

function binomial(n, k) {
    var coeff = 1;
    var i;
 
    if (k < 0 || k > n) return 0;
 
    for (i = 0; i < k; i++) {
        coeff = coeff * (n - i) / (i + 1);
    }
 
    return coeff;
}

function binomDist(n,p_r,q,xAxis,yAxis) { 
	var i = 0; 
	for (i = 0; i < n+1; i++) {
		xAxis.push(i*q); 
		yAxis.push(binomial(n,i)*Math.pow(p_r,i)*Math.pow((1-p_r),(n-i)));
	} 
}

function initialize(){
	usernumOfSyn.value = n; 
	usernRange.value = n; 
	userrelPro.value = p_r; 
	userpRange.value = p_r; 
	userquanAmp.value = q; 
	userqRange.value = q; 
	usernMax.value = nMax; 
	userpMax.value = p_rMax; 
	userqMax.value = qMax; 
	usernoise.value = noise; 
	usernoiseRange.value = noise; 
  
	graph(); 
	updateLegend(); 
	draw(); 
}

function updateLegend(){
	usernVal.innerHTML = n; 
	userpVal.innerHTML = p_r; 
	userqVal.innerHTML = q; 
	usernoiseVal.innerHTML = noise; 
	usermeanVal.innerHTML = theMean.toFixed(2); 
	usersDevVal.innerHTML = theSD.toFixed(3); 
	userCVVal.innerHTML = CV.toFixed(3); 
	usermean.value = theMean.toFixed(3);
	usersDev.value = theSD.toFixed(5);
	userCV.value = CV.toFixed(6); 
	userpTotal.innerHTML = pTotal; 
} 

function submitSlider(event) { 
	event.preventDefault(); 
	usernumOfSyn.value = usernRange.value; 
	userrelPro.value = userpRange.value; 
	userquanAmp.value = userqRange.value; 
	usernoise.value = usernoiseRange.value; 
	submit(event); 
}

var expon = 5; 

var n = 5; 
var p_r = 0.6; 
var q = 6; 

var noise = 0;	// 
 
var nMin = 1;	//
var p_rMin = 0; 	//
var qMin = 0.5; 	//

var nMax = 25; 	//
var p_rMax = 1; 	//
var qMax = 20; 	//

var nStep = 1; 	//
var p_rStep = 0.01; 	//
var qStep = 0.5; 	//

var noiseMin = 0; 	//
var noiseMax = 6; 
var noiseStep = 0.01; 

var leftLocked = 0; 
var bottomLocked = 0; 	//

var showingMore = 0; 	//

var theMean = 0; 
var theSD = 0; 
var CV = 0; 
var pTotal = 0; 

theMean = n*p_r*q;
theSD = Math.sqrt(n*p_r*(1-p_r))*q;
CV = Math.sqrt((1-p_r)/(n*p_r));
pTotal = 1; 

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

var usermorePanel = document.getElementById("morePanel"); 
var usermean = document.getElementById("mean"); 
var usersDev = document.getElementById("sDev"); 
var userCV = document.getElementById("CV"); 

var usernumOfSyn = document.getElementById("numOfSyn"); 
var usernRange = document.getElementById("nRange"); 
var userrelPro = document.getElementById("relPro"); 
var userpRange = document.getElementById("pRange"); 
var userquanAmp = document.getElementById("quanAmp"); 
var userqRange = document.getElementById("qRange"); 

var usernMax = document.getElementById("nMax"); 
var userpMax = document.getElementById("pMax"); 
var userqMax = document.getElementById("qMax"); 

var usernoise = document.getElementById("noise"); 
var usernoiseRange = document.getElementById("noiseRange"); 

var usermoreLegend = document.getElementById("moreLegend"); 
var usernVal = document.getElementById("nVal"); 
var userpVal = document.getElementById("pVal"); 
var userqVal = document.getElementById("qVal"); 
var usernoiseVal = document.getElementById("noiseVal"); 
var usermeanVal = document.getElementById("meanVal"); 
var usersDevVal = document.getElementById("sDevVal"); 
var userCVVal = document.getElementById("CVVal"); 
var userpTotal = document.getElementById("pTotal"); 

document.getElementById("reset").addEventListener("click", resetPanel); 
document.getElementById("toggle").addEventListener("click", toggle); 

document.getElementById("numOfSyn").addEventListener("input", submit); 
document.getElementById("nRange").addEventListener("input", submitSlider); 
document.getElementById("relPro").addEventListener("input", submit); 
document.getElementById("pRange").addEventListener("input", submitSlider); 
document.getElementById("quanAmp").addEventListener("input", submit); 
document.getElementById("qRange").addEventListener("input", submitSlider); 

document.getElementById("nMax").addEventListener("change", submit); 
document.getElementById("pMax").addEventListener("change", submit); 
document.getElementById("qMax").addEventListener("change", submit); 

document.getElementById("noise").addEventListener("input", submit); 
document.getElementById("noiseRange").addEventListener("input", submitSlider); 
document.getElementById("histogram").addEventListener("change", draw); 


window.addEventListener("load", (event) => {
  initialize(); 
});

function resetPanel(event) {
	event.preventDefault(); 
	
	n = 5; 
	p_r = 0.6; 
	q = 6; 
	nMax = 25; 
	p_rMax = 1; 
	qMax = 20; 
	noise = 0; 
	
	theMean = n*p_r*q;
	theSD = Math.sqrt(n*p_r*(1-p_r))*q;
	CV = Math.sqrt((1-p_r)/(n*p_r));
	pTotal = 1; 
	
	initialize(); 
}

function submit(event) {
  event.preventDefault(); 
  
  nMax = parseFloat(usernMax.value); 
  p_rMax = parseFloat(userpMax.value); 
  qMax = parseFloat(userqMax.value); 
  foolProve(); 
  updateSlider();
  
  usernRange.value = usernumOfSyn.value; 
  userpRange.value = userrelPro.value; 
  userqRange.value = userquanAmp.value; 
  usernoiseRange.value = usernoise.value; 
  
  n = parseFloat(usernumOfSyn.value); 
  p_r = parseFloat(userrelPro.value);
  q = parseFloat(userquanAmp.value); 
  
  noise = parseFloat(usernoise.value); 
  
  

  theMean = n*p_r*q; 
  theSD = Math.sqrt(n*p_r*(1-p_r))*q; 
  CV = Math.sqrt((1-p_r)/(n*p_r)); 
  
  graph();
  updateLegend(); 
  draw(); 
}


function graph() {
  pTotal = 0; 	
  t = Math.pow(10,expon); 
  margin = Math.pow(10,(expon-1)); 
  if (noise) {margin = Math.floor(t*3*noise/(n*q))}; 
  xAxis = []; 
  yAxis = []; 
  xdata = []; 
  ydata = []; 
  cumulative = []; 
  yAxish = []; 
  xdatah = []; 
  ydatah = []; 
  cumulativeh = []; 
  
  binomDist(n,p_r,q,xAxis,yAxis); 
  var V_max = n*q; 
  var xholder = xAxis.slice().reverse(); 
  var yholder = yAxis.slice().reverse();  
  
  for (var i = -margin; i <= (t+margin); i++) {
	  if (noise == 0){
		  var point = i/t*V_max; 
		  xdata.push(point); 
	  }else{
		  if (i < 0){
			  var point = i/margin*3*noise; 
			  xdata.push(point); 
		  }else if (i >= 0 && i <= t){
			  var point = i/t*V_max; 
			  xdata.push(point); 
		  }else{
			  var point = (i-t)/margin*3*noise; 
			  xdata.push(V_max+point); 
		  }
	  }
	  if (xholder.length > 0 && Math.abs(point-xholder[xholder.length-1]) < V_max/t/1.5){
		  xholder.pop(); 
		  ydata.push(yholder.pop()); 
		  pTotal += ydata[ydata.length-1];
	  } else {
		  ydata.push(0); 
	  }
	  cumulative.push(pTotal*100); 
  }
  
  if (noise){
	  pTotal = 0; 
	  xholder = xAxis.slice().reverse();  
	  var sigma = noise; 
	  var mu = 0; 
	  
	  for (var x = -margin; x <= (t+margin); x++) {
		  ydata[x+margin] = 0; 
		  cumulative[x+margin] = 0; 
		  xpos = xdata[x+margin]; 
		  for (var i = 0; i < xAxis.length; i++) {
			  mu = xAxis[i]; 
			  ydata[x+margin] += yAxis[i]*Math.exp(-0.5*Math.pow(((xpos-mu)/sigma),2))/(sigma*Math.sqrt(2*Math.PI));
		  }
		  if (x < 0 || x > t){
			  pTotal += ydata[x+margin]*3*noise/margin; 
		  }else{
			  pTotal += ydata[x+margin]*V_max/t; 
		  }
		  cumulative[x+margin] = pTotal*100; 
	  }
	  
	  for (var x = -margin; x <= (t+margin); x++){
		  var holder = ydata[x+margin]; 
		  if (x < 0 || x > t){
			  ydata[x+margin] = holder*3*noise/margin/pTotal; 
		  }else{
			  ydata[x+margin] = holder*V_max/t/pTotal; 
		  }
	  }
	  
	  yAxis = []; 
	  for (var i = 0; i < xdata.length; i++) {
		  var omg = xdata[i]; 
		  if (xholder.length > 0 && Math.abs(omg-xholder[xholder.length-1]) < V_max/t) {
			  xholder.pop(); 
			  yAxis.push(ydata[i]); 
		  }
	  }
	  
  }
  
  //histogram a-axis 
  var binwidth = 0; 
  if (noise){
	  var xrange = V_max + 6*noise; 
	  binwidth = xrange/50; 
	  for (var i = 0; i < 51; i++) {
		xdatah.push(i/50*xrange-3*noise); 
	  }
  }else{
	  var xrange = V_max*6/5; 
	  binwidth = xrange/50; 
	  for (var i = 0; i < 51; i++) {
		xdatah.push(i/50*xrange-V_max/10); 
	  }
  }
  
  //culmulative histogram y-axis 
  xholder = xdatah.slice().reverse(); 
  for (var i = 0; i < xdata.length; i++) {
	  if (xholder.length > 0 && Math.abs(xdata[i]-xholder[xholder.length-1]) < V_max/t){
		  xholder.pop(); 
		  cumulativeh.push(cumulative[i]); 
	  }
  }
  
  //Q-release histogram y-axis 
  xholder = xdatah.slice().reverse(); 
  var currbin = xholder.pop(); 
  var itracker = 0; 
  var bucket = 0; 
  while (itracker < xdata.length){
	  if (Math.abs(xdata[itracker]-currbin) <= binwidth/2){
		  bucket += ydata[itracker]; 
	  }else{
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
  while (itracker < xdata.length){
	  if (Math.abs(xdata[itracker]-currbin) <= binwidth/2){
		  bucket += ydata[itracker]; 
	  }else if ((xdata[itracker]-currbin) > binwidth/2){
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
    color: 'rgb(153, 51, 204)',
    width: 2
    }
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
			color: 'rgb(153, 51, 204)',
			width: 2
		  }
	  }  
  };
  
  var cumul = {
	  x: xdata, 
	  y: cumulative, 
	  fill: 'tozeroy',
	  fillcolor: '',
	  type: 'scatter', 
	  name: 'cumulative',
	  line: {
		color: 'rgb(153, 51, 204)',
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
			color: 'rgb(153, 51, 204)',
			width: 2
		  }
	  }  
  };
  
  var Q_releaseh = {
	  x: xdatah,
	  y: ydatah,
	  type: 'bar', 
	  name: 'Q_release histogram', 
	  marker: {
		color: 'rgb(153, 51, 204)',	
      }
  };
  
  var cumulh = {
	  x: xdatah, 
	  y: cumulativeh, 
	  type: 'bar', 
	  name: 'cumulative histogram',
	  marker: {
		color: 'rgb(153, 51, 204)',
	  }
  }; 

  //Plotly.newPlot('myDiv', [Q_release, m], layout, config); 
  if (userhistogFlag.checked){
	  Plotly.newPlot('myDiv', [Q_releaseh, mh], layout4, config); 
	  Plotly.newPlot('myDiv3', [cumulh], layout3, config); 
  }else{
	  Plotly.newPlot('myDiv', [Q_release, m], layout, config); 
	  Plotly.newPlot('myDiv3', [cumul], layout2, config); 
  }
}

function toggle(){
	if (usertoggle.value.localeCompare("Show more") == 0){
		usertoggle.value = "Show less"; 
		usermorePanel.classList.remove("hidden"); 
		usermoreLegend.classList.remove("hidden"); 
		usermorePanel.classList.add("shown"); 
		usermoreLegend.classList.add("shown"); 
	} else {
		usertoggle.value = "Show more"; 
		usermorePanel.classList.remove("shown"); 
		usermoreLegend.classList.remove("shown"); 
		usermorePanel.classList.add("hidden"); 
		usermoreLegend.classList.add("hidden"); 
		
	}		
}

function foolProve(){
	if (usernumOfSyn.value < nMin){usernumOfSyn.value = nMin;} 
	if (usernumOfSyn.value > nMax){usernumOfSyn.value = nMax;} 
	if (userrelPro.value < p_rMin){userrelPro.value = p_rMin;} 
	if (userrelPro.value > p_rMax){userrelPro.value = p_rMax;} 
	if (userquanAmp.value < qMin) {userquanAmp.value = qMin;} 
	if (userquanAmp.value > qMax) {userquanAmp.value = qMax;} 
	if (usernoise.value < noiseMin){usernoise.value = noiseMin;} 
	if (usernoise.value > noiseMax){usernoise.value = noiseMax;} 
}

function updateSlider(){
	usernRange.min = nMin; 
	usernRange.max = nMax; 
	userpRange.min = p_rMin; 
	userpRange.max = p_rMax; 
	userqRange.min = qMin; 
	userqRange.max = qMax; 
	usernoiseRange.min = noiseMin; 
	usernoiseRange.max = noiseMax; 
}