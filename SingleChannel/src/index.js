import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin);

var zoomMax = 0
var globalTimeStep = 0
var maxTraceAmp = 0
function qMatrix(height) {
  return {
    "C1": {"C1": -100000.0*height, "C2": 100000.0*height, "C3": 0, "O": 0},
    "C2": {"C1": 50, "C2": -64, "C3": 4, "O": 10},
    "C3": {"C1": 0, "C2": 0.02, "C3": -0.02, "O": 0},
    "O": {"C1": 0, "C2": 0.5, "C3": 0.0, "O": -0.5},
  }
}
function transformMeanData(data){
  let transformedData = data.map((x, i) => ({x: i * globalTimeStep, y: x}))
  for (let i = 1; i < data.length - 1; i++){
    if (data[i] == data[i - 1] && data[i] == data[i + 1]){
      transformedData[i].y = null
    }
  }
  return transformedData.filter(x => x.y != null)
}
function drawTrace(data, elementID, timeStep, title, metadata, alvarez, meansData){
  globalTimeStep = timeStep
  let newData = []
  if (!alvarez){
    newData = transformMeanData(data)
  }
  else {
    newData = data
  }
  return new Chart(
    document.getElementById(elementID),
    {
      type: 'line',
      data: {
        datasets: [
          {
            type: 'line',
            label: !alvarez ? "Current" : "Variance",
            data: newData,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: !alvarez ? 'rgb(125, 99, 233)' : 'rgb(212, 12, 211)',
            indexAxis: 'x'
          },
          {
            type: 'line',
            label: "Mean",
            data: !alvarez ? [] : meansData,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: 'rgb(255, 99, 132)',
            indexAxis: 'x',
            yAxisID: 'y2',
          }
        ]
      },
      options: {
        cubicInterpolationMode: 'monotone',
        animation: false,
        parsing: false,
        plugins: {
            title: {
                display: true,
                text: title
            },
            legend: {
                display: alvarez ? true : false
            },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: !alvarez ? 'Current (pA)' : 'Variance (pA^2)'
            },
            ticks: {
              callback: function(value, index, ticks) {
                return `${value.toFixed(2)}`
              }
            },
            position: alvarez ? 'right' : 'left',
          },
          y2: {
            display: alvarez ? true : false,
            title: {
              display: alvarez ? true : false,
              text: 'Mean (pA)'
            },
            position: 'left',
          },
          x: {
            type: 'linear',
            max: metadata.maxTime,
            title: {
              display: true,
              text: 'Time (ms)'
            }
          },
        }
      }
    }
  )
}
function zoomOptions(){
  return {
    pan: {
      enabled: true,
      mode: 'y'
    },
    limits: {
      y: {min:0, max: zoomMax, minRange: 2.1}
    },
    zoom: {
      mode: 'y',
      wheel: {
        enabled: true,
      },
      pinch: {
        enabled: true
      },
    }
  }
}
function traceDataTransform(data, index){
  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
  ]
  return {
    label: "Current",
    type: 'line',
    data: transformMeanData(data.map(x => x + (index* maxTraceAmp) + (maxTraceAmp - 0.5))),
    pointRadius: 0,
    borderColor: colors[index % colors.length],
    borderWidth: 1
  }
}
function drawTraces(data, elementID, timeStep, title, metadata){
  maxTraceAmp = Math.ceil(metadata.u * metadata.conductance) + 0.5
  zoomMax = data.length * maxTraceAmp
  globalTimeStep = timeStep
  return new Chart(
    document.getElementById(elementID),
    {
      type: 'line',
      data: {
        datasets: data.map(traceDataTransform)
      },
      options: {
        animation: false,
        events: [],
        plugins: {
            title: {
                display: true,
                text: title
            },
            legend: {
                display: false
            },
            zoom: zoomOptions(),
        },
        scales: {
          y: {
            display: true,
            min: 0,
            max: zoomMax,
            position: 'left',
            title: {
              display: true,
              text: 'Current (pA)'
            },
            ticks: {
              stepSize: maxTraceAmp / 3,
              callback: function(value, index, ticks) {
                if (value % maxTraceAmp > maxTraceAmp - 0.5) {
                  return ""
                }
                return `${((value % maxTraceAmp) - (maxTraceAmp - 0.5)).toFixed(2)}`
              }
            }
          },
          x: {
            type: 'linear',
            max: metadata.maxTime,
            title: {
              display: true,
              text: 'Time (ms)'
            }
          },
        }
      }
    }
  )
}
function modelPlotTransform(data, metadata, min){
  let resultData = []
  let step = (-min) / 15
  for (let i = min; i <= 0; i += step){
    let modelValue = (metadata.modelSingleCurrent * i) - ((1/metadata.modelChannelAmount) * (i * i))
    resultData.push({x: i, y: modelValue})
  }
  resultData.push({x: 0, y: 0})
  return resultData
}
function drawScatter(elementID, dataset, model, title, metadata, modelVisibility){
  let min = Math.min(...dataset.map(x => x.x))
  const data = {
    datasets: [{
      type: 'scatter',
      label: title,
      data: dataset,
      backgroundColor: 'rgb(255, 99, 132)',
      order: 2,
    },
    {
      label: "Model",
      type: 'line',
      data: modelPlotTransform(dataset, metadata, min),
      borderColor: 'rgb(54, 162, 235)',
      radius: 0,
      order: 1,
      borderWidth: modelVisibility ? 2 : 0,
    }
  ]
  }
  return new Chart(
    document.getElementById(elementID),
    {
      data: data,
      options: {
        animation: false,
        plugins: {
            title: {
                display: true,
                text: title
            },
            legend: {
                display: false
            }
        },
        scales: {
          y: {
            ticks: {
              maxRotation: 0,
            },
            min: 0, 
            max: Math.ceil(Math.max(...dataset.map(x => x.y))),
            title: {
              display: true,
              text: 'Variance (pA^2)'
            }
          },
          x: {
            ticks: {
              maxRotation: 0,
            },
            //max: 0,
            //min: Math.floor(min),
            type: 'linear',
            title: {
              display: true,
              text: 'Mean (pA)'
            }
          }
        }
      }
    }
  )
}
function updateScatter(chart, data, model, metadata, modelVisibility){
  let min = Math.min(...data.map(x => x.x))
  let max = Math.max(...data.map(x => x.y))
  chart.data.datasets[0].data = data
  chart.data.datasets[1].data = modelPlotTransform(data, metadata, min)
  chart.data.datasets[1].borderWidth = modelVisibility ? 2 : 0
  chart.options.scales.y.max = Math.ceil(max)
  //chart.options.scales.x.min = Math.floor(min)
  chart.update()
}
function updateTrace(chart, data, timeStep, metadata, alvarez, meanData){
  globalTimeStep = timeStep
  chart.data.datasets[0].data = !alvarez ? transformMeanData(data) : data
  chart.data.datasets[1].data = alvarez ? meanData : []
  chart.options.scales.x.max = metadata.maxTime
  chart.update()
}
function updateTraces(chart, data, timeStep, metadata){
  globalTimeStep = timeStep
  maxTraceAmp = Math.ceil(metadata.u * metadata.conductance) + 0.5
  zoomMax = data.length * maxTraceAmp
  chart.options.plugins.zoom = zoomOptions()
  chart.options.scales.y.max = zoomMax
  chart.data.datasets = data.map(traceDataTransform)
  chart.options.scales.x.max = metadata.maxTime
  chart.update()
}

