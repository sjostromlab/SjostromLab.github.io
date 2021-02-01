var config = {responsive: true}; 

var layout = {
  title: '<b>Voltage Time Series</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>Membrane Potential (mV)</b>'
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
  title: '<b>I vs. Time</b>',
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
  title: '<b>Total I vs. Time</b>',
  xaxis: {
    title: '<b>Time (ms)</b>'
  },
  yaxis: {
    title: '<b>I<sub>t</sub></b>'
  }, 
  autosize: true, 
  paper_bgcolor: '#c7c7c7',
  showlegend: true,
}; 

var dt = 0.01;               // time step for forward euler method
var offset = 3/dt; 
var vcoffset = 25/dt; 
var Cm = 0.01; 

var gNa = 1.2;  
var eNa=55.17;
var gK = 0.36;  
var eK=-72.14;
var gL=0.003;  
var eL=-49.42; 

var tspan = 25; 
var I = 0.1; 
var curd = 1; 
var v = -60; 
var mi = alphaM(v)/(alphaM(v)+betaM(v)); 
var hi = alphaH(v)/(alphaH(v)+betaH(v)); 
var ni = alphaN(v)/(alphaN(v)+betaN(v)); 

var VC = 0; 
var clampv = 0; 
var restv = -60; 

var t = []; 
var V = []; 
var m = []; 
var h = []; 
var n = []; 
var ina = []; 
var ik = []; 
var il = []; 
var fik = []; 
var fina = []; 
var curinjt = []; 
var curinj = []; 
var itt = []; 

var oldV = []; 
var oldina = []; 
var oldik = []; 
var olditt = []; 
var VQ = []; 
var inaQ = []; 
var ikQ = []; 
var ittQ = []; 

var userlast10Flag = document.getElementById("last10Trace"); 
var userlastFlag = document.getElementById("lastTrace"); 
var userVCFlag = document.getElementById("VC"); 
var userTTX = document.getElementById("ttx"); 
var userTEA = document.getElementById("tea"); 

var userVCpanel = document.getElementById("VCPanel"); 
var userclampV = document.getElementById("clampV"); 
var userrestV = document.getElementById("restV"); 

var userParapanel = document.getElementById("ParaPanel"); 
var usercustomFlag = document.getElementById("custompara"); 
var usermi = document.getElementById("mi"); 
var usermRange = document.getElementById("mRange"); 
var userhi = document.getElementById("hi"); 
var userhRange = document.getElementById("hRange"); 
var userni = document.getElementById("ni"); 
var usernRange = document.getElementById("nRange"); 

var usertspan = document.getElementById("tspan"); 
var useriinput = document.getElementById("iinput"); 
var usercurd = document.getElementById("duration"); 
var userrv = document.getElementById("rv"); 

document.getElementById("reset").addEventListener("click", resetPanel); 
document.getElementById("last10Trace").addEventListener("change", checkMode10); 
document.getElementById("lastTrace").addEventListener("change", checkMode); 
document.getElementById("VC").addEventListener("change", VCcheck); 
document.getElementById("ttx").addEventListener("change", blocker); 
document.getElementById("tea").addEventListener("change", blocker); 

document.getElementById("clampV").addEventListener("change", VCsubmit); 
document.getElementById("restV").addEventListener("change", VCsubmit); 

document.getElementById("custompara").addEventListener("change", customize); 
document.getElementById("mi").addEventListener("change", submit); 
document.getElementById("mRange").addEventListener("input", submitSlider); 
document.getElementById("hi").addEventListener("change", submit); 
document.getElementById("hRange").addEventListener("input", submitSlider); 
document.getElementById("ni").addEventListener("change", submit); 
document.getElementById("nRange").addEventListener("input", submitSlider); 

document.getElementById("tspan").addEventListener("change", submit); 
document.getElementById("iinput").addEventListener("change", submit); 
document.getElementById("duration").addEventListener("change", submit); 
document.getElementById("rv").addEventListener("change", submit); 

