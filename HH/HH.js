/*
 * Hodgkin–Huxley neuron — provenance
 * Original JavaScript simulation developer: Chengxin Yu.
 * Project period: November 2019–August 2020 (not an exact file-creation date).
 * Developed in the laboratory of P. Jesper Sjöström, McGill University.
 * Authorship confirmed by Sjöström; provenance recorded 17 October 2026.
 *
 * Scientific model: Hodgkin AL & Huxley AF (1952), J Physiol 117:500–544.
 * https://doi.org/10.1113/jphysiol.1952.sp004764
 * Reference materials supplied by Sjöström included James Fallon's Igor Pro
 * code (header: "Created 25/9/2000 - JBF") and the Neuronal Dynamics exercise:
 * https://neuronaldynamics-exercises.readthedocs.io/en/latest/exercises/hodgkin-huxley.html
 * Direct derivation from either supplied implementation is not established.
 *
 * Subsequent teaching/interface updates include changes made with OpenAI
 * Codex under Sjöström's direction in 2026. Original student authorship is
 * distinct from those later changes; this is not a line-by-line change log.
 * The stick-dendrite solver was replaced on 21 October 2026 by OpenAI Codex,
 * under Sjöström's guidance, with a geometry- and axial-resistivity-based
 * compartmental cable supporting graded active propagation.
 */

//const { pi, json } = require("mathjs");

//const { e } = require("mathjs");

//const math = require("mathjs");