function defaultMetadata(){
  return {
    n: 20,
    ensembleSize: 5,
    samplingFrequency: 40,
    cutoffFrequency: 3,
    duration: 1,
    u: 0.07,
    maxTime: 10,
    height: 0.001,
    qMatrix: qMatrix,
    conductance: 8,
    clist: createClist(8),
    initalState: "C1",
    timeStep: 0.1,
    singlechannelNoise: false,
    modelVisibility: false,
    randomSeed: 0,
    modelSingleCurrent: -0.5,
    modelChannelAmount: 1,
    modelDataPoints: 50,
  }
}
function createClist(conductance){
  return {
    "C1": 0,
    "C2": 0,
    "C3": 0,
    "O": conductance
  }
}
function defaultWatch(){
  return {
    n: "updateGraphs",
    nNum: "updateGraphs",
    ensembleSize: "updateGraphs",
    ensembleSizeNum: "updateGraphs",
    samplingFrequency:  "updateGraphs",
    cutoffFrequency: "updateGraphs",
    duration: "updateGraphs",
    durationNum: "updateGraphs",
    u: "updateGraphs",
    maxTime: "updateGraphs",
    maxTimeNum: "updateGraphs",
    height: "updateGraphs",
    clist: "updateGraphs",
    initalState: "updateGraphs",
    timeStep: "updateGraphs",
    singlechannelNoise: "updateGraphs",
    singlechannelNoiseNum: "updateGraphs",
    modelVisibility: "updateGraphs",
    randomSeed: "updateGraphs",
    modelSingleCurrent: "updateGraphs",
    modelChannelAmount: "updateGraphs",
    conductance: "updateGraphs",
    conductanceNum: "updateGraphs",
  }
}
function getMessage(metadata){
  return {
    ensembleSize: metadata.ensembleSize,
    qflatpulse: metadata.qflatpulse,
    qPause: metadata.qPause,
    conductance: metadata.conductance,
    clist: createClist(metadata.conductance),
    initalState: metadata.initalState,
    duration: metadata.duration,
    n: metadata.n,
    u: metadata.u,
    timeStep: metadata.timeStep,
    maxTime: metadata.maxTime,
    samplingFrequency: metadata.samplingFrequency,
    cutoffFrequency: metadata.cutoffFrequency,
    singlechannelNoise: metadata.singlechannelNoise,
    randomSeed: metadata.randomSeed,
    modelSingleCurrent: metadata.modelSingleCurrent,
    modelChannelAmount: metadata.modelChannelAmount,
  }
}
function modelToString(metadata){
  let modelString = `Model Equation: <br> $$\\sigma^2 = ${metadata.modelSingleCurrent.toFixed(2)}I - \\frac{1}{${metadata.modelChannelAmount}}I^2$$`
  return modelString
}
function estimateSlope(metadata){
  let minX = Math.min(...metadata.CVdata.map(x => x.x))
  let maxX = Math.max(...metadata.CVdata.map(x => x.x))
  let xSum = 0
  let ySum = 0
  let xxSum = 0
  let xySum = 0
  let percentage = 0.1
  let tempData = metadata.CVdata.filter(x => x.x >= minX * percentage)
  if (tempData.length < 2){
    tempData = metadata.CVdata.map(x => x).sort((a, b) => b.x - a.x).slice(0, Math.floor(metadata.CVdata.length * 0.2) + 1)
  }
  let count = tempData.length
  tempData.forEach(x => {
    xSum += x.x
    ySum += x.y
    xxSum += x.x * x.x
    xySum += x.x * x.y
  })
  let result = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
  return result
}
function updateModelParams(update, metadata){
  metadata.modelChannelAmount = metadata.n
  metadata.modelSingleCurrent = estimateSlope(metadata)
  if (update) {
    document.getElementById("modelSingleCurrentDiv").style = "display: none"
    document.getElementById("modelChannelAmountDiv").style = "display: none"
    document.getElementById("modelParamsDiv").style = "display: flex"
  }
  else {
    document.getElementById("modelSingleCurrentDiv").style = "display: none"
    document.getElementById("modelChannelAmountDiv").style = "display: none"
    document.getElementById("modelParamsDiv").style = "display: none"
  }
}
function defaultMethods(){
  return {
    drawGraphs() {
      worker.terminate()
      worker = new Worker(new URL('worker.js', import.meta.url))
      worker.postMessage(getMessage(this))
      worker.onmessage = (e) => {
        window.singletraceGraph = drawTraces(e.data.singletraces, "singletraces", e.data.timeStep, "Single Trace Sweeps", e.data)
        window.meantraceGraph = drawTrace(e.data.meantrace, "meantrace", e.data.timeStep, "Sum Trace", e.data, false)
        window.alvarezChart = drawTrace(e.data.variances, "alvarez", e.data.timeStep, "Variance and Mean Current Vs. Time", e.data, true, e.data.means)
        updateModelParams(this.modelVisibility, e.data)
        window.CVgraph = drawScatter("CV", e.data.CVdata, window.CVmodel, "Variance Vs. Mean", e.data, this.modelVisibility)
        document.getElementById("stderr").innerHTML = "\\(" + e.data.stderror.toFixed(4) + "\\)"
        document.getElementById("modelParams").innerHTML = modelToString(e.data)
        MathJax.typeset()
      }
    },
    updateGraphs() {
      worker.terminate()
      worker = new Worker(new URL('worker.js', import.meta.url))
      worker.postMessage(getMessage(this))
      worker.onmessage = (e) => {
        updateTraces(window.singletraceGraph, e.data.singletraces, e.data.timeStep, e.data)
        updateTrace(window.meantraceGraph, e.data.meantrace, e.data.timeStep, e.data, false, e.data.means)
        updateTrace(window.alvarezChart, e.data.variances, e.data.timeStep, e.data, true, e.data.means)
        updateModelParams(this.modelVisibility, e.data)
        updateScatter(window.CVgraph, e.data.CVdata, window.CVmodel, e.data, this.modelVisibility)
        document.getElementById("stderr").innerHTML = "\\(" + e.data.stderror.toFixed(4) + "\\)"
        document.getElementById("modelParams").innerHTML = modelToString(e.data)
        MathJax.typeset()
      }
    }
  }
}
function setSliderCallbacks(metadata){
  let sliders = document.querySelectorAll("input[type='range'], input[type='number']")
  sliders.forEach((slider) => {
    slider.addEventListener("input", (event) => {
      let id = event.target.id
      if (id.endsWith("Num")) {
        id = id.slice(0, -3)
      }
      let value = parseFloat(event.target.value)
      metadata[id] = value
    })
  })
}
function setCheckboxCallbacks(metadata){
  let checkboxes = document.querySelectorAll("input[type='checkbox']")
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      let id = event.target.id
      let value = event.target.checked
      metadata[id] = value
    })
  })
}
if (window.Worker) {
  var worker = new Worker(new URL('worker.js', import.meta.url))
}

const { createApp } = Vue
      
createApp({
  data() {
    return defaultMetadata()
  },
  watch: defaultWatch(),
  methods: defaultMethods(),
  mounted() {
    this.drawGraphs()
    setSliderCallbacks(this)
    setCheckboxCallbacks(this)
  },
  computed: {
    qflatpulse() {
      return qMatrix(this.height)
    },
    qPause() {
      return qMatrix(0)
    }
  }
}).mount('#vueApp')