function VCcheck(event) {
	event.preventDefault(); 

	if (userVCFlag.checked) {
		VC = 1; 
		userVCpanel.classList.remove("hidden"); 
		userVCpanel.classList.add("shown"); 
		useriinput.disabled = true; 
		userrv.disabled = true; 
		// userParapanel.classList.remove("shown"); 
		// userParapanel.classList.add("hidden"); 
		useriinput.classList.remove("shown"); 
		useriinput.classList.add("hidden"); 
		document.getElementById("iinputlabel").style.display = 'none';
		userrv.classList.remove("shown"); 
		userrv.classList.add("hidden"); 
		document.getElementById("rvlabel").style.display = 'none';

		usercurd.value = 25; 
		VCsubmit(event); 
	} else {
		VC = 0; 
		userVCpanel.classList.remove("shown"); 
		userVCpanel.classList.add("hidden"); 
		useriinput.disabled = false; 
		userrv.disabled = false; 
		// userParapanel.classList.remove("hidden"); 
		// userParapanel.classList.add("shown"); 
		useriinput.classList.remove("hidden"); 
		useriinput.classList.add("shown"); 
		document.getElementById("iinputlabel").style.display = 'inline';
		userrv.classList.remove("hidden"); 
		userrv.classList.add("shown"); 
		document.getElementById("rvlabel").style.display = 'inline';
		submit(event); 
	}
}

window.addEventListener("load", (event) => {
  initialize(); 
});

function resetPanel(event) {
	event.preventDefault(); 
	
	tspan = 25; 
	I = 0.1; 
	curd = 1; 
	v = -60; 
	mi = alphaM(v)/(alphaM(v)+betaM(v)); 
	hi = alphaH(v)/(alphaH(v)+betaH(v)); 
	ni = alphaN(v)/(alphaN(v)+betaN(v));  
	clampv = 0; 
	restv = -60; 

	VQ = []; 
	inaQ = []; 
	ikQ = []; 
	ittQ = []; 

	if (userVCFlag.checked) {curd = 25;} 

	initialize(); 
}

function initialize() {
	usermi.value = mi; 
	usermRange.value = mi; 
	userhi.value = hi; 
	userhRange.value = hi; 
	userni.value = ni; 
	usernRange.value = ni; 
	usertspan.value = tspan; 
	useriinput.value = I; 
	usercurd.value = curd; 
	userrv.value = v; 
	userclampV.value = clampv; 
	userrestV.value = restv; 
  	
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
	submit(event); 
}

function submit(event) {
  event.preventDefault(); 

  if (VC) {
  	VCsubmit(event); 
  } else {
  	oldV = V.slice(); 
  	oldina = ina.slice(); 
	oldik = ik.slice(); 
	olditt = itt.slice(); 

	buildQ(VQ, V.slice()); 
	buildQ(inaQ, ina.slice()); 
	buildQ(ikQ, ik.slice()); 
	buildQ(ittQ, itt.slice()); 
  	
  	foolProve(); 
  	tspan = parseFloat(usertspan.value); 
  	I = parseFloat(useriinput.value); 
  	curd = parseFloat(usercurd.value); 
  	v = parseFloat(userrv.value); 
  
  	usermRange.value = usermi.value; 
  	userhRange.value = userhi.value; 
  	usernRange.value = userni.value; 
  
  	mi = parseFloat(usermi.value); 
  	hi = parseFloat(userhi.value);
  	ni = parseFloat(userni.value); 
  
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
	fik = []; 
	fina = []; 
	curinj = []; 
	curinjt = []; 
	itt = []; 

	hhrun(); 
}

function hhrun() {
	
	var loop = Math.ceil(tspan/dt);   // no. of iterations of euler 
	var loop1 = Math.ceil(curd/dt); 

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
	}

	for (var i = offset; i < loop; i++) {
		t.push(tspan*(i+1)/loop); 

		if (i-offset < loop1) {
			V.push(V[i] + dt*(1/Cm)*(I-(Ich = ina[i] + ik[i] + il[i]))); 
			curinjt.push(tspan*(i)/loop); 
			curinj.push(I); 
		} else {
			V.push(V[i] + dt*(1/Cm)*(0-(Ich = ina[i] + ik[i] + il[i]))); 
		}
		
		m.push(m[i] + dt*(alphaM(V[i])*(1-m[i]) - betaM(V[i])*m[i])); 
		h.push(h[i] + dt*(alphaH(V[i])*(1-h[i]) - betaH(V[i])*h[i])); 
		n.push(n[i] + dt*(alphaN(V[i])*(1-n[i]) - betaN(V[i])*n[i])); 
		
		ina.push(gNa*Math.pow(m[i+1],3)*h[i+1]*(V[i+1]-eNa)); 
		ik.push(gK*Math.pow(n[i+1],4)*(V[i+1]-eK)); 
		il.push(gL*(V[i+1]-eL)); 
		itt.push(ina[i+1]+ik[i+1]+il[i+1]); 
	}

	for (var i = 0; i < ina.length; i++) {
		fik.push(-ik[i]); 
		fina.push(-ina[i]); 
	}
}