// Bypass the legacy Plotly Safari download path using a PNG Blob.
function downloadPlotPNG(plot) {
  var filenames = {myDiv1: 'HH_voltage', dendriteSpatialPlot: 'HH_dendritic_spatial_profile', myDiv2: 'HH_ionic_currents', myDiv4: 'HH_total_current'};
  return Plotly.toImage(plot, {
    format: 'png', width: plot._fullLayout.width, height: plot._fullLayout.height, scale: 2
  }).then(function(dataURL) {
    var binary = atob(dataURL.split(',')[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([bytes], {type: 'image/png'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = (filenames[plot.id] || 'HH_plot') + '.png';
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
  title: '<b>Voltage Time Course</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>V<sub>m</sub> (mV)</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: true,
}; 

var layout2 = {
  title: '<b>V vs. m</b>',
  xaxis: {
    title: '<b>Voltage (mV)</b>'
  },
  yaxis: {
    title: '<b>m</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout3 = {
  title: '<b>V vs. n</b>',
  xaxis: {
    title: '<b>Voltage (mV)</b>'
  },
  yaxis: {
    title: '<b>n</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout4 = {
  title: '<b>V vs. h</b>',
  xaxis: {
    title: '<b>Voltage (mV)</b>'
  },
  yaxis: {
    title: '<b>h</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout5 = {
  title: '<b>I<sub>Na</sub> vs. Time</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I<sub>Na</sub> (nA)</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout6 = {
  title: '<b>I<sub>K</sub> vs. Time</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I<sub>K</sub> (nA)</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout7 = {
  title: '<b>I<sub>leak</sub> vs. Time</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I<sub>leak</sub> (nA)</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: false,
}; 

var layout8 = {
  title: '<b>Current Time Course</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I</b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: true,
}; 

var layout9 = {
  title: '<b>Gating variables</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b><i>x(t)</i></b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: true,
}; 

var layout10 = {
  title: '<b>Total Current Time Course</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I<sub>total</sub></b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: true,
};

var layoutSpatial = {
  title: '<b>Spatial Profile</b>',
  xaxis: {
    title: '<b>Distance from soma (µm)</b>'
  },
  yaxis: {
    title: '<b>V<sub>m</sub> (mV)</b>'
  },
  autosize: true,
  paper_bgcolor: '#ffffff',
  showlegend: false
};

// Keep all three stacked plots compact while preserving most of the data area.
function compactPlotLayout(plotLayout) {
  plotLayout.height = 345;
  plotLayout.margin = {t: 42, b: 58, l: 80, r: 123, pad: 0, autoexpand: false};
  plotLayout.paper_bgcolor = '#ffffff';
  plotLayout.plot_bgcolor = '#ffffff';
  plotLayout.font = {family: 'Arial, Helvetica, sans-serif', color: '#24323a'};
  plotLayout.hovermode = 'closest';
  plotLayout.hoverdistance = 18;
  plotLayout.spikedistance = -1;

  var heading = plotLayout.title;
  plotLayout.title = {
    text: typeof heading === 'string' ? heading : heading.text,
    y: 0.98,
    yanchor: 'top',
    pad: {t: 0, b: 0}
  };

  ['xaxis', 'yaxis'].forEach(function(axis) {
    var axisTitle = plotLayout[axis].title;
    plotLayout[axis].title = {
      text: typeof axisTitle === 'string' ? axisTitle : axisTitle.text,
      standoff: 6
    };
  });
}

[layout, layout2, layout3, layout4, layout5, layout6, layout7, layout8, layout9, layout10, layoutSpatial].forEach(compactPlotLayout);

function setAxisLabelSize(size) {
  document.documentElement.style.setProperty('--hh-axis-font-size', size + 'px');
  [layout, layout2, layout3, layout4, layout5, layout6, layout7, layout8, layout9, layout10, layoutSpatial].forEach(function(plotLayout) {
    // Reserve identical room for axes and the widest legend on every graph.
	var legendSize = Math.max(12, size - 6);
    plotLayout.margin.l = 58 + size;
	plotLayout.margin.r = 92 + 7 * legendSize;
    plotLayout.margin.b = 36 + size;
    plotLayout.margin.autoexpand = false;
    plotLayout.legend = {font: {size: legendSize}, tracegroupgap: 0};
    var heading = plotLayout.title;
    plotLayout.title = Object.assign({},
      typeof heading === 'string' ? {text: heading} : heading,
      {font: {size: size}}
    );
    ['xaxis', 'yaxis'].forEach(function(axis) {
      var title = plotLayout[axis].title;
      plotLayout[axis].title = Object.assign({},
        typeof title === 'string' ? {text: title} : title,
        {font: {size: size}}
      );
      plotLayout[axis].tickfont = {size: size};
      plotLayout[axis].automargin = false;
    });
	if (plotLayout === layoutSpatial) {
	  plotLayout.margin.r = 28;
	  plotLayout.showlegend = false;
	}
  });
}

setAxisLabelSize(22);

document.getElementById('axisFontSize').addEventListener('input', function(event) {
  var size = Number(event.target.value);
	var legendSize = Math.max(12, size - 6);
  setAxisLabelSize(size);
  document.getElementById('axisFontSizeValue').textContent = size + ' px';
  ['myDiv1', 'myDiv2', 'myDiv4', 'dendriteSpatialPlot'].forEach(function(id) {
	if (!document.getElementById(id).data) return;
    Plotly.relayout(id, {
	  'legend.font.size': legendSize,
      'title.font.size': size,
      'xaxis.title.font.size': size,
      'yaxis.title.font.size': size,
      'xaxis.tickfont.size': size,
      'yaxis.tickfont.size': size,
      'margin.l': 58 + size,
      'margin.r': id === 'dendriteSpatialPlot' ? 28 : 92 + 7 * legendSize,
      'margin.b': 36 + size,
      'margin.autoexpand': false,
      'xaxis.automargin': false,
      'yaxis.automargin': false
    });
  });
  if (userDendrite && userDendrite.checked) {
	renderDendriteGeometry();
	renderDendriteSnapshot();
  }
});

function setTimeAxisRange() {
  if (!t.length) return;
  var start = t[0];
  var end = t[t.length - 1];
  var padding = Math.max((end - start) * 0.01, 0.01);
  [layout, layout8, layout10].forEach(function(plotLayout) {
    plotLayout.xaxis.range = [start, end + padding];
  });
}

 

var dt = 0.01;               // time step for forward euler method
var currentStart = 1;
var offset = currentStart/dt;
var vcoffset = 25/dt; 
var Cm = 0.01; 

var gNa = 1.2;
var gNad = 0.35; //
  
var eNa=55.17;

var gK = 0.36;
var gKd = 0.2;

var eK=-72.14;
var gL=0.003;  
var gLd = 0.003;

var eL=-49.42; 

var tspan = 25; 
var I = 0.1; 
var curd = 1; 
var v = -60; 
var time = 10;
var I2 = 0;
var curd2 = 0;
var v2 = -60;
var mi = alphaM(v)/(alphaM(v)+betaM(v)); 
var m2 = alphaM(v2)/(alphaM(v2)+betaM(v2)); 
var hi = alphaH(v)/(alphaH(v)+betaH(v)); 
var h2 = alphaH(v2)/(alphaH(v2)+betaH(v2)); 
var ni = alphaN(v)/(alphaN(v)+betaN(v)); 
var n2 = alphaN(v2)/(alphaN(v2)+betaN(v2)); 

var gNap = 15; // dendritic Na density, percent of soma
var gKp = 100; // dendritic K density, percent of soma

var VC = 0; 
var clampv = 0; 
var clampv2 = 0;
var clamptime=5;
var clamptime2=0;
var vcStart=1;
var restv = -60;

//dendrite set up

var nSegments=16;
var g_coupl=150; // axial resistivity, ohm cm (legacy variable name retained for UI compatibility)
var synLoc=0;
var d_soma=20; //um
var d_dend=1; //um 
var l_dend=400; //um
var R_input = 100;
var tauM = 10;
//var C_M = tauM*0.001/(R_input*1*1e6)*1*1e12;
var C_M = 0.01;
var A_soma = 4*Math.PI*Math.pow(d_soma/2, 2);
var A_seg = 2*Math.PI*(d_dend/2)*l_seg;
var R_seg = d_dend*l_dend/(2*d_soma*nSegments)*R_input;
var tauM_seg = R_seg*1e6*C_M*1e-12*1e3;
var l_seg = l_dend/nSegments;
var durationD = 1;
var dendriteStart = 1;
var currentinj = 0.45;
var vDend = [];

//set up soma
var E_leak = -70;

var	AP_threshold = -40;
var	AP_max = 20
var	AP_reset = -50

var wDur=250;
var deltaT = 0.00001;
var	ite = wDur*1e-3/deltaT;
var synRecov=1;
var synFRecov=1;
var y1=0;
var y2=0;

var t = []; 
var V = []; 
var m = []; 
var h = []; 
var n = []; 
var md = [];
var hd =[];
var nd = [];

var ina = []; 
var ik = []; 
var il = []; 
var inad = [];
var ikd = [];
var ild = [];
var fik = []; 
var fina = []; 
var curinjt = []; 
var curinj = []; 
var curinj2=[]
var curinjt2=[];
var itt = []; 
var oldtraces=[];
var oldVtraces =[];
var oldItraces=[];

var oldV = []; 
var oldina = []; 
var oldik = []; 
var olditt = []; 
var VQ = []; 
var inaQ = []; 
var ikQ = []; 
var ittQ = []; 
var vMembrane = [];
vMembrane.push(restv);
for(var i=0; i<10; i++){
	var p = (i+1).toString();
	eval('var vMembrane_'+p+'=[];');
	eval('var vMem = vMembrane_'+p+';');
	vMem.push(vMembrane[0]);
	vDend.push(vMem);
	
}

var userlast10Flag = document.getElementById("last10Trace"); 
var userlastFlag = document.getElementById("lastTrace");
var userClampMode = document.getElementById("clampMode");
var userVC2Flag = document.getElementById("VC2");
var VC2 = userVC2Flag;
var userTTX = document.getElementById("ttx"); 
var userTEA = document.getElementById("tea"); 
var userDendrite = document.getElementById("dendrite");
var userRef = document.getElementById("ref");

var userVCpanel = document.getElementById("VCPanel"); 
//var userVC2panel = document.getElementById("VC2Panel");
var userclampV = document.getElementById("clampV"); 
var userclamptime = document.getElementById("clampVtime");
userclamptime.classList.add("hidden");
userclamptime.classList.remove("shown");
document.getElementById("clampVlabel").style.display='none';

var userrestV = document.getElementById("restV"); 
var userstartV = document.getElementById("startV");
var userdurationV = document.getElementById("durationV");
//var userRefPanel = document.getElementById("refPanel");

var userParapanel = document.getElementById("ParaPanel"); 
var usercustomFlag = document.getElementById("custompara"); 
var usermi = document.getElementById("mi"); 
var usermRange = document.getElementById("mRange"); 
var userhi = document.getElementById("hi"); 
var userhRange = document.getElementById("hRange"); 
var userni = document.getElementById("ni"); 
var usernRange = document.getElementById("nRange"); 

var userHHpanel1 = document.getElementById("pbottom");
//var userHHpanel2 = document.getElementById("pbottom2");
var usertspan = document.getElementById("tspan"); 
var usertspan2 = document.getElementById("tspan2"); 
var useriinput = document.getElementById("iinput"); 
var userstartHH = document.getElementById("startHH");
var usercurd = document.getElementById("duration"); 
var userrv = document.getElementById("rv");
var useriinput2 = document.getElementById("iinput2"); 
//var usercurd2 = document.getElementById("duration2"); 
//var userrv2 = document.getElementById("rv2");
var userdurationHH = document.getElementById("durationHH");
useriinput2.disabled=true;
userdurationHH.disabled=true;
useriinput2.classList.remove("shown");
useriinput2.classList.add("hidden");
userdurationHH.classList.remove("shown");
userdurationHH.classList.add("hidden");
document.getElementById("iinput2label").style.display = 'none';
document.getElementById("durationHHlabel").style.display = 'none';

var userDpanel = document.getElementById("DPanel");
var usertspanD = document.getElementById("tspanD");
var userseg = document.getElementById("seg");
var useriinputd = document.getElementById("iinputd");
var useriinputdRange = document.getElementById("iinputdRange");
var usergcoup = document.getElementById("gcoup");
var usercurrentinj = document.getElementById("currentinj");
var userstartD = document.getElementById("startD");
var userdurationD = document.getElementById("durationD");
var userd_soma = document.getElementById("d_soma");
var userd_dend = document.getElementById("d_dend");
var userl_dend = document.getElementById("l_dend");
var usergNap = document.getElementById("gNap");
var usergKp = document.getElementById("gKp");

var usergNapRange = document.getElementById("gNapRange");
var usergKpRange = document.getElementById("gKpRange");
var dendriteAnimationControls = document.getElementById("dendriteAnimationControls");
var dendriteAnimationButton = document.getElementById("dendriteAnimationButton");
var dendriteTimeNumber = document.getElementById("dendriteTimeNumber");
var dendriteTimeRange = document.getElementById("dendriteTimeRange");
var dendriteAnimationFrame = null;
var dendriteAnimationPreviousTime = null;
var dendriteAnimationRunning = false;
var dendriteSnapshotIndex = 0;


document.getElementById("reset").addEventListener("click", resetPanel); 
document.getElementById("last10Trace").addEventListener("change", checkMode10); 
document.getElementById("lastTrace").addEventListener("change", checkMode); 
userClampMode.addEventListener("click", switchClampMode);
document.getElementById("VC2").addEventListener("change", VCcheck);
document.getElementById("ref").addEventListener("change", submit);
document.getElementById("dendrite").addEventListener("change", submit);
document.getElementById("ttx").addEventListener("change", blocker); 
document.getElementById("tea").addEventListener("change", blocker); 

document.getElementById("clampV").addEventListener("change", VCsubmit); 
document.getElementById("clampVtime").addEventListener("change", VCsubmit); 
document.getElementById("restV").addEventListener("change", VCsubmit); 
document.getElementById("startV").addEventListener("change", VCsubmit);
document.getElementById("durationV").addEventListener("change", VCsubmit); 

document.getElementById("custompara").addEventListener("change", customize); 
document.getElementById("mi").addEventListener("change", submit); 
document.getElementById("mRange").addEventListener("input", submitSlider); 
document.getElementById("hi").addEventListener("change", submit); 
document.getElementById("hRange").addEventListener("input", submitSlider); 
document.getElementById("ni").addEventListener("change", submit); 
document.getElementById("nRange").addEventListener("input", submitSlider); 

document.getElementById("tspan").addEventListener("change", submit); 
document.getElementById("tspan2").addEventListener("change", VCsubmit); 
document.getElementById("iinput").addEventListener("change", submit); 
document.getElementById("startHH").addEventListener("change", submit);
document.getElementById("duration").addEventListener("change", submit); 
document.getElementById("rv").addEventListener("change", submit); 
document.getElementById("iinput2").addEventListener("change", submit); 
//document.getElementById("duration2").addEventListener("change", submit); 
//document.getElementById("rv2").addEventListener("change", submit);  
document.getElementById("durationHH").addEventListener("change", submit); 

document.getElementById("seg").addEventListener("change", submit);
document.getElementById("tspanD").addEventListener("change", submit);
document.getElementById("iinputd").addEventListener("change", submit);
useriinputdRange.addEventListener("input", function(event) {
	useriinputd.value = useriinputdRange.value;
	submit(event);
});
document.getElementById("gcoup").addEventListener("change", submit);
document.getElementById("currentinj").addEventListener("change", submit);
document.getElementById("startD").addEventListener("change", submit);
document.getElementById("durationD").addEventListener("change",submit);
document.getElementById("d_dend").addEventListener("change", submit);
document.getElementById("l_dend").addEventListener("change", submit);
document.getElementById("d_soma").addEventListener("change", submit);
document.getElementById("gNap").addEventListener("change", submit);
document.getElementById("gKp").addEventListener("change", submit);

document.getElementById("gNapRange").addEventListener("input", submitSlider);
document.getElementById("gKpRange").addEventListener("input", submitSlider);
dendriteAnimationButton.addEventListener("click", toggleDendriteAnimation);
dendriteTimeRange.addEventListener("input", function() {
	setDendriteSnapshotFromTime(parseFloat(dendriteTimeRange.value));
});
dendriteTimeNumber.addEventListener("change", function() {
	setDendriteSnapshotFromTime(parseFloat(dendriteTimeNumber.value));
});






function switchClampMode(event) {
	event.preventDefault(); 
	stopDendriteAnimation();
	VC = VC ? 0 : 1;
	userClampMode.value = VC ? 'Switch to current clamp' : 'Switch to voltage clamp';

	if (VC) {
		userDendrite.checked = false;
		setDendriteModeControls(false);
		setDendriteDisplayMode(false);
		var top = document.getElementById("ptop1");
		top.classList.add("hidden");
		top.classList.remove("shown");
		var top2 = document.getElementById("ptop2");
		top2.classList.add("shown");
		top2.classList.remove("hidden");
		userVCpanel.classList.add("shown");
		userVCpanel.classList.remove("hidden");
		userHHpanel1.classList.add("hidden");
		userHHpanel1.classList.remove("shown");
		userDpanel.classList.add("hidden");
		userDpanel.classList.remove("shown");
		VCsubmit(event); 
	}
	else {
		var top = document.getElementById("ptop1");
		top.classList.add("shown");
		top.classList.remove("hidden");
		var top2 = document.getElementById("ptop2");
		top2.classList.add("hidden");
		top2.classList.remove("shown");
		userVCpanel.classList.add("hidden");
		userVCpanel.classList.remove("shown");
		userHHpanel1.classList.add("shown");
		userHHpanel1.classList.remove("hidden");
		userTEA.checked=false;
		userTTX.checked=false;
		gNa=1.2;
		gK=0.36;
		submit(event); 
	}
}

function VCcheck(event) {
	event.preventDefault();

	if(userVC2Flag.checked){
		userclamptime.classList.add("shown");
		userclamptime.classList.remove("hidden");
		document.getElementById("clampVlabel").style.display='inline';
		var text = document.getElementById("cv");
		text.innerText = 'Command voltage for S1 (mV)';
		var inner = document.createElement('span');
		inner.className = "tooltiptext";
		inner.innerText = "command voltage for S2 is set at 0";
		text.appendChild(inner);
		var dur = document.getElementById("d");
		dur.innerText = 'Duration of S1 and S2 (mS)';

		VCsubmit(event);
	}
	else if(!userVC2Flag.checked){
		userclamptime.classList.add("hidden");
		userclamptime.classList.remove("shown");
		document.getElementById("clampVlabel").style.display='none';
		var text = document.getElementById("cv");
		text.innerText = 'Command voltage (mV)';
		var dur = document.getElementById("d");
		dur.innerText = 'Duration (mS)';
		VCsubmit(event);
	}
}

window.addEventListener("load", (event) => {
  initialize(); 
});

function resetPanel(event) {
	event.preventDefault(); 
	stopDendriteAnimation();
	
	tspan = userDendrite.checked ? 10 : 25;
	I = 0.1; 
	curd = 1; 
	currentStart = 1;
	v = -60; 
	mi = alphaM(v)/(alphaM(v)+betaM(v)); 
	hi = alphaH(v)/(alphaH(v)+betaH(v)); 
	ni = alphaN(v)/(alphaN(v)+betaN(v));  
	m2 = alphaM(v)/(alphaM(v)+betaM(v)); 
	h2 = alphaH(v)/(alphaH(v)+betaH(v)); 
	n2 = alphaN(v)/(alphaN(v)+betaN(v));  
	clampv = 0; 
	clamptime=0;
	vcStart=1;
	restv = -60; 
	nSegments = 16;
	synLoc = 0;
	g_coupl = 150;
	currentinj = 0.45;
	dendriteStart = 1;
	gNap = 15;
	gKp = 100;

	VQ = []; 
	inaQ = []; 
	ikQ = []; 
	ittQ = []; 

	if (VC) {curd = 1;} 

	initialize(); 
}

function initialize() {
	stopDendriteAnimation();
	setDendriteModeControls(userDendrite.checked);
	usermi.value = mi; 
	usermRange.value = mi; 
	userhi.value = hi; 
	userhRange.value = hi; 
	userni.value = ni; 
	usernRange.value = ni; 
	usertspan.value = tspan; 
	usertspan2.value=tspan;
	usertspanD.value = tspan;
	useriinput.value = 0.45; 
	useriinput2.value = 0.45;
	userstartHH.value = currentStart;
	usercurd.value = curd; 
	//usercurd2.value = 0;
	userrv.value = v; 
	//userrv2.value = v;
	userclampV.value = clampv; 
	userclamptime.value=clamptime;
	userstartV.value=vcStart;
	userdurationV.value=5;
	userrestV.value = restv;
	userdurationHH.value = 5;
	usergcoup.value = g_coupl;
	userseg.value = nSegments;
	useriinputd.value = 0;
	useriinputdRange.max = nSegments;
	useriinputdRange.value = 0;
	usercurrentinj.value = 0.45;
	userstartD.value=dendriteStart;
	userdurationD.value=durationD;
	userd_dend.value = d_dend;
	userd_soma.value = d_soma;
	userl_dend.value = l_dend;
	usergNap.value = gNap;
	usergKp.value = gKp;
	usergNapRange.value = gNap;
	usergKpRange.value = gKp;


  	
	if (VC) {
		buildVC(); 
		VCdraw(); 

		oldV = V.slice(); 
		oldina = ina.slice(); 
		oldik = ik.slice(); 
		olditt = itt.slice(); 

		buildQ(VQ, V.slice()); 
		buildQ(inaQ, ina.slice()); 
		buildQ(ikQ, ik.slice()); 
		buildQ(ittQ, itt.slice()); 
	} else {
		buildHH(); 
		draw(); 

		oldV = V.slice(); 
		oldina = ina.slice(); 
		oldik = ik.slice(); 
		olditt = itt.slice(); 

		buildQ(VQ, V.slice()); 
		buildQ(inaQ, ina.slice()); 
		buildQ(ikQ, ik.slice()); 
		buildQ(ittQ, itt.slice()); 
	}

	
}

function submitSlider(event) { 
	event.preventDefault(); 
	usermi.value = usermRange.value; 
	userhi.value = userhRange.value; 
	userni.value = usernRange.value; 
	usergNap.value = usergNapRange.value;
	usergKp.value = usergKpRange.value;
	submit(event); 
}

function setDendriteModeControls(enabled) {
	userRef.disabled = enabled;
	userlastFlag.disabled = enabled;
	userlast10Flag.disabled = enabled;
	if (enabled) {
		userRef.checked = false;
		userlastFlag.checked = false;
		userlast10Flag.checked = false;
	}
	document.getElementById("refLabel").classList.toggle("disabled-control", enabled);
	document.getElementById("ptoptop").classList.toggle("disabled-card", enabled);
}

function submit(event) {
  event.preventDefault(); 
	stopDendriteAnimation();

  if (VC) {
  	VCsubmit(event); 
  } 

  else {
	if (userDendrite.checked && event.target === userDendrite) {
		usertspanD.value = 10;
		usertspan.value = 10;
	}
	setDendriteModeControls(userDendrite.checked);
	if(userDendrite.checked){
		userDpanel.classList.add("shown");
		userDpanel.classList.remove("hidden");
		userHHpanel1.classList.add("hidden");
		userHHpanel1.classList.remove("shown");
	}
	else{		
		userDpanel.classList.remove("shown");
		userDpanel.classList.add("hidden");
		userHHpanel1.classList.remove("hidden");
		userHHpanel1.classList.add("shown");

	}
	if(userRef.checked){
		if(userDendrite.checked){
			userDendrite.checked=false;
			userDpanel.classList.add("hidden");
			userDpanel.classList.remove("shown");
			userHHpanel1.classList.remove("hidden");
			userHHpanel1.classList.add("shown");

		}
		useriinput2.disabled=false;
		userdurationHH.disabled=false;
		useriinput2.classList.add("shown");
		useriinput2.classList.remove("hidden");
		userdurationHH.classList.add("shown");
		userdurationHH.classList.remove("hidden");
		var iinputlabel = document.getElementById("iinputlabel");
		iinputlabel.innerText="Stim 1 (mA)"
		document.getElementById("iinput2label").style.display = 'inline';
		document.getElementById("durationHHlabel").style.display = 'inline';
	}
	else{
		useriinput2.disabled=true;
		userdurationHH.disabled=true;
		useriinput2.classList.remove("shown");
		useriinput2.classList.add("hidden");
		userdurationHH.classList.remove("shown");
		userdurationHH.classList.add("hidden");
		var iinputlabel = document.getElementById("iinputlabel");
		iinputlabel.innerText= "I (mA)";
		document.getElementById("iinput2label").style.display = 'none';
		document.getElementById("durationHHlabel").style.display = 'none';
	}
  	oldV = V.slice(); 
  	oldina = ina.slice(); 
	oldik = ik.slice(); 
	olditt = itt.slice(); 

	buildQ(VQ, V.slice()); 
	buildQ(inaQ, ina.slice()); 
	buildQ(ikQ, ik.slice()); 
	buildQ(ittQ, itt.slice()); 
  	
  	foolProve(); 
	  tspan = userDendrite.checked ? parseFloat(usertspanD.value) : parseFloat(usertspan.value);
	  usertspan.value = tspan;
	  usertspanD.value = tspan;
  	I = parseFloat(useriinput.value); 
	currentStart = Math.max(0, Math.min(tspan, parseFloat(userstartHH.value)));
	userstartHH.value = currentStart;
  	curd = parseFloat(usercurd.value); 
  	v = parseFloat(userrv.value); 
	I2 = parseFloat(useriinput2.value);
	curd2 = 0;
	time = parseFloat(userdurationHH.value);
	nSegments = Math.max(2, Math.min(20, Math.round(parseFloat(userseg.value))));
	userseg.value = nSegments;
	useriinputdRange.max = nSegments;
	synLoc = Math.max(0, Math.min(nSegments, Math.round(parseFloat(useriinputd.value))));
	useriinputd.value = synLoc;
	useriinputdRange.value = synLoc;
	g_coupl = parseFloat(usergcoup.value);
	currentinj = parseFloat(usercurrentinj.value);
	dendriteStart = Math.max(0, Math.min(tspan, parseFloat(userstartD.value)));
	userstartD.value = dendriteStart;
	durationD = parseFloat(userdurationD.value);
	d_soma = parseFloat(userd_soma.value);
	l_dend = parseFloat(userl_dend.value);
	d_dend = parseFloat(userd_dend.value);
	usergNap.value = Math.max(0, Math.min(100, parseFloat(usergNap.value)));
	usergKp.value = Math.max(0, Math.min(100, parseFloat(usergKp.value)));
	usergNapRange.value = usergNap.value;
	usergKpRange.value = usergKp.value;

  	usermRange.value = usermi.value; 
  	userhRange.value = userhi.value; 
  	usernRange.value = userni.value; 
  
  	mi = parseFloat(usermi.value); 
  	hi = parseFloat(userhi.value);
  	ni = parseFloat(userni.value); 

	l_seg = l_dend/nSegments;
	A_soma = 4*Math.PI*Math.pow(d_soma/2, 2);
	A_seg = 2*Math.PI*(d_dend/2)*l_seg;
	R_seg = d_dend*l_dend/(2*d_soma*nSegments)*R_input;
	tauM_seg = R_seg*1e6*C_M*1e-12*1e3;

  
  	buildHH(); 
  	draw(); 
  }

  
}

function buildHH() {
	t = []; 
	V = []; 
	m = []; 
	h = []; 
	n = []; 
	ina = []; 
	ik = []; 
	il = []; 
	md = [];
	hd = [];
	nd = [];
	inad = [];
	ikd = [];
	ild = [];
	fik = []; 
	fina = []; 
	curinj = []; 
	curinjt = []; 
	curinj2=[];
	curinjt2=[];
	itt = []; 
	vMembrane=[restv];
	vDend = [];
	for(var i=0; i<nSegments; i++){
		vDend[i]=[v];
	}
	for(var i=0; i<nSegments; i++){
		inad.push([]);
		ikd.push([]);
		ild.push([]);
		md.push([]);
		hd.push([]);
		nd.push([]);
	}
	gNad = gNa*parseFloat(usergNap.value)/100;
	gKd = gK*parseFloat(usergKp.value)/100;

	if(userDendrite.checked){
		runStickDendrite();
	}
	else{
		hhrun();
	}
}

// Physically scaled active stick cable. Node 0 is the soma; nodes 1..N are
// equal dendritic compartments. Axial conductance follows cylinder geometry
// and Ra. The distal boundary is sealed. Dendritic Na and K densities are
// expressed as percentages of their somatic HH densities.
function runStickDendrite() {
	var nodeCount = nSegments + 1;
	var internalDt = 0.002; // ms; small enough for explicit HH and axial terms
	var outputEvery = Math.max(1, Math.round(dt/internalDt));
	var totalSteps = Math.round(tspan/internalDt);
	var inputStart = dendriteStart;
	var ra = Math.max(1, parseFloat(usergcoup.value));
	var dxUm = l_dend/nSegments;
	var dxCm = dxUm*1e-4;
	var dendDiameterCm = d_dend*1e-4;
	var somaDiameterCm = d_soma*1e-4;
	var dendAreaCm2 = Math.PI*dendDiameterCm*dxCm;
	var somaAreaCm2 = Math.PI*Math.pow(somaDiameterCm, 2);
	var crossSectionCm2 = Math.PI*Math.pow(dendDiameterCm, 2)/4;

	// HH.js uses conductance and capacitance densities scaled by 1/100 from
	// the conventional HH values. Apply the same scaling to axial conductance.
	function scaledAxialConductance(pathCm) {
		return (crossSectionCm2/(ra*pathCm))*1000/100; // scaled mS
	}
	var edgeConductance = new Float64Array(nSegments);
	edgeConductance[0] = scaledAxialConductance((d_soma/2 + dxUm/2)*1e-4);
	for(var edge=1; edge<nSegments; edge++) edgeConductance[edge] = scaledAxialConductance(dxCm);

	var areas = new Float64Array(nodeCount);
	var capacitances = new Float64Array(nodeCount);
	var sodiumDensities = new Float64Array(nodeCount);
	var potassiumDensities = new Float64Array(nodeCount);
	var leakDensities = new Float64Array(nodeCount);
	areas[0] = somaAreaCm2;
	capacitances[0] = Cm;
	sodiumDensities[0] = gNa;
	potassiumDensities[0] = gK;
	leakDensities[0] = gL;
	for(var node=1; node<nodeCount; node++) {
		areas[node] = dendAreaCm2;
		capacitances[node] = C_M;
		sodiumDensities[node] = gNad;
		potassiumDensities[node] = gKd;
		leakDensities[node] = gLd;
	}

	var volts = new Float64Array(nodeCount);
	var gatesM = new Float64Array(nodeCount);
	var gatesH = new Float64Array(nodeCount);
	var gatesN = new Float64Array(nodeCount);
	var nextVolts = new Float64Array(nodeCount);
	var nextM = new Float64Array(nodeCount);
	var nextH = new Float64Array(nodeCount);
	var nextN = new Float64Array(nodeCount);
	var holdingCurrent = new Float64Array(nodeCount);
	var initialM = alphaM(v)/(alphaM(v)+betaM(v));
	var initialH = alphaH(v)/(alphaH(v)+betaH(v));
	var initialN = alphaN(v)/(alphaN(v)+betaN(v));

	for(node=0; node<nodeCount; node++) {
		volts[node] = v;
		gatesM[node] = initialM;
		gatesH[node] = initialH;
		gatesN[node] = initialN;
		// A small holding current keeps every channel-density condition at the
		// same starting voltage, so density comparisons are not confounded by
		// a different initial membrane potential.
		holdingCurrent[node] = sodiumDensities[node]*Math.pow(initialM,3)*initialH*(v-eNa)
			+ potassiumDensities[node]*Math.pow(initialN,4)*(v-eK)
			+ leakDensities[node]*(v-eL);
	}

	t=[]; V=[]; m=[]; h=[]; n=[]; ina=[]; ik=[]; il=[]; itt=[];
	curinj=[]; curinjt=[]; curinj2=[]; curinjt2=[]; fina=[]; fik=[];
	vDend=[]; md=[]; hd=[]; nd=[]; inad=[]; ikd=[]; ild=[];
	for(var seg=0; seg<nSegments; seg++) {
		vDend.push([]); md.push([]); hd.push([]); nd.push([]);
		inad.push([]); ikd.push([]); ild.push([]);
	}

	function storeState(timeMs, inputOn) {
		t.push(timeMs);
		V.push(volts[0]); m.push(gatesM[0]); h.push(gatesH[0]); n.push(gatesN[0]);
		var somaNa = gNa*Math.pow(gatesM[0],3)*gatesH[0]*(volts[0]-eNa);
		var somaK = gK*Math.pow(gatesN[0],4)*(volts[0]-eK);
		var somaLeak = gL*(volts[0]-eL);
		ina.push(somaNa); ik.push(somaK); il.push(somaLeak); itt.push(somaNa+somaK+somaLeak);
		for(var s=0; s<nSegments; s++) {
			var index=s+1;
			vDend[s].push(volts[index]); md[s].push(gatesM[index]); hd[s].push(gatesH[index]); nd[s].push(gatesN[index]);
			inad[s].push(gNad*Math.pow(gatesM[index],3)*gatesH[index]*(volts[index]-eNa));
			ikd[s].push(gKd*Math.pow(gatesN[index],4)*(volts[index]-eK));
			ild[s].push(gLd*(volts[index]-eL));
		}
		if(inputOn) { curinjt.push(timeMs); curinj.push(currentinj); }
	}

	storeState(0,false);
	for(var step=1; step<=totalSteps; step++) {
		var timeMs=step*internalDt;
		var inputOn=timeMs>=inputStart && timeMs<inputStart+durationD;
		for(node=0; node<nodeCount; node++) {
			var voltage=volts[node];
			var ionic=sodiumDensities[node]*Math.pow(gatesM[node],3)*gatesH[node]*(voltage-eNa)
				+ potassiumDensities[node]*Math.pow(gatesN[node],4)*(voltage-eK)
				+ leakDensities[node]*(voltage-eL);
			var axial=0;
			if(node>0) axial += edgeConductance[node-1]*(volts[node-1]-voltage)/areas[node];
			if(node<nodeCount-1) axial += edgeConductance[node]*(volts[node+1]-voltage)/areas[node];
			// The control is an absolute current in nA. Convert it to the
			// density scale used by this HH implementation (conductances and
			// capacitance are both scaled to 1/100 of the conventional values).
			var injected=(inputOn && node===synLoc) ? currentinj*1e-3/(areas[node]*100) : 0;
			nextVolts[node]=voltage+internalDt/capacitances[node]*(injected+axial+holdingCurrent[node]-ionic);
			nextM[node]=gatesM[node]+internalDt*(alphaM(voltage)*(1-gatesM[node])-betaM(voltage)*gatesM[node]);
			nextH[node]=gatesH[node]+internalDt*(alphaH(voltage)*(1-gatesH[node])-betaH(voltage)*gatesH[node]);
			nextN[node]=gatesN[node]+internalDt*(alphaN(voltage)*(1-gatesN[node])-betaN(voltage)*gatesN[node]);
			nextM[node]=Math.max(0,Math.min(1,nextM[node]));
			nextH[node]=Math.max(0,Math.min(1,nextH[node]));
			nextN[node]=Math.max(0,Math.min(1,nextN[node]));
		}
		var swap=volts; volts=nextVolts; nextVolts=swap;
		swap=gatesM; gatesM=nextM; nextM=swap;
		swap=gatesH; gatesH=nextH; nextH=swap;
		swap=gatesN; gatesN=nextN; nextN=swap;
		if(step%outputEvery===0) storeState(timeMs,inputOn);
	}
	for(var sample=0; sample<ina.length; sample++) { fina.push(-ina[sample]); fik.push(-ik[sample]); }
}

function hhrun() {
	offset = Math.ceil(currentStart/dt);
	if(userDendrite.checked){
		curd=durationD;
	}
	if(userRef.checked){
		curd2=curd;
		//curd=0.15;
	}
	var loop = Math.ceil(tspan/dt);   // no. of iterations of euler 
	var loop1 = Math.ceil(curd/dt);
	var loop2=0;
	var loop3=0; //loop until current inj is over
	if(!userDendrite.checked && userRef.checked){
	loop2 = Math.ceil(time/dt) +loop1; //duration is over
	loop3 = Math.ceil(curd/dt) +loop2;
	} //last current inj
	else{
		loop2=0;
		loop3=0;
	}

	t.push(0); 
	V.push(v);

	if (usercustomFlag.checked) {
		m.push(mi); 
		n.push(ni); 
		h.push(hi); 
	} else {
		m.push(alphaM(v)/(alphaM(v)+betaM(v))); 
		h.push(alphaH(v)/(alphaH(v)+betaH(v))); 
		n.push(alphaN(v)/(alphaN(v)+betaN(v))); 
		for(var i=0; i<nSegments; i++){
			(md[i]).push(alphaM(v)/(alphaM(v)+betaM(v)));
			(hd[i]).push(alphaH(v)/(alphaH(v)+betaH(v)));
			(nd[i]).push(alphaN(v)/(alphaN(v)+betaN(v))); 
		}
		usermi.value = m[0]; 
		usermRange.value = m[0]; 
		userni.value = n[0]; 
		usernRange.value = n[0]; 
		userhi.value = h[0]; 
		userhRange.value = h[0]; 
	}
	var currLeft;
	var currRight;
	var vLeft=[];
	var vRight=[];

	ina.push(gNa*Math.pow(m[0],3)*h[0]*(V[0]-eNa)); 
	ik.push(gK*Math.pow(n[0],4)*(V[0]-eK)); 
	il.push(gL*(V[0]-eL)); 
	itt.push(ina[0]+ik[0]+il[0]); 
	for(var i=0; i<nSegments; i++){
		var inad1 = inad[i];
		inad1.push((gNad*Math.pow(md[i][0],3)*hd[i][0]*(vDend[i][0]-eNa)));
		inad[i]=inad1;
		ikd[i].push(gKd*Math.pow(nd[i][0],4)*(vDend[i][0]-eK));
		ild[i].push(gLd*(vDend[i][0]-eL)); 
	}


	for (var i = 1; i < offset+1; i++) {
		t.push(i*dt); 
		V.push(V[i-1] + dt*(1/Cm)*(0-(ina[i-1] + ik[i-1] + il[i-1]))); 
		m.push(m[i-1] + dt*(alphaM(V[i-1])*(1-m[i-1]) - betaM(V[i-1])*m[i-1])); 
		h.push(h[i-1] + dt*(alphaH(V[i-1])*(1-h[i-1]) - betaH(V[i-1])*h[i-1])); 
		n.push(n[i-1] + dt*(alphaN(V[i-1])*(1-n[i-1]) - betaN(V[i-1])*n[i-1])); 
		ina.push(gNa*Math.pow(m[i],3)*h[i]*(V[i]-eNa)); 
		ik.push(gK*Math.pow(n[i],4)*(V[i]-eK)); 
		il.push(gL*(V[i]-eL)); 
		itt.push(ina[i]+ik[i]+il[i]);
		if(userDendrite.checked){
		for(var j=0; j<nSegments; j++){
			vDend[j].push(vDend[j][i-1] + dt*(1/Cm)*(0-(inad[j][i-1] + ikd[j][i-1] + ild[j][i-1]))); 
			md[j].push(md[j][i-1] + dt*(alphaM(vDend[j][i-1])*(1-md[j][i-1]) - betaM(vDend[j][i-1])*md[j][i-1])); 
			hd[j].push(hd[j][i-1] + dt*(alphaH(vDend[j][i-1])*(1-hd[j][i-1]) - betaH(vDend[j][i-1])*hd[j][i-1])); 
			nd[j].push(nd[j][i-1] + dt*(alphaN(vDend[j][i-1])*(1-nd[j][i-1]) - betaN(vDend[j][i-1])*nd[j][i-1])); 
			inad[j].push(gNad*Math.pow(md[j][i],3)*hd[j][i]*(vDend[j][i]-eNa)); 
			ikd[j].push(gKd*Math.pow(nd[j][i],4)*(vDend[j][i]-eK));
			ild[j].push(gLd*(vDend[j][i]-eL));
		}
	}
	}

	var bAP = 0;
	if(synLoc==0 || !userDendrite.checked){
	for (var i = offset; i < loop; i++) {
		t.push(tspan*(i+1)/loop); 
		if (i-offset < loop1) {
			V.push(V[i] + dt*(1/Cm)*(I-(Ich = ina[i] + ik[i] + il[i]))); 
			curinjt.push(tspan*(i)/loop); 
			curinj.push(I); 
		} else if((i-offset)>=loop1 && i-offset<loop2){
			V.push(V[i] + dt*(1/Cm)*(0-(Ich = ina[i] + ik[i] + il[i]))); 
			//no current injection
		}
		else if(i-offset>=loop2 && i-offset<loop3){
			V.push(V[i] + dt*(1/Cm)*(I2-(Ich = ina[i] + ik[i] + il[i]))); 
			curinjt2.push(tspan*(i)/loop); 
			curinj2.push(I); 
			//yes current injection
		}
		else if(i-offset>=loop2){
			V.push(V[i] + dt*(1/Cm)*(0-(Ich = ina[i] + ik[i] + il[i])));
		}
	

		m.push(m[i] + dt*(alphaM(V[i])*(1-m[i]) - betaM(V[i])*m[i])); 
		h.push(h[i] + dt*(alphaH(V[i])*(1-h[i]) - betaH(V[i])*h[i])); 
		n.push(n[i] + dt*(alphaN(V[i])*(1-n[i]) - betaN(V[i])*n[i])); 
		
		ina.push(gNa*Math.pow(m[i+1],3)*h[i+1]*(V[i+1]-eNa)); 
		ik.push(gK*Math.pow(n[i+1],4)*(V[i+1]-eK)); 
		il.push(gL*(V[i+1]-eL)); 
		itt.push(ina[i+1]+ik[i+1]+il[i+1]); 


		if(userDendrite.checked){
		for(var j=0; j<nSegments; j++){
			vDendCurr = vDend[j];
			if(j==0){
				vLeft = V;
			}
			else{
				vLeft = vDend[j-1];
			}
			currLeft = g_coupl*1e-9/(A_seg*1e-6)*(vLeft[i]-vDendCurr[i]);
			if(j==nSegments-1){
				currRight=0;
			}
			else{
				vRight = vDend[j+1];
				currRight = g_coupl*1e-9/(A_seg*1e-6)*(vRight[i]-vDendCurr[i]);
			}
			if(synLoc==j+1){
				vDendCurr.push(vDendCurr[i]+dt*(1/C_M)*(I));
				curinjt.push(tspan*(i)/loop); 

			}
			else{
				vDendCurr.push(vDendCurr[i]+dt*(1/C_M)*(currLeft+currRight-(Ich = inad[j][i] + ikd[j][i] + ild[j][i])));
			}
			vDend[j]=vDendCurr;
			md[j].push(md[j][i] + dt*(alphaM(vDend[j][i])*(1-md[j][i]) - betaM(vDend[j][i])*md[j][i]));
			hd[j].push(hd[j][i] + dt*(alphaH(vDend[j][i])*(1-hd[j][i]) - betaH(vDend[j][i])*hd[j][i]));
			nd[j].push(nd[j][i] + dt*(alphaN(vDend[j][i])*(1-nd[j][i]) - betaN(vDend[j][i])*nd[j][i]));
			
			inad[j].push(gNad*Math.pow(md[j][i+1],3)*hd[j][i+1]*(vDend[j][i+1]-eNa)); 
			ikd[j].push(gKd*Math.pow(nd[j][i+1],4)*(vDend[j][i+1]-eK)); 
			ild[j].push(gLd*(vDend[j][i+1]-eL)); 
		}
	}
}
}
else{
	for(var i = offset; i < loop; i++){
	t.push(tspan*(i+1)/loop); 
	for(var j=0; j<nSegments; j++){
		vDendCurr = vDend[j];
		if(j==0){
			vLeft = V;
		}
		else{
			vLeft = vDend[j-1];
		}
		currLeft = g_coupl*1e-9/(A_seg*1e-6)*(vLeft[i]-vDendCurr[i]);
		if(j==nSegments-1){
			currRight=0;
		}
		else{
			vRight = vDend[j+1];
			currRight = g_coupl*1e-9/(A_seg*1e-6)*(vRight[i]-vDendCurr[i]);
		}
		if(synLoc==j+1){
			if(i-offset<loop1){
			vDendCurr.push(vDendCurr[i]+dt*(1/C_M)*(currentinj-(currLeft+currRight)-(Ich = inad[j][i] + ikd[j][i] + ild[j][i])));
			curinjt.push(tspan*(i)/loop); 
			curinj.push(currentinj); 
			}
			else{
				vDendCurr.push(vDendCurr[i]+dt*(1/C_M)*((currLeft+currRight)-(Ich = inad[j][i] + ikd[j][i] + ild[j][i])));
			}
		}
		else{
			vDendCurr.push(vDendCurr[i]+dt*(1/C_M)*((currLeft+currRight)-(Ich = inad[j][i] + ikd[j][i] + ild[j][i])));
		}
		vDend[j]=vDendCurr;
		md[j].push(md[j][i] + dt*(alphaM(vDend[j][i])*(1-md[j][i]) - betaM(vDend[j][i])*md[j][i])); 
		hd[j].push(hd[j][i] + dt*(alphaH(vDend[j][i])*(1-hd[j][i]) - betaH(vDend[j][i])*hd[j][i])); 
		nd[j].push(nd[j][i] + dt*(alphaN(vDend[j][i])*(1-nd[j][i]) - betaN(vDend[j][i])*nd[j][i])); 
		
		inad[j].push(gNad*Math.pow(md[j][i+1],3)*hd[j][i+1]*(vDend[j][i+1]-eNa)); 
		ikd[j].push(gKd*Math.pow(nd[j][i+1],4)*(vDend[j][i+1]-eK)); 
		ild[j].push(gLd*(vDend[j][i+1]-eL)); 
	}
	if(synLoc>0){
		vRight=vDend[0];
		currRight = g_coupl*1e-9/(A_soma*1e-6)*(vRight[i]-V[i]);
		V.push(V[i]+dt*(1/C_M)*(currRight-(Ich = ina[i] + ik[i] + il[i])));
		m.push(m[i] + dt*(alphaM(V[i])*(1-m[i]) - betaM(V[i])*m[i])); 
		h.push(h[i] + dt*(alphaH(V[i])*(1-h[i]) - betaH(V[i])*h[i])); 
		n.push(n[i] + dt*(alphaN(V[i])*(1-n[i]) - betaN(V[i])*n[i])); 
		
		ina.push(gNa*Math.pow(m[i+1],3)*h[i+1]*(V[i+1]-eNa)); 
		ik.push(gK*Math.pow(n[i+1],4)*(V[i+1]-eK)); 
		il.push(gL*(V[i+1]-eL));
		itt.push(ina[i+1]+ik[i+1]+il[i+1]); 
	}	
}
	
	
}
for (var i = 0; i < ina.length; i++) {
	fik.push(-ik[i]); 
	fina.push(-ina[i]); 
}

}


function dendriteTraceColour(segmentIndex) {
	var fraction = (segmentIndex + 1) / nSegments;
	var red = Math.round(219 + (51 - 219) * fraction);
	var green = Math.round(64 + (181 - 64) * fraction);
	var blue = Math.round(82 + (229 - 82) * fraction);
	return "rgb(" + red + ", " + green + ", " + blue + ")";
}

function setDendriteDisplayMode(enabled) {
	dendriteAnimationControls.classList.toggle("hidden", !enabled);
	document.getElementById("dendriteGeometryCard").classList.toggle("hidden", !enabled);
	document.getElementById("dendriteSpatialPlot").classList.toggle("hidden", !enabled);
	document.getElementById("myDiv2").classList.toggle("hidden", enabled);
	document.getElementById("myDiv4").classList.toggle("hidden", enabled);
	if (!enabled) {
		layout.shapes = [];
		layout.annotations = [];
	}
}

function renderDendriteGeometry() {
	if (!userDendrite.checked) return;
	var traces = [{
		x:[0], y:[0], type:"scatter", mode:"markers",
		marker:{color:"rgb(219, 64, 82)", size:28, symbol:"circle"},
		hovertemplate:"Soma<extra></extra>", showlegend:false
	}];
	for (var segment = 0; segment < nSegments; segment++) {
		traces.push({
			x:[segment*l_seg, (segment+1)*l_seg], y:[0,0], type:"scatter", mode:"lines",
			line:{color:dendriteTraceColour(segment), width:13},
			hovertemplate:"Dendrite "+Math.round((segment+1)*l_seg)+" µm<extra></extra>",
			showlegend:false
		});
	}
	var fontSize = Number(document.getElementById("axisFontSize").value);
	var geometryLayout = {
		title:{text:"<b>Stick Dendrite</b>", font:{size:fontSize}, y:.95},
		height:165,
		margin:{l:58+fontSize, r:28, t:42, b:28, pad:0},
		paper_bgcolor:"#ffffff", plot_bgcolor:"#ffffff",
		font:{family:"Arial, Helvetica, sans-serif", color:"#24323a", size:fontSize},
		xaxis:{title:{text:""}, showticklabels:false, ticks:"", range:[-.03*l_dend,1.03*l_dend], gridcolor:"#edf1f0", zeroline:false, fixedrange:true},
		yaxis:{visible:false, range:[-.35,.48], fixedrange:true},
		annotations:[{
			x:synLoc*l_seg, y:0, text:"Input", showarrow:true,
			arrowhead:2, arrowsize:1.25, arrowwidth:1.5, arrowcolor:"#c86516",
			standoff:18, ax:0, ay:-54, font:{size:Math.max(12,fontSize-3), color:"#c86516"},
			bgcolor:"rgba(255,255,255,.8)", borderpad:1
		}],
		hovermode:"closest", hoverdistance:16, showlegend:false
	};
	Plotly.react("dendriteGeometryPlot", traces, geometryLayout, {responsive:true, displayModeBar:false});
}

function stopDendriteAnimation() {
	if (dendriteAnimationFrame !== null) cancelAnimationFrame(dendriteAnimationFrame);
	dendriteAnimationFrame = null;
	dendriteAnimationPreviousTime = null;
	dendriteAnimationRunning = false;
	if (dendriteAnimationButton) dendriteAnimationButton.value = "Animate";
}

function prepareDendriteAnimation() {
	dendriteSnapshotIndex = 0;
	var finalTime = t.length ? t[t.length - 1] : 0;
	var sampleStep = t.length > 1 ? t[1] - t[0] : 0.1;
	dendriteTimeRange.min = dendriteTimeNumber.min = 0;
	dendriteTimeRange.max = dendriteTimeNumber.max = finalTime;
	dendriteTimeRange.step = dendriteTimeNumber.step = sampleStep;
	dendriteTimeRange.value = dendriteTimeNumber.value = 0;

	var minimum = Infinity;
	var maximum = -Infinity;
	[V].concat(vDend).forEach(function(trace) {
		for (var i = 0; i < trace.length; i++) {
			if (trace[i] < minimum) minimum = trace[i];
			if (trace[i] > maximum) maximum = trace[i];
		}
	});
	var padding = Math.max(1, (maximum - minimum) * 0.05);
	layoutSpatial.yaxis.range = [minimum - padding, maximum + padding];
	layoutSpatial.xaxis.range = [-0.03 * l_dend, 1.03 * l_dend];
}

function setDendriteSnapshotFromTime(timeValue) {
	if (!t.length || !isFinite(timeValue)) return;
	var clamped = Math.max(t[0], Math.min(t[t.length - 1], timeValue));
	var fraction = (clamped - t[0]) / Math.max(1e-12, t[t.length - 1] - t[0]);
	dendriteSnapshotIndex = Math.max(0, Math.min(t.length - 1, Math.round(fraction * (t.length - 1))));
	var selectedTime = t[dendriteSnapshotIndex];
	dendriteTimeRange.value = selectedTime;
	dendriteTimeNumber.value = selectedTime.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
	renderDendriteSnapshot();
}

function renderDendriteSnapshot() {
	if (!userDendrite.checked || !t.length) return;
	var selectedTime = t[dendriteSnapshotIndex];
	var positions = [0];
	var profile = [V[dendriteSnapshotIndex]];
	for (var segment = 0; segment < nSegments; segment++) {
		positions.push((segment + 1) * l_seg);
		profile.push(vDend[segment][dendriteSnapshotIndex]);
	}

	layoutSpatial.title.text = "<b>Spatial Profile at " + selectedTime.toFixed(1) + " ms</b>";
	layoutSpatial.shapes = [
		{type:"line", x0:0, x1:l_dend, y0:v, y1:v, line:{color:"#8c9896", width:1, dash:"dash"}}
	];
	layoutSpatial.annotations = [{
		x:positions[synLoc], y:profile[synLoc], text:"Input", showarrow:true,
		arrowhead:2, arrowsize:1.25, arrowwidth:1.5, arrowcolor:"#c86516",
		standoff:10, ax:0, ay:-44, font:{size:Math.max(12,Number(document.getElementById("axisFontSize").value)-3),color:"#c86516"},
		bgcolor:"rgba(255,255,255,.82)", borderpad:1
	}];
	var traces = [{
		x:[positions[0]], y:[profile[0]], type:"scatter", mode:"markers",
		marker:{color:"rgb(219, 64, 82)",size:8},
		hovertemplate:"Soma<br>Distance: 0 µm<br>V<sub>m</sub>: %{y:.2f} mV<extra></extra>",
		showlegend:false
	}];
	for (var profileSegment=0; profileSegment<nSegments; profileSegment++) {
		traces.push({
			x:[positions[profileSegment],positions[profileSegment+1]],
			y:[profile[profileSegment],profile[profileSegment+1]],
			type:"scatter", mode:"lines+markers",
			line:{color:dendriteTraceColour(profileSegment),width:3},
			marker:{color:dendriteTraceColour(profileSegment),size:6},
			hovertemplate:"Distance: %{x:.0f} µm<br>V<sub>m</sub>: %{y:.2f} mV<extra></extra>",
			showlegend:false
		});
	}
	Plotly.react("dendriteSpatialPlot", traces, layoutSpatial, config);
	Plotly.relayout("myDiv1", {
		shapes: [{type:"line", x0:selectedTime, x1:selectedTime, yref:"paper", y0:0, y1:1, line:{color:"#37474f", width:2}}]
	});
}

function dendriteAnimationTick(timestamp) {
	if (!dendriteAnimationRunning) return;
	if (dendriteAnimationPreviousTime === null) dendriteAnimationPreviousTime = timestamp;
	var elapsed = timestamp - dendriteAnimationPreviousTime;
	dendriteAnimationPreviousTime = timestamp;
	var selectedTime = t[dendriteSnapshotIndex] + elapsed * t[t.length - 1] / 7000;
	setDendriteSnapshotFromTime(selectedTime);
	if (dendriteSnapshotIndex >= t.length - 1) {
		stopDendriteAnimation();
		return;
	}
	dendriteAnimationFrame = requestAnimationFrame(dendriteAnimationTick);
}

function toggleDendriteAnimation() {
	if (dendriteAnimationRunning) {
		stopDendriteAnimation();
		return;
	}
	if (!t.length) return;
	if (dendriteSnapshotIndex >= t.length - 1) setDendriteSnapshotFromTime(0);
	dendriteAnimationRunning = true;
	dendriteAnimationPreviousTime = null;
	dendriteAnimationButton.value = "Pause";
	dendriteAnimationFrame = requestAnimationFrame(dendriteAnimationTick);
}


function draw() {
	setTimeAxisRange();
	setDendriteDisplayMode(userDendrite.checked);

	if(!userDendrite.checked){
	var Vt = {
		x:t,
  		y: V,
  		type: 'scatter', 
  		name: 'V<sub>m</sub>', 
  		line: {
    		color: 'rgb(219, 64, 82)',
    		width: 2
    	}
  	}; 
}
else{
	var Vt = {
		x: t,
		y: V,
		type: 'scatter', 
		name: 'Soma', 
		hovertemplate: 'Soma<br>Time: %{x:.2f} ms<br>V<sub>m</sub>: %{y:.2f} mV<extra></extra>',
		line: {
		  color: 'rgb(219, 64, 82)',
		  width: 2
	  }
	}; 
	var legendStride = Math.max(1, Math.round(nSegments/4));
	for(var i=0; i<nSegments; i++){
	var Vtt = {
		x: t,
		y: vDend[i],
		type: 'scatter', 
		name: 'Dendrite '+Math.round((i+1)*l_seg)+' µm', 
		showlegend: i===0 || i===nSegments-1 || (i+1)%legendStride===0,
		hovertemplate: 'Dendrite '+Math.round((i+1)*l_seg)+' µm<br>Time: %{x:.2f} ms<br>V<sub>m</sub>: %{y:.2f} mV<extra></extra>',
		line: {
		  color: dendriteTraceColour(i),
		  width: 2
	  }
	}; 
	window["V"+i] = JSON.parse(JSON.stringify(Vtt));	
}
}
  	var oldVt = {
  		x: t,
  		y: oldV,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last trace', 
  		line: {
    		color: 'rgb(255, 165, 0)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var mt = {
  		x: t,
  		y: m,
  		type: 'scatter', 
  		name: 'm', 
  		line: {
    		color: 'rgb(55, 128, 191)',
    		width: 2
    	}
  	}; 

  	var nt = {
  		x: t,
  		y: n,
  		type: 'scatter', 
  		name: 'n', 
  		line: {
    		color: 'rgb(124, 252, 0)',
    		width: 2
    	}
  	}; 

  	var ht = {
  		x: t,
  		y: h,
  		type: 'scatter', 
  		name: 'h', 
  		line: {
    		color: 'rgb(255, 165, 0)',
    		width: 2
    	}
  	}; 

  	var Ina = {
  		x: t,
  		y: ina,
  		type: 'scatter', 
  		name: 'I<sub>Na</sub>', 
  		line: {
    		color: 'rgb(55, 128, 191)',
    		width: 2
    	}
  	}; 

  	var oldIna = {
  		x: t,
  		y: oldina,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>Na</sub>', 
  		line: {
    		color: 'rgb(51, 181, 229)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var Ik = {
  		x: t,
  		y: ik,
  		type: 'scatter', 
  		name: 'I<sub>K</sub>', 
  		line: {
    		color: 'rgb(124, 252, 0)',
    		width: 2
    	}
  	}; 

  	var oldIk = {
  		x: t,
  		y: oldik,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>K</sub>', 
  		line: {
    		color: 'rgb(34, 139, 34)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var Il = {
  		x: t,
  		y: il,
  		type: 'scatter', 
  		name: 'I<sub>leak</sub>', 
  		line: {
    		color: 'rgb(255, 165, 0)',
    		width: 2
    	}
  	}; 

  	var fIk = {
  		x: t,
  		y: fik,
  		type: 'scatter', 
  		name: 'flipped I<sub>K</sub>', 
  		line: {
    		color: 'rgb(124, 252, 0)',
    		width: 2
    	}
  	}; 

  	var fIna = {
  		x: t,
  		y: fina,
  		type: 'scatter', 
  		name: 'flipped I<sub>Na</sub>', 
  		line: {
    		color: 'rgb(55, 128, 191)',
    		width: 2
    	}
  	}; 
  	
  	var curinjm = {
  		x: curinjt,
  		y: curinj,
  		type: 'scatter', 
  		name: 'I<sub>input</sub>', 
  		line: {
    		color: 'rgb(0, 0, 0)',
    		width: 3
    	}
  	}; 

	var curinjm2 = {
		x:curinjt2,
		y:curinj2,
		type: 'scatter', 
		name: 'I<sub>input</sub>', 
		line: {
		  color: 'rgb(0, 0, 0)',
		  width: 3
	  }
	}; 

  	var Itt = {
  		x: t,
  		y: itt,
  		type: 'scatter', 
  		name: 'I<sub>total</sub>', 
  		line: {
    		color: 'rgb(0, 0, 0)',
    		width: 1.5
    	}
  	}; 

  	var oldItt = {
  		x: t,
  		y: olditt,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>total</sub>', 
  		line: {
    		color: 'rgb(128, 128, 128)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

	if (userDendrite.checked) {
		var dendriteTraces = [Vt, curinjm];
		for (var dendriteIndex = 0; dendriteIndex < nSegments; dendriteIndex++) {
			dendriteTraces.push(window["V" + dendriteIndex]);
		}
		layout.shapes = [];
		layout.annotations = [];
		Plotly.newPlot("myDiv1", dendriteTraces, layout, config);
		renderDendriteGeometry();
		prepareDendriteAnimation();
		renderDendriteSnapshot();
		return;
	}

  	if (userlast10Flag.checked) {
  		var oldtraces = preparettQ(ittQ); 
  		oldtraces.push(Itt); 
  		oldtraces.reverse(); 

  		var oldVtraces = prepareVQ(VQ); 
  		oldVtraces.push(curinjm); 
  		oldVtraces.push(Vt); 
  		oldVtraces.reverse(); 

  		var oldNatraces = prepareNaQ(inaQ); 
  		var oldKtraces = prepareKQ(ikQ); 
  		var oldItraces = oldKtraces.concat(oldNatraces); 
  		oldItraces.push(Il); 
  		oldItraces.push(Ik); 
  		oldItraces.push(Ina); 
  		oldItraces.reverse(); 

  		Plotly.newPlot('myDiv1', oldVtraces, layout, config); 
  		Plotly.newPlot('myDiv2', oldItraces, layout8, config); 
  		// Plotly.newPlot('myDiv3', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', oldtraces, layout10, config); 
  	} else if (userlastFlag.checked) {
  		Plotly.newPlot('myDiv1', [Vt, oldVt, curinjm, curinjm2], layout, config); 
  		Plotly.newPlot('myDiv2', [Ina, oldIna, Ik, oldIk, Il], layout8, config); 
  		// Plotly.newPlot('myDiv3', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', [Itt, oldItt], layout10, config); 
  	} else {
		if(!userDendrite.checked){
  		Plotly.newPlot('myDiv1', [Vt, curinjm, curinjm2], layout, config); 
		}
		else{
			var array = [];
			array.push(Vt);
			array.push(curinjm);
			for(var i=0; i<nSegments; i++){
				eval('var Vtt = V'+i+';');
				array.push(Vtt)
			}
			Plotly.newPlot('myDiv1', array, layout, config)
		}
  		Plotly.newPlot('myDiv2', [Ina, Ik, Il], layout8, config); 
  		// Plotly.newPlot('myDiv3', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', [Itt], layout10, config); 
  	}
  	

  	// Plotly.newPlot('myDiv2', [Vm], layout2, config); 
  	// Plotly.newPlot('myDiv3', [Vn], layout3, config); 
  	// Plotly.newPlot('myDiv4', [Vh], layout4, config); 

  	// Plotly.newPlot('myDiv2', [Ina], layout5, config); 
  	// Plotly.newPlot('myDiv3', [Ik], layout6, config); 
  	// Plotly.newPlot('myDiv4', [Il], layout7, config); 
}

function VCsubmit(event) {
	event.preventDefault(); 

	oldV = V.slice(); 
  	oldina = ina.slice(); 
	oldik = ik.slice(); 
	olditt = itt.slice(); 

	buildQ(VQ, V.slice()); 
	buildQ(inaQ, ina.slice()); 
	buildQ(ikQ, ik.slice()); 
	buildQ(ittQ, itt.slice()); 

  	foolProve(); 
  	tspan = parseFloat(usertspan2.value); 
  	I = parseFloat(useriinput.value); 
  	curd = parseFloat(usercurd.value); 
  	v = parseFloat(userrv.value); 
  	clampv = parseFloat(userclampV.value); 
  	restv = parseFloat(userrestV.value); 
	vcStart = Math.max(0, Math.min(tspan, parseFloat(userstartV.value)));
	userstartV.value = vcStart;
	clamptime = parseFloat(userclamptime.value);

  	
  	usermRange.value = usermi.value; 
  	userhRange.value = userhi.value; 
  	usernRange.value = userni.value; 
  
  	mi = parseFloat(usermi.value); 
  	hi = parseFloat(userhi.value);
  	ni = parseFloat(userni.value); 
  
  	buildVC(); 
  	VCdraw(); 
} 

function buildVC() {
	t = []; 
	V = []; 
	m = []; 
	h = []; 
	n = []; 
	ina = []; 
	ik = []; 
	il = []; 
	fik = []; 
	fina = []; 
	curinj = []; 
	curinjt = []; 
	itt = [];

	vcrun(); 
}

function vcrun() {
	curd=parseFloat(userdurationV.value);
	var loop = Math.ceil(tspan/dt); // no. of iterations of euler 
	var commandStart = Math.ceil(vcStart/dt);
	var commandDuration = Math.ceil(curd/dt);
	var commandEnd = commandStart + commandDuration;
	var secondCommandStart = commandEnd + Math.ceil(clamptime/dt);
	var secondCommandEnd = secondCommandStart + commandDuration;
	
	t.push(-vcoffset*dt); 
	V.push(restv); 
	if (usercustomFlag.checked) {
		m.push(mi); 
		n.push(ni); 
		h.push(hi); 
	} else {
		m.push(alphaM(v)/(alphaM(v)+betaM(v))); 
		h.push(alphaH(v)/(alphaH(v)+betaH(v))); 
		n.push(alphaN(v)/(alphaN(v)+betaN(v))); 

		usermi.value = m[0]; 
		usermRange.value = m[0]; 
		userni.value = n[0]; 
		usernRange.value = n[0]; 
		userhi.value = h[0]; 
		userhRange.value = h[0]; 
	}
	ina.push(gNa*Math.pow(m[0],3)*h[0]*(V[0]-eNa)); 
	ik.push(gK*Math.pow(n[0],4)*(V[0]-eK)); 
	il.push(gL*(V[0]-eL)); 
	itt.push(ina[0]+ik[0]+il[0]); 

	for (var i = 1; i < vcoffset; i++) {
		t.push((i-vcoffset)*dt); 
		V.push(restv);
		m.push(m[i-1] + dt*(alphaM(V[i-1])*(1-m[i-1]) - betaM(V[i-1])*m[i-1])); 
		h.push(h[i-1] + dt*(alphaH(V[i-1])*(1-h[i-1]) - betaH(V[i-1])*h[i-1])); 
		n.push(n[i-1] + dt*(alphaN(V[i-1])*(1-n[i-1]) - betaN(V[i-1])*n[i-1])); 
		ina.push(gNa*Math.pow(m[i],3)*h[i]*(V[i]-eNa)); 
		ik.push(gK*Math.pow(n[i],4)*(V[i]-eK)); 
		il.push(gL*(V[i]-eL)); 
		itt.push(ina[i]+ik[i]+il[i]); 
		
	}

	for (var i = 0; i < loop; i++) {
		t.push(tspan*i/loop); 

		if (VC2.checked) {
			if (i >= commandStart && i < commandEnd) V.push(clampv);
			else if (i >= secondCommandStart && i < secondCommandEnd) V.push(clampv2);
			else V.push(restv);
		} else {
			V.push(i >= commandStart && i < commandEnd ? clampv : restv);
		}
		m.push(m[i+vcoffset-1] + dt*(alphaM(V[i+vcoffset-1])*(1-m[i+vcoffset-1]) - betaM(V[i+vcoffset-1])*m[i+vcoffset-1])); 
		h.push(h[i+vcoffset-1] + dt*(alphaH(V[i+vcoffset-1])*(1-h[i+vcoffset-1]) - betaH(V[i+vcoffset-1])*h[i+vcoffset-1])); 
		n.push(n[i+vcoffset-1] + dt*(alphaN(V[i+vcoffset-1])*(1-n[i+vcoffset-1]) - betaN(V[i+vcoffset-1])*n[i+vcoffset-1])); 

		ina.push(gNa*Math.pow(m[i+vcoffset],3)*h[i+vcoffset]*(V[i+vcoffset]-eNa)); 
		ik.push(gK*Math.pow(n[i+vcoffset],4)*(V[i+vcoffset]-eK)); 
		il.push(gL*(V[i+vcoffset]-eL)); 
		itt.push(ina[i+vcoffset]+ik[i+vcoffset]+il[i+vcoffset]); 
	}



	for (var i = 0; i < ina.length; i++) {
		fik.push(-ik[i]); 
		fina.push(-ina[i]); 
	} 

	t.splice(0, vcoffset-200); 
	V.splice(0, vcoffset-200); 
	m.splice(0, vcoffset-200); 
	h.splice(0, vcoffset-200); 
	n.splice(0, vcoffset-200); 
	ina.splice(0, vcoffset-200); 
	ik.splice(0, vcoffset-200); 
	il.splice(0, vcoffset-200); 
	itt.splice(0, vcoffset-200); 
	fik.splice(0, vcoffset-200); 
	fina.splice(0, vcoffset-200); 
}

function VCdraw() {
	setTimeAxisRange();
	var Vt = {
  		x: t,
  		y: V,
  		type: 'scatter', 
  		name: 'V<sub>m</sub>', 
  		line: {
    		color: 'rgb(219, 64, 82)',
    		width: 2
    	}
  	}; 

  	var oldVt = {
  		x: t,
  		y: oldV,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last trace', 
  		line: {
    		color: 'rgb(255, 165, 0)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var mt = {
  		x: t,
  		y: m,
  		type: 'scatter', 
  		name: 'm', 
  		line: {
    		color: 'rgb(55, 128, 191)',
    		width: 2
    	}
  	}; 

  	var nt = {
  		x: t,
  		y: n,
  		type: 'scatter', 
  		name: 'n', 
  		line: {
    		color: 'rgb(124, 252, 0)',
    		width: 2
    	}
  	}; 

  	var ht = {
  		x: t,
  		y: h,
  		type: 'scatter', 
  		name: 'h', 
  		line: {
    		color: 'rgb(255, 165, 0)',
    		width: 2
    	}
  	}; 

  	var Ina = {
  		x: t,
  		y: ina,
  		type: 'scatter', 
  		name: 'I<sub>Na</sub>', 
  		line: {
    		color: 'rgb(55, 128, 191)',
    		width: 2
    	}
  	}; 

  	var oldIna = {
  		x: t,
  		y: oldina,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>Na</sub>', 
  		line: {
    		color: 'rgb(51, 181, 229)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var Ik = {
  		x: t,
  		y: ik,
  		type: 'scatter', 
  		name: 'I<sub>K</sub>', 
  		line: {
    		color: 'rgb(124, 252, 0)',
    		width: 2
    	}
  	}; 

  	var oldIk = {
  		x: t,
  		y: oldik,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>K</sub>', 
  		line: {
    		color: 'rgb(34, 139, 34)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};

  	var Itt = {
  		x: t,
  		y: itt,
  		type: 'scatter', 
  		name: 'I<sub>total</sub>', 
  		line: {
    		color: 'rgb(0, 0, 0)',
    		width: 1.5
    	}
  	}; 

  	var oldItt = {
  		x: t,
  		y: olditt,
  		type: 'scatter', 
  		mode: 'lines',
  		name: 'last I<sub>total</sub>', 
  		line: {
    		color: 'rgb(128, 128, 128)',
    		width: 1.5
			//dash: 'dot'
    	}
  	};



  	if (userlast10Flag.checked) {
  		var oldtraces = preparettQ(ittQ); 
  		oldtraces.push(Itt); 
  		oldtraces.reverse(); 

  		var oldVtraces = prepareVQ(VQ); 
  		oldVtraces.push(Vt); 
  		oldVtraces.reverse(); 

  		var oldNatraces = prepareNaQ(inaQ); 
  		var oldKtraces = prepareKQ(ikQ); 
  		var oldItraces = oldKtraces.concat(oldNatraces); 
  		oldItraces.push(Ik); 
  		oldItraces.push(Ina); 
  		oldItraces.reverse(); 
	


  		Plotly.newPlot('myDiv1', oldVtraces, layout, config); 
  		Plotly.newPlot('myDiv2', oldItraces, layout8, config); 
  		// Plotly.newPlot('myDiv2', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', oldtraces, layout10, config); 
  	} else if (userlastFlag.checked) {
  		Plotly.newPlot('myDiv1', [Vt, oldVt], layout, config); 
  		Plotly.newPlot('myDiv2', [Ina, oldIna, Ik, oldIk], layout8, config); 
  		// Plotly.newPlot('myDiv2', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', [Itt, oldItt], layout10, config); 
  	} else {
  		Plotly.newPlot('myDiv1', [Vt], layout, config); 
  		Plotly.newPlot('myDiv2', [Ina, Ik], layout8, config); 
  		// Plotly.newPlot('myDiv2', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', [Itt], layout10, config); 
  	}
  	
}

function alphaM(Vc) {
	var aM; 
	aM = 0.1*(Vc+35) / (1-Math.exp(-(Vc+35)/10)); 
	return aM; 
} 

function betaM(Vc) {
	var bM; 
	bM = 4*Math.exp(-(Vc+60)/18);
	return bM; 
}

function alphaH(Vc) {
	var aH; 
	aH = 0.07*Math.exp(-(Vc+60)/20); 
	return aH; 
} 

function betaH(Vc) {
	var bH; 
	bH = 1/(1+Math.exp(-(Vc+30)/10)); 
	return bH; 
} 

function alphaN(Vc) {
	var aN; 
	aN = 0.01*(Vc+50) / (1-Math.exp(-(Vc+50)/10)); 
	return aN; 
} 

function betaN(Vc) {
	var bN; 
	bN = 0.125*Math.exp(-(Vc+60)/80); 
	return bN; 
}

function foolProve() {
	if (usermi.value < 0) {usermi.value = 0;} 
	if (usermi.value > 1) {usermi.value = 1;} 
	if (userhi.value < 0) {userhi.value = 0;} 
	if (userhi.value > 1) {userhi.value = 1;} 
	if (userni.value < 0) {userni.value = 0;} 
	if (userni.value > 1) {userni.value = 1;} 
	if (usertspan.value < 1) {usertspan.value = 1;} 
	if (usercurd.value < 0) {usercurd.value = 0;}
	if (userrv.value == -35) {userrv.value = -34.999;}
	if (userrv.value == -50) {userrv.value = -49.999;}
	if (userrestV.value == -35) {userrestV.value = -34.999;}
	if (userrestV.value == -50) {userrestV.value = -49.999;}
	if (userclampV.value == -35) {userclampV.value = -34.999;}
	if (userclampV.value == -50) {userclampV.value = -49.999;}
	if(usercurd.value==0.1){usercurd.value=0.11;}
	if(useriinput2.value>5){useriinput2.value=5;}
	//if(usergcoup.value>2000){usergcoup.value=2000;}
	if(parseFloat(useriinputd.value)>parseFloat(userseg.value)){useriinputd.value=userseg.value;}
	if(durationHH.value<5){durationHH.value=5;}
	//if(userseg.value<useriinputd.value){useriinputd.value=userseg.value};
	//if(useriinputd.value==10 && userseg.value!=10){useriinputd.value=userseg.value};


	
} 

function checkMode(event) {
	event.preventDefault(); 
	userlast10Flag.checked = false; 
	if (VC) {VCdraw();} else {draw();}
} 

function checkMode10(event) {
	event.preventDefault(); 
	userlastFlag.checked = false; 
	VQ = []; 
	inaQ = []; 
	ikQ = []; 
	ittQ = []; 
	if (VC) {VCdraw();} else {draw();}
}


function customize(event) {
	event.preventDefault(); 

	if (usercustomFlag.checked) {
		usermi.disabled = false; 
		usermRange.disabled = false; 
		userni.disabled = false; 
		usernRange.disabled = false; 
		userhi.disabled = false; 
		userhRange.disabled = false; 
		submit(event); 
	} else {
		usermi.disabled = true; 
		usermRange.disabled = true; 
		userni.disabled = true; 
		usernRange.disabled = true; 
		userhi.disabled = true; 
		userhRange.disabled = true; 
	}
} 

function blocker(event) {
	event.preventDefault(); 

	if (userTTX.checked) {gNa = 0;} else {gNa = 1.2;} 
	if (userTEA.checked) {gK = 0;} else {gK = 0.36;} 

	VCsubmit(event); 
} 

function buildQ(traceQ, trace) {
	if (traceQ.length < 3) {
		traceQ.push(trace); 
	} else {
		traceQ.shift(); 
		traceQ.push(trace); 
	}
}

function preparettQ(queue) {
	var output = []; 
	for (var i = 0; i < queue.length; i++) {
		var formattedtrace = {
  		x: t,
  		y: queue[i],
  		type: 'scatter', 
  		mode: 'lines',
		hoverinfo:'skip',
  		name: `I<sub>total</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${128+(queue.length-i-1)*10}, ${128+(queue.length-i-1)*10}, ${128+(queue.length-i-1)*10})`,
    		width: 1.5
			//dash: 'dot'
    		}
  		}; 

  		output.push(formattedtrace); 
	}
	return output; 
}

function prepareVQ(queue) {
	var output = []; 
	for (var i = 0; i < queue.length; i++) {
		var formattedtrace = {
  		x: t,
  		y: queue[i],
		hoverinfo:'skip',
  		type: 'scatter', 
  		mode: 'lines',
		hoverinfo:'skip',
  		name: `V<sub>m</sub> No.${i+1}`, 
  		line: {
    		color: '#33b5e5',//`rgb(255, ${165+(queue.length-i-1)/10*(255-165)}, ${0+(queue.length-i-1)/10*(255-0)})`,
    		width: 1.5,
			//dash: 'dot'
    		}
  		}; 

  		output.push(formattedtrace); 
	}
	return output; 
}

function prepareNaQ(queue) {
	var output = []; 
	for (var i = 0; i < queue.length; i++) {
		var formattedtrace = {
  		x: t,
  		y: queue[i],
  		type: 'scatter', 
  		mode: 'lines',
		hoverinfo:'skip',
  		name: `I<sub>Na</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${51+(queue.length-i-1)/10*(229-51)}, ${181+(queue.length-i-1)/10*(229-181)}, 229)`,
    		width: 1.5
			//dash: 'dot'
    		}
  		}; 

  		output.push(formattedtrace); 
	}
	return output; 
}

function prepareKQ(queue) {
	var output = []; 
	for (var i = 0; i < queue.length; i++) {
		var formattedtrace = {
  		x: t,
  		y: queue[i],
  		type: 'scatter', 
  		mode: 'lines',
		hoverinfo:'skip',
  		name: `I<sub>K</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${34+(queue.length-i-1)/10*(224-34)}, ${139+(queue.length-i-1)/10*(224-139)}, ${34+(queue.length-i-1)/10*(224-34)})`,
    		width: 1.5
			//dash: 'dot'
    		}
  		}; 

  		output.push(formattedtrace); 
	}
	return output; 
}



// Export each plotted trace with its own x/y columns, preserving unequal lengths.
function buildTraceDownload() {
  function plainText(text) {
    var element = document.createElement('span');
    element.innerHTML = String(text || '').replace(/<sub>/gi, '_');
    return element.textContent;
  }
  function csvCell(value) {
    if (value == null) return '';
    return String(value);
  }
  var columns = [];
  var nameCounts = Object.create(null);
  var inputCount = 0;
  ['myDiv1', 'myDiv2', 'myDiv4'].forEach(function(id) {
    var plot = document.getElementById(id);
    (plot.data || []).forEach(function(trace) {
      var traceName = plainText(trace.name);
      var name;
      if (traceName.indexOf('I_input') !== -1) {
        inputCount++;
        name = inputCount === 1 ? 'I_input' : 'I_input' + inputCount;
      } else if (id === 'myDiv1') {
        name = 'V_m';
      } else if (traceName.indexOf('I_Na') !== -1) {
        name = 'I_Na';
      } else if (traceName.indexOf('I_K') !== -1) {
        name = 'I_K';
      } else if (traceName.indexOf('I_leak') !== -1) {
        name = 'I_leak';
      } else {
        name = 'I_total';
      }
      var saved = traceName.match(/No\.(\d+)/);
      var suffix = /^last/i.test(traceName) ? '_last' : saved ? '_saved' + saved[1] : '';
      var key = name + suffix;
      nameCounts[key] = (nameCounts[key] || 0) + 1;
      if (nameCounts[key] > 1) suffix += '_' + nameCounts[key];
      columns.push({name: name + '_time' + suffix, values: trace.x || []});
      columns.push({name: name + suffix, values: trace.y || []});
    });
  });
  var rows = [columns.map(function(column) { return csvCell(column.name); }).join(',')];
  var length = columns.reduce(function(max, column) { return Math.max(max, column.values.length); }, 0);
  for (var i = 0; i < length; i++) {
    rows.push(columns.map(function(column) { return csvCell(column.values[i]); }).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}

document.getElementById('downloadTraces').addEventListener('click', function() {
  var blob = new Blob([buildTraceDownload()], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'HH_traces.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
});
