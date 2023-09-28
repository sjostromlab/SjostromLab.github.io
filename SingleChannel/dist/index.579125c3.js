//import { Chart } from 'chart.js/auto'
function qMatrix(height) {
    return {
        "C1": {
            "C1": -100000 * height,
            "C2": 100000.0 * height,
            "C3": 0,
            "O": 0
        },
        "C2": {
            "C1": 50,
            "C2": -64,
            "C3": 4,
            "O": 10
        },
        "C3": {
            "C1": 0,
            "C2": 0.02,
            "C3": -0.02,
            "O": 0
        },
        "O": {
            "C1": 0,
            "C2": 0.5,
            "C3": 0.0,
            "O": -0.5
        }
    };
}
function drawTrace(data, elementID, timeStep, title, metadata) {
    return new Chart(document.getElementById(elementID), {
        type: "line",
        data: {
            labels: [
                ...Array(data.length).keys()
            ].map((x)=>(x * timeStep).toFixed(1)),
            datasets: [
                {
                    label: "Current",
                    data: data,
                    pointRadius: 0
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: false
                },
                subtitle: {
                    display: true,
                    text: `emsemble size = ${metadata.ensembleSize}, n = ${metadata.n}, duration = ${metadata.duration} ms, u = ${metadata.u}, max time = ${metadata.maxTime} ms, sampling frequency = ${metadata.samplingFrequency} kHz, cutoff frequency = ${metadata.cutoffFrequency} kHz`,
                    padding: {
                        bottom: 20
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Current (pA)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Time (ms)"
                    }
                }
            }
        }
    });
}
function updateTrace(chart, data, timeStep, metadata) {
    chart.data.datasets[0].data = data;
    chart.data.labels = [
        ...Array(data.length).keys()
    ].map((x)=>(x * timeStep).toFixed(1));
    chart.options.plugins.subtitle.text = `emsemble size = ${metadata.ensembleSize}, n = ${metadata.n}, duration = ${metadata.duration} ms, u = ${metadata.u}, max time = ${metadata.maxTime} ms, sampling frequency = ${metadata.samplingFrequency} kHz, cutoff frequency = ${metadata.cutoffFrequency} kHz`;
    chart.update();
}
function drawHistrogram(data, elementID, metadata) {
    return new Chart(document.getElementById(elementID), {
        type: "bar",
        data: {
            labels: [
                ...Array(data.length).keys()
            ],
            datasets: [
                {
                    label: `Peak EPSC Frequency`,
                    data: data
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Peak EPSC Amplitiude Distribution`
                },
                subtitle: {
                    display: true,
                    text: `emsemble size = ${metadata.ensembleSize}, n = ${metadata.n}, duration = ${metadata.duration} ms, u = ${metadata.u}, max time = ${metadata.maxTime} ms, sampling frequency = ${metadata.samplingFrequency} kHz, cutoff frequency = ${metadata.cutoffFrequency} kHz`,
                    padding: {
                        bottom: 20
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Frequency"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Current (pA)"
                    }
                }
            }
        }
    });
}
function updateHistogram(chart, data, metadata) {
    chart.data.datasets[0].data = data;
    chart.data.labels = [
        ...Array(data.length).keys()
    ];
    chart.options.plugins.subtitle.text = `emsemble size = ${metadata.ensembleSize}, n = ${metadata.n}, duration = ${metadata.duration} ms, u = ${metadata.u}, max time = ${metadata.maxTime} ms, sampling frequency = ${metadata.samplingFrequency} kHz, cutoff frequency = ${metadata.cutoffFrequency} kHz`;
    chart.update();
}
function defaultMetadata() {
    return {
        n: 200,
        ensembleSize: 100,
        samplingFrequency: 40,
        cutoffFrequency: 3,
        duration: 1,
        u: 0.07,
        maxTime: 10,
        height: 0.001,
        qMatrix: qMatrix,
        clist: {
            "C1": 0,
            "C2": 0,
            "C3": 0,
            "O": 8
        },
        initalState: "C1",
        timeStep: 0.02
    };
}
function defaultWatch() {
    return {
        n: "updateGraphs",
        ensembleSize: "updateGraphs",
        samplingFrequency: "updateGraphs",
        cutoffFrequency: "updateGraphs",
        duration: "updateGraphs",
        u: "updateGraphs",
        maxTime: "updateGraphs",
        height: "updateGraphs",
        clist: "updateGraphs",
        initalState: "updateGraphs",
        timeStep: "updateGraphs"
    };
}
function defaultMethods() {
    return {
        drawGraphs () {
            let data = peakEPSCs(this.ensembleSize, this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.n, this.u, this.maxTime, this.samplingFrequency, this.cutoffFrequency);
            window.histogram = drawHistrogram(data, "histogram", this);
            //data = singletrace(this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.u, this.maxTime, this.timeStep)
            //window.singlegraph = drawTrace(data, "singletrace", this.timeStep, "Single Trace", this)
            data = meancurrent(this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.n, this.u, this.maxTime, this.timeStep);
            window.meangraph = drawTrace(data, "meancurrent", this.timeStep, "Mean Current", this);
        //data = filtertest(this.ensembleSize, this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.u, this.maxTime, this.samplingFrequency, this.cutoffFrequency)
        //window.filtered = drawTrace(data.filteredCurrent, "filtered", data.timeStep, "Filtered Mean Current", this)
        //window.unfiltered = drawTrace(data.unfilteredCurrent, "unfiltered", data.timeStep, "Unfiltered Mean Current", this)
        },
        updateGraphs () {
            let data = peakEPSCs(this.ensembleSize, this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.n, this.u, this.maxTime, this.samplingFrequency, this.cutoffFrequency);
            updateHistogram(histogram, data, this);
            //data = singletrace(this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.u, this.maxTime, this.timeStep)
            //updateTrace(singlegraph, data, this.timeStep, this)
            data = meancurrent(this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.n, this.u, this.maxTime, this.timeStep);
            updateTrace(meangraph, data, this.timeStep, this);
        //data = filtertest(this.ensembleSize, this.qflatpulse, this.qPause, this.clist, this.initalState, this.duration, this.u, this.maxTime, this.samplingFrequency, this.cutoffFrequency)
        //updateTrace(filtered, data.filteredCurrent, data.timeStep, this)
        //updateTrace(unfiltered, data.unfilteredCurrent, data.timeStep, this)
        }
    };
}
function setSliderCallbacks(metadata) {
    let sliders = document.querySelectorAll("input[type='range']");
    sliders.forEach((slider)=>{
        slider.addEventListener("input", (event)=>{
            let id = event.target.id;
            let value = event.target.value;
            metadata[id] = value;
        });
    });
}
window.Worker; //(async function() {
 //  slider = document.getElementById("nRange");
 //  slider.oninput = function() {
 //    output.innerHTML = this.value;
 //  }
 //})()
 //(async function() {
 //  let height = 0.001;
 //  let duration = 1;
 //  let u = 0.07;
 //  let tmax = 10;
 //  let tstep = 0.2;
 //  
 //  let qflatpulse = qMatrix(height)
 //  let qPause = qMatrix(0)
 //  let clist = {
 //    "C1": 0,
 //    "C2": 0,
 //    "C3": 0,
 //    "O": 8
 //  }
 //  let initalState = "C1";
 //  let n = 200
 //  let s = meancurrent(qflatpulse, qPause, clist, initalState, duration, n, u, tmax, tstep)
 //  let ensembleSize = 100
 //  let samplingFrequency = 40
 //  let cutoffFrequency = 3
 //
 //  let filtertestData = filtertest(ensembleSize, qflatpulse, qPause, clist, initalState, duration, u, tmax, samplingFrequency, cutoffFrequency)
 //  drawTrace(filtertestData.filteredCurrent, "filtered", filtertestData.timeStep, "Filtered Mean Currents")
 //  drawTrace(filtertestData.unfilteredCurrent, "unfiltered", filtertestData.timeStep, "Unfiltered Mean Currents")
 //  let singletraceData = singletrace(qflatpulse, qPause, clist, initalState, duration, u, tmax, tstep)
 //  drawTrace(singletraceData, "singletrace", tstep, "Single Trace Current")
 //  let meancurrentData = meancurrent(qflatpulse, qPause, clist, initalState, duration, n, u, tmax, tstep)
 //  drawTrace(meancurrentData, "meancurrent", tstep, "Mean Current")
 //})()

//# sourceMappingURL=index.579125c3.js.map