function draw() {
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
    		width: 1.5,
			dash: 'dot'
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
    		width: 1.5,
			dash: 'dot'
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
    		width: 1.5,
			dash: 'dot'
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

  	var Itt = {
  		x: t,
  		y: itt,
  		type: 'scatter', 
  		name: 'I<sub>t</sub>', 
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
  		name: 'last I<sub>t</sub>', 
  		line: {
    		color: 'rgb(128, 128, 128)',
    		width: 1.5,
			dash: 'dot'
    	}
  	};

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
  		Plotly.newPlot('myDiv1', [Vt, oldVt, curinjm], layout, config); 
  		Plotly.newPlot('myDiv2', [Ina, oldIna, Ik, oldIk, Il], layout8, config); 
  		// Plotly.newPlot('myDiv3', [mt, nt, ht], layout9, config); 
  		Plotly.newPlot('myDiv4', [Itt, oldItt], layout10, config); 
  	} else {
  		Plotly.newPlot('myDiv1', [Vt, curinjm], layout, config); 
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
  	tspan = parseFloat(usertspan.value); 
  	I = parseFloat(useriinput.value); 
  	curd = parseFloat(usercurd.value); 
  	v = parseFloat(userrv.value); 
  	clampv = parseFloat(userclampV.value); 
  	restv = parseFloat(userrestV.value); 
  	
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
	
	var loop = Math.ceil(tspan/dt);   // no. of iterations of euler 
	var loop1 = Math.ceil(curd/dt); 

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

		if (i < loop1) {
			V.push(clampv); 
		} else {
			V.push(restv); 
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
    		width: 1.5,
			dash: 'dot'
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
    		width: 1.5,
			dash: 'dot'
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
    		width: 1.5,
			dash: 'dot'
    	}
  	};

  	var Itt = {
  		x: t,
  		y: itt,
  		type: 'scatter', 
  		name: 'I<sub>t</sub>', 
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
  		name: 'last I<sub>t</sub>', 
  		line: {
    		color: 'rgb(128, 128, 128)',
    		width: 1.5,
			dash: 'dot'
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
} 

function checkMode(event) {
	event.preventDefault(); 
	userlast10Flag.checked = false; 
	if (VC) {VCdraw();} else {draw();}
} 

function checkMode10(event) {
	event.preventDefault(); 
	userlastFlag.checked = false; 
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

	submit(event); 
} 

function buildQ(traceQ, trace) {
	if (traceQ.length < 10) {
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
  		name: `I<sub>t</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${128+(queue.length-i-1)*10}, ${128+(queue.length-i-1)*10}, ${128+(queue.length-i-1)*10})`,
    		width: 1.5,
			dash: 'dot'
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
  		type: 'scatter', 
  		mode: 'lines',
  		name: `V<sub>m</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(255, ${165+(queue.length-i-1)/10*(255-165)}, ${0+(queue.length-i-1)/10*(255-0)})`,
    		width: 1.5,
			dash: 'dot'
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
  		name: `I<sub>Na</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${51+(queue.length-i-1)/10*(229-51)}, ${181+(queue.length-i-1)/10*(229-181)}, 229)`,
    		width: 1.5,
			dash: 'dot'
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
  		name: `I<sub>K</sub> No.${i+1}`, 
  		line: {
    		color: `rgb(${34+(queue.length-i-1)/10*(224-34)}, ${139+(queue.length-i-1)/10*(224-139)}, ${34+(queue.length-i-1)/10*(224-34)})`,
    		width: 1.5,
			dash: 'dot'
    		}
  		}; 

  		output.push(formattedtrace); 
	}
	return output; 
}