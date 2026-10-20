/*
 * Hopfield associative-memory network — provenance
 *
 * Model lineage: this JavaScript simulation is based on a MATLAB Hopfield
 * implementation written by Rui P. Costa for P. Jesper Sjöström's NEUR 603
 * teaching in 2014. Costa was then an MSc and PhD student in Sjöström's
 * laboratory at University College London and is now a professor at the
 * University of Oxford. Sjöström later clarified portions of the MATLAB
 * source, including its asynchronous update code (2021).
 *
 * Original JavaScript adaptation: Vivian Chenfei Wu.
 * Project period: May–August 2022
 * Developed in the laboratory of P. Jesper Sjöström, McGill University.
 * Authorship and model lineage confirmed by Sjöström; provenance updated
 * 18 October 2026.
 *
 * Subsequent teaching/interface updates include changes made with OpenAI
 * Codex under Sjöström's direction in 2026. This note records project-level
 * provenance and is not a line-by-line change log.
 */

// Bypass the legacy Plotly Safari download path using a PNG Blob.
function downloadPlotPNG(plot) {

  return Plotly.toImage(plot, {
    format: 'png', width: plot._fullLayout.width, height: plot._fullLayout.height, scale: 2
  }).then(function(dataURL) {
    var binary = atob(dataURL.split(',')[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([bytes], {type: 'image/png'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = ('Hopfield_' + plot.id) + '.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
  }).catch(function(error) {
    console.error('PNG export failed:', error);
    window.alert('The PNG could not be generated. Please try again.');
  });
}

function hopfieldPlotConfig() {
return {
  responsive: true,
  modeBarButtonsToRemove: ['toImage'],
  modeBarButtonsToAdd: [{
    name: 'Download plot as a png',
    icon: Plotly.Icons.camera,
    click: downloadPlotPNG
  }]
};
}

var matrice=[];
var hopfieldAnimationData = null;
var hopfieldAnimationState = null;
var myInt = null;
var editableNoisyMatrices = null;
var noisePainting = null;
var generatedMemoryCount = null;
var generatedMatrixSize = null;
var currentSummaryMemoryIndex = 0;
var matrixRegenerationTimer = null;

function clearRecallResults() {
    clearInterval(myInt);
    myInt = null;
    hopfieldAnimationData = null;
    hopfieldAnimationState = null;
    currentSummaryMemoryIndex = 0;

    document.getElementById("summaryPanel").style.display = "none";
    document.getElementById("allPlots").style.display = "none";
    document.getElementById("startAni").style.display = "none";
    document.getElementById("newUpdateOrder").style.display = "none";
    document.getElementById("animationStatus").textContent = "";
    document.getElementById("startIt").textContent = "Start animation";
    document.getElementById("startIt").style.display = "inline-block";
    document.getElementById("previousMemory").disabled = true;
    document.getElementById("nextMemory").disabled = true;
    document.getElementById("similarityBody").innerHTML = "";
    document.getElementById("recallOutcome").textContent = "";
    document.getElementById("summaryStored").innerHTML = "";
    document.getElementById("summaryNoisy").innerHTML = "";
    document.getElementById("summaryRecalled").innerHTML = "";
    document.getElementById("slide").innerText = 0;
    document.getElementById("countbox").innerText = 0;

    if(window.Plotly){
        Plotly.purge("summaryEnergy");
        Plotly.purge("LyPlot");
    }
}

function clearEditableNoisyCues(message) {
    editableNoisyMatrices = null;
    noisePainting = null;
    document.getElementById("noiseEditor").style.display = "none";
    document.getElementById("noiseCueGrid").innerHTML = "";
    document.getElementById("runRecall").disabled = true;
    document.getElementById("generateNoise").textContent = "Generate noisy cues";
    if(message) document.getElementById("errormsg").innerText = message;
}

function showMemoryEditingView() {
    var matrix = document.getElementById("matrix");
    matrix.style.display = "flex";
    matrix.style.visibility = "visible";
}

function memoryStructureIsCurrent() {
    return generatedMemoryCount === Number(document.getElementById("memorynum").value) &&
        generatedMatrixSize === Number(document.getElementById("matrixSize").value);
}

function networkEnergy(state, weights) {
  var energy = 0;
  for (var i = 0; i < state.length; i++) {
    for (var j = 0; j < state.length; j++) {
      energy += -0.5 * weights[i][j] * state[i] * state[j];
    }
  }
  return energy;
}

function shuffledIndices(length) {
  var indices = [];
  for (var i = 0; i < length; i++) indices.push(i);
  for (var j = length - 1; j > 0; j--) {
    var swapIndex = Math.floor(Math.random() * (j + 1));
    var temporary = indices[j];
    indices[j] = indices[swapIndex];
    indices[swapIndex] = temporary;
  }
  return indices;
}


function hopfield(requestedMemoryIndex){
    if(!memoryStructureIsCurrent()){
        clearRecallResults();
        clearEditableNoisyCues("Matrix settings are updating. Please try again.");
        return;
    }
    if(!editableNoisyMatrices){
        document.getElementById("errormsg").innerText =
            "Generate and edit the noisy cues before running recall.";
        return;
    }
    clearInterval(myInt);
    hopfieldAnimationState = null;
    inputmatrices=[];
    $(".grid").remove();
    

    
    const plot = document.getElementById("allPlots");
    plot.style.display="grid";
    plot.style.visibility="visible";
    document.querySelectorAll(".plots").forEach(a=>a.style.visibility="visible");

    const tohide = document.getElementById("matrix");
    tohide.style.display="none";
    let numberof = document.getElementById("memorynum").value;
    if(numberof==""){
    var number = sessionStorage.getItem("MemoryNum");
    }
    else{
        var number = numberof;
    }

    const matrixSize = document.getElementById("matrixSize").value;



    var matrix = new Array(matrixSize);
    for(let i=0; i<matrixSize; i++){
        matrix[i]=new Array(matrixSize);
        matrix[i].fill(0);
    }
    for(var k=1; k<=number; k++){
    for(let i=1; i<=matrixSize; i++){
        for(let j=1; j<=matrixSize; j++){
            var position = k+","+i+","+j;
            var cb = document.getElementById(position).style.backgroundColor;
            if(cb!='white'){
                matrix[i-1][j-1]=-1;
            }
            else{
                matrix[i-1][j-1]=1;
            }
        }
    }
        window["matrix"+k] = JSON.parse(JSON.stringify(matrix));
        //deep copy
    }
    //must reshape sheesh
    for(let i=1; i<=number; i++){
        eval('var matrix = matrix'+i+';');
        let newMatrix = reshape(matrix, matrixSize);
        eval('var newMatrix'+i+'= newMatrix;');
        //window["newMatrix"+i] = JSON.parse(JSON.stringify(newMatrix));
    }
    //my new n size=100, it becomes an 100x1 matrix

    //generate weights
    let weight = new Array(matrixSize);
    let numlist = [];
    let weightsize = matrixSize*matrixSize;
    for(let i=0; i<weightsize; i++){
        weight[i]=new Array(weightsize);
        weight[i].fill(0);
        numlist.push(i);
    }
    for(let k=1; k<=number; k++){
        eval('var newMatrix = newMatrix'+k+';');
        for(let i=0; i<weightsize; i++){
            for(let j=0; j<weightsize; j++){
                let waux=0;
                for(let m=0; m<1; m++){
                    waux += newMatrix[i]*newMatrix[j];    
                }
                // Standard Hebbian normalization uses the number of neurons, N.
                waux=waux/weightsize;
                weight[i][j]=waux;
                weight[j][i]=waux;
            }
            weight[i][i]=0;
        }
        window["weight"+k] = JSON.parse(JSON.stringify(weight));
    }
    
    
 
    weight = new Array(10);
    for(let i=0; i<weightsize; i++){
        weight[i]=new Array(weightsize);
        weight[i].fill(0);
    }   
    for(var i=0;i<weightsize; i++){
        for(var j=0; j<weightsize; j++){
            for(var p=1; p<=number; p++){
                eval('weight[i][j] += weight'+p+'[i][j];')
            }
        }

    }

    // Use the noisy cues exactly as the user left them in the editor.
    let results1 = new Array(number).fill(0);
    for(let k=1; k<=number; k++){
    var mem_test = JSON.parse(JSON.stringify(editableNoisyMatrices[k-1]));
    eval('var matrix = matrix'+k+';');
    for(let i=0; i<matrixSize; i++){
        const arrayColumn = (arr, n) => arr.map(x=>x[n]);
        results1[i]=hamming_distance(arrayColumn(mem_test, i), arrayColumn(matrix,i));
    }
    var mem_work = reshape(mem_test, matrixSize);
    eval('var mem_test'+k+'= mem_test;');
    eval('var mem_work'+k+'= mem_work;');
    }


    //recall origianl memory
    //iterate through all the weights and see which one it's able to recall
    let inside = new Array(matrixSize).fill(0);
        //let s_old = mem_work;
        let n_iters =0;
        //for(var k=1; k<=number; k++){
            var whichmem=0;
            var min=Infinity;
            var newmin=0;
            //eval('var mem_work = mem_work'+k+';');
        //iterate for each matrix
        var inputmatrices=[];
        var alllyapunov=[];
        var animationFrameRanges=[];
        var recallSummaries=[];
        for(var p=1; p<=number; p++){
        eval('var newMatrix = newMatrix'+p+';');
        eval('var matrix = matrix'+p+';');
        eval('var noisyMatrix = mem_test'+p+';');
        eval('var mem_work = mem_work'+p+';');
        var frameStart = inputmatrices.length;
        var s = mem_work.slice();
        var E_temp=[];
        var firstEnergy = networkEnergy(s, weight);
        E_temp.push(firstEnergy);
        alllyapunov.push(firstEnergy);
        inputmatrices.push(s.slice());

        // Update neurons asynchronously until a complete sweep makes no changes.
        // A cap prevents pathological inputs from producing an endless animation.
        var stable = false;
        var sweep = 0;
        var maxSweeps = 20;
        while(!stable && sweep < maxSweeps){
            var updateOrder = shuffledIndices(weightsize);
            var changes = 0;
            for(var iter=0; iter<updateOrder.length; iter++){
                var neuron = updateOrder[iter];
                var activation = 0;
                var oldState = s[neuron];
                for(let j=0; j<weightsize; j++){
                    activation += weight[neuron][j]*s[j];
                }
                var newState = activation > 0 ? 1 : (activation < 0 ? -1 : oldState);
                if(newState !== oldState) changes++;
                s[neuron] = newState;
                inputmatrices.push(s.slice());
                var energy = networkEnergy(s, weight);
                E_temp.push(energy);
                alllyapunov.push(energy);
            }
            stable = changes === 0;
            sweep++;
        }
        animationFrameRanges.push({
            start: frameStart,
            end: inputmatrices.length,
            converged: stable,
            sweeps: sweep
        });
        const arrayColumn = (arr, n) => arr.map(x=>x[n]);
        var distance = hamming_distance(s, newMatrix);
        if(distance<min){
            min=distance;
            whichmem=p;
        }
        let m=0;
        let matrixback = new Array(matrixSize);
        for(let i=0; i<matrixSize; i++){
            matrixback[i]=new Array(matrixSize).fill(0);
        }
        for(let i=0; i<matrixSize; i++){
            for(let j=0; j<matrixSize; j++){
                matrixback[i][j]=s[m];
                m++;
            }
        }
        eval('var matrixback'+p+'= matrixback;');
        var lyapunov = E_temp;
        eval('var lyapunov'+p+' = lyapunov;');
        recallSummaries.push({
            stored: JSON.parse(JSON.stringify(matrix)),
            noisy: JSON.parse(JSON.stringify(noisyMatrix)),
            recalled: JSON.parse(JSON.stringify(matrixback)),
            energy: E_temp.slice()
        });
    }

    hopfieldAnimationData = {
        frames: inputmatrices,
        energies: alllyapunov,
        ranges: animationFrameRanges,
        summaries: recallSummaries
    };
    var selectedMemoryIndex = Number.isInteger(requestedMemoryIndex) ?
        requestedMemoryIndex : 0;
    selectedMemoryIndex = Math.max(0,
        Math.min(selectedMemoryIndex, recallSummaries.length - 1));
    sessionStorage.setItem("Matrices", JSON.stringify(inputmatrices));
    sessionStorage.setItem("lyapunov", JSON.stringify(alllyapunov));
    document.getElementById("summaryPanel").style.display = "block";
    document.getElementById("newUpdateOrder").style.display = "inline-block";
    renderRecallSummary(selectedMemoryIndex);

    var test = document.getElementById("aPlot");

    if(!test.hasChildNodes()){
    //create cells
    for(var k=0; k<=number; k++){
        var mother;
        if(k==0){
            mother=document.getElementById('aPlot');
            v=3;
        }
        else{
            mother = document.getElementById('plot'+k);
            v=1;
        }
        mother.style.visibility="visible";
        mother.style.display="block";
        for(v; v<=3; v++){
            let innerplot = document.createElement('div');
            if(v==1){
                innerplot.className = "matrix";
            }
            else if(v==2){
                innerplot.className = "noise";
            }
            else if(v==3){
                innerplot.className = "returned";
            }
            innerplot.id = k+','+v;
            mother.appendChild(innerplot);
            for(var p=1; p<=matrixSize; p++){
                let rowsize = document.createElement('div');
                rowsize.className = "plot-grid-row";
                var value = k+','+v+','+p+',plot';
                rowsize.id = value;
                rowsize.style.height = 210/matrixSize+'px';
                rowsize.style.width = matrixSize*170/matrixSize+'px';
                //console.log(rownew);
                innerplot.appendChild(rowsize);
                 //rownew.style.width = 36/matrixSize*9;
                 //rownew.style.height = 36/matrixSize*3;
                 for(var l=1; l<=matrixSize; l++){
                    const rownew = document.getElementById(k+','+v+','+p+',plot');
                        let cell = document.createElement("div");
                        cell.id = k+','+v+','+p+','+l;
                        cell.className="Pcell";
                        cell.style.minHeight=170/matrixSize+'px';
                        cell.style.minWidth=170/matrixSize+'px';
                        cell.style.Height=170/matrixSize+'px';
                        cell.style.Width=170/matrixSize+'px';
                        cell.style.backgroundColor="white";
                        cell.style.border= "1px solid black";
                        rownew.appendChild(cell);
                }
            }
        }
        if(k!=0){
        let lyapunovplot = document.createElement('div');
        lyapunovplot.style.visibility='visible';
        lyapunovplot.id='Lyplot'+k;
        lyapunovplot.className = "plots";
        lyapunovplot.style.minWidth = "522px";
        lyapunovplot.style.minHeight = "522px";
        lyapunovplot.style.borderColor = "white";
        let cellplace = document.createElement('div');
        cellplace.appendChild(lyapunovplot);
        mother.appendChild(cellplace);
        }
    } 
}
    

    //plot 

    for(let k=1; k<=number; k++){
        var range1 = matrixSize+1;
        eval('var matrix = matrix'+k+';');
        eval('var mem_test = mem_test'+k+';');
        eval('var matrixback = matrixback'+k+';');
        eval('var lyapunov = lyapunov'+k+';');
        eval('var lyapunov = lyapunov'+k+';');
        var xlyapunov = [];
        var Xaxis = lyapunov.length;
        for(var x=0; x< Xaxis; x++){
            xlyapunov.push(x);
            }
    var plotMatrix;
    for(var v=1; v<=3; v++){
        if(v==1){
            plotMatrix = matrix;
        }
        else if(v==2){
            plotMatrix = mem_test;
        }
        else if(v==3){
            plotMatrix = matrixback;
        }
        for(var p=0; p<matrixSize; p++){
            for (var l=0; l<matrixSize; l++){
                var posp = p+1;
                var posl = l+1;
                var cell = document.getElementById(k+','+v+','+posp+','+posl);
                if(plotMatrix[p][l]==-1||plotMatrix[p][l]==0){
                    cell.style.backgroundColor = 'black';
                }
                else{
                    cell.style.backgroundColor = 'white';
                }
            }
        }
    }

    
    //plot lyapunov
    xrange = xlyapunov.length;
    ysmall = lyapunov[lyapunov.length-1];
    ylarge = lyapunov[0];
    let data=[{
        x:xlyapunov,
        y:lyapunov,
        type:"scatter"
    }];
    let layout = {
        xaxis:{
            range:[0,xrange]
        },
        yaxis:{
            range:[ysmall, ylarge]
        },
        autosize: false,
        width: 500,
        height: 500,
        title:"Network energy during recall"
    };
    Plotly.newPlot('Lyplot'+k, data, layout, hopfieldPlotConfig());

    }
    document.getElementById("slide").innerText = 0;
    document.getElementById("countbox").innerText = 0;


    var animate = document.getElementById("animation").checked;
    var startAni = document.getElementById("startAni");
    startAni.style.display="flex";
    if(animate){
        var aniplot = document.getElementById("plot0");
        aniplot.style.display="flex";  
        var firstplot2 = document.getElementById("firstplot2");
        firstplot2.style.display="flex";
        firstplot2.style.borderStyle="none";
    }
    else{
        var ani = document.getElementById("plot0");
        ani.style.display="none";
    }
    initializeAnimationSequence(selectedMemoryIndex);
    for(var x=1; x<=10; x++){
        let plotnum = "plot"+x;
        let inside = document.getElementById(plotnum);
        inside.style.display = !animate && x <= number ? "flex" : "none";
    }
}

function hamming_distance(m1, m2){
    let d =0;
    var length = Math.min(m1.length, m2.length);
    for(var j=0; j<length; j++){
        if(m1[j] !== m2[j]) d++;
    }
    return d;
}

function reshape(matrix, matrixsize){

    let j = 0;
    let q = 0;
    //var reshapedinside = new Array(1).fill(0);
    var reshaped = [];
        for(let m=0; m<matrixsize*matrixsize; m++){
            reshaped.push(matrix[j][q]);
            q++;
            if(q==matrixsize){
                q=0;
                j++;
            }
        }
    return reshaped;

}

function readStoredMemories() {
    var number = Number(document.getElementById("memorynum").value);
    var matrixSize = Number(document.getElementById("matrixSize").value);
    var memories = [];

    for(var memoryIndex=1; memoryIndex<=number; memoryIndex++){
        var memory = [];
        for(var row=1; row<=matrixSize; row++){
            var values = [];
            for(var column=1; column<=matrixSize; column++){
                var cell = document.getElementById(memoryIndex+","+row+","+column);
                values.push(cell.style.backgroundColor === "white" ? 1 : -1);
            }
            memory.push(values);
        }
        memories.push(memory);
    }
    return memories;
}

function noiseDifference(memoryIndex) {
    var stored = readStoredMemories()[memoryIndex];
    var noisy = editableNoisyMatrices[memoryIndex];
    var changed = 0;
    var total = stored.length * stored.length;

    for(var row=0; row<stored.length; row++){
        for(var column=0; column<stored.length; column++){
            if(stored[row][column] !== noisy[row][column]) changed++;
        }
    }
    return {
        changed: changed,
        total: total,
        percent: Math.round(changed / total * 100)
    };
}

function updateNoiseCueLabel(memoryIndex) {
    var difference = noiseDifference(memoryIndex);
    document.getElementById("noiseCueLabel"+memoryIndex).textContent =
        "Cue " + (memoryIndex + 1) + ": " + difference.changed + " of " +
        difference.total + " cells changed (" + difference.percent + "%)";
}

function paintNoiseCell(cell, state) {
    var memoryIndex = Number(cell.dataset.memoryIndex);
    var row = Number(cell.dataset.row);
    var column = Number(cell.dataset.column);
    editableNoisyMatrices[memoryIndex][row][column] = state;
    cell.style.backgroundColor = state === -1 ? "black" : "white";
    updateNoiseCueLabel(memoryIndex);
}

function renderNoiseCueEditor() {
    var cueGrid = document.getElementById("noiseCueGrid");
    cueGrid.innerHTML = "";

    editableNoisyMatrices.forEach(function(matrix, memoryIndex) {
        var card = document.createElement("div");
        card.className = "noise-cue-card";

        var label = document.createElement("strong");
        label.className = "noise-cue-label";
        label.id = "noiseCueLabel" + memoryIndex;
        card.appendChild(label);

        var grid = document.createElement("div");
        grid.className = "noise-cue-matrix";
        grid.style.gridTemplateColumns = "repeat(" + matrix.length + ", 1fr)";
        grid.setAttribute("aria-label", "Editable noisy cue " + (memoryIndex + 1));

        matrix.forEach(function(rowValues, row) {
            rowValues.forEach(function(state, column) {
                var cell = document.createElement("span");
                cell.className = "noise-cue-cell";
                cell.dataset.memoryIndex = memoryIndex;
                cell.dataset.row = row;
                cell.dataset.column = column;
                cell.style.backgroundColor = state === -1 ? "black" : "white";
                cell.addEventListener("mousedown", function(event) {
                    event.preventDefault();
                    var currentState = editableNoisyMatrices[memoryIndex][row][column];
                    noisePainting = currentState === -1 ? 1 : -1;
                    paintNoiseCell(cell, noisePainting);
                });
                cell.addEventListener("mouseenter", function() {
                    if(noisePainting !== null) paintNoiseCell(cell, noisePainting);
                });
                grid.appendChild(cell);
            });
        });

        card.appendChild(grid);
        cueGrid.appendChild(card);
        updateNoiseCueLabel(memoryIndex);
    });

    document.getElementById("noiseEditor").style.display = "block";
    document.getElementById("matrix").style.maxHeight = "none";
    document.getElementById("runRecall").disabled = false;
    document.getElementById("generateNoise").textContent = "Regenerate noisy cues";
}

function generateEditableNoise() {
    clearRecallResults();
    if(!memoryStructureIsCurrent()){
        clearEditableNoisyCues("Matrix settings are updating. Please try again.");
        document.getElementById("matrix").style.display = "none";
        return;
    }
    showMemoryEditingView();
    var memories = readStoredMemories();
    var noiseLevel = Math.max(0, Math.min(100,
        Number(document.getElementById("noiselevel").value)));
    var probability = noiseLevel / 100;

    editableNoisyMatrices = memories.map(function(memory) {
        return memory.map(function(row) {
            return row.map(function(state) {
                return Math.random() < probability ? -state : state;
            });
        });
    });

    document.getElementById("errormsg").innerText = "";
    renderNoiseCueEditor();
}

document.addEventListener("mouseup", function() {
    noisePainting = null;
});

function invalidateEditableNoise() {
    if(!editableNoisyMatrices) return;
    clearRecallResults();
    clearEditableNoisyCues("A stored memory changed. Generate the noisy cues again.");
}

function addMatrix(){
    clearRecallResults();
    clearEditableNoisyCues();
    generatedMemoryCount = null;
    generatedMatrixSize = null;
    /*var row1 = document.getElementById("row1");
    var row2 = document.getElementById("row2");
    for(var i=1; i<=10; i++){
        var value = "#mem"+i;
        if(i<6){
            if(row1.querySelector(value) == null) {
                var tag = document.createElement("div");
                tag.id = value;
                row1.appendChild(tag);
            }
        }
        else{
            if(row2.querySelector(value) == null) {
                var tag = document.createElement("div");
                tag.id = value;
                row1.appendChild(tag);
            }
        }
    }*/

    for(var i=1; i<=10; i++){
        var value = "mem"+i;
        var valueEl = document.getElementById(value);
        valueEl.innerHTML="";
    }
let number = document.getElementById("memorynum").value;
let matrixSize = document.getElementById("matrixSize").value;


if(number > 10 || number < 3 || matrixSize < 3 || matrixSize > 10){
    var errormsg = document.getElementById("errormsg");
    errormsg.innerText = "Use values from 3 to 10 for both settings.";
    document.getElementById("matrix").style.display = "none";
    document.getElementById("noiseadd").style.display = "none";
    document.getElementById("finish").style.display = "none";
}
else{
    var errormsg = document.getElementById("errormsg");
    errormsg.innerText = "";
var i=1;
generatedMemoryCount = Number(number);
generatedMatrixSize = Number(matrixSize);
for(i=1; i<=number; i++){
    var value = "mem"+i;
    const mem1 = document.getElementById(value);
    mem1.style.visibility="visible";
    mem1.style.display="block";
    mem1.style.padding= "10px";
    var memoryLabel = document.createElement("strong");
    memoryLabel.className = "memory-label";
    memoryLabel.textContent = "Memory " + i;
    mem1.appendChild(memoryLabel);
    for(var p=1; p<=matrixSize; p++){
        let myRow = document.createElement('div');
        myRow.className = "memory-grid-row";
        mem1.appendChild(myRow);
        myRow.id = p+','+i;
        const rowi = document.getElementById(p+','+i);
        rowi.style.width = (15 * matrixSize) + 'px';
        rowi.style.height = '15px';
        for(var l=1; l<=matrixSize; l++){
            var cell = document.createElement("div");
            var value = i+','+p+','+l;
            cell.id=value;
            cell.className="cell white";
            cell.style.backgroundColor="white";
            cell.style.border= "1px solid black";
            rowi.appendChild(cell);
        }
    }
}

   /* for(i; i<=10; i++){
        var value = "mem"+i;
        var mem = document.getElementById(value);
        mem.remove();
    }*/
    var matrix = document.getElementById("matrix");
    if(number<6){
        matrix.style.maxHeight = '250px';
    }
    else{
        matrix.style.maxHeight = '400px';
    }

var mouseIsDown = false;
var color = 'rgb(17, 157, 255)'
document.querySelectorAll('#matrix .cell')
.forEach(e => e.addEventListener("mousedown", function() {
    mouseIsDown = true}));

document.querySelectorAll('#matrix .cell')
.forEach(e => e.addEventListener("mouseup", function() {
    mouseIsDown = false}));

document.querySelectorAll('#matrix .cell')
.forEach(e=> e.addEventListener("click", function(){
    if (e.style.backgroundColor == 'white'){
        color = 'rgb(17, 157, 255)';
        e.style.backgroundColor = color;
    }
    else if(e.style.backgroundColor == 'rgb(17, 157, 255)'){
        color = 'white';
        e.style.backgroundColor = color;
    }
    invalidateEditableNoise();
}));

document.querySelectorAll('#matrix .cell')
.forEach(e => e.addEventListener("mousemove", function() {
   if(mouseIsDown){
        e.style.backgroundColor=color;
        invalidateEditableNoise();
   }
}));


    // Here, `this` refers to the element the event was hooked on



for(var p=i; p<=10; p++){
    var value = "mem"+p;
    const mem2 = document.getElementById(value);
    mem2.style.display="none";
}

const allMatrix = document.getElementById("matrix");
allMatrix.style.display = "flex";
allMatrix.style.visibility = "visible";
if(number<=5){
    var pxadd = 220*number;
    allMatrix.style.width = pxadd+'px';
}
else{
    var pxadd = 220*5;
    allMatrix.style.width = pxadd+'px';
}



const plots = document.getElementById("allPlots");
plots.style.display="none";
plots.style.visibility="visible";

let noise = document.getElementById("noiseadd");
noise.style.display="block";

let animate = document.getElementById("animate");
animate.style.display="block";

let submit = document.getElementById("finish");
submit.style.display="flex";

let startAni = document.getElementById("startAni");
startAni.style.display="none";
}
for(var i=1; i<11; i++){
    var plotnum = document.getElementById("plot"+i);
   plotnum.innerText = '';
}

var plotnum = document.getElementById("aPlot");
plotnum.innerText = '';

var lyplot = document.getElementById("LyPlot");
lyplot.innerText='';
var firstplot2 = document.getElementById("firstplot2");
firstplot2.style.display="none";

document.getElementById("slide").innerText = 0;
document.getElementById("countbox").innerText = 0;

}

function handleMatrixSettingChange() {
    clearTimeout(matrixRegenerationTimer);
    clearRecallResults();
    clearEditableNoisyCues();
    document.getElementById("matrix").style.display = "none";
    document.getElementById("errormsg").innerText = "Updating memory grids…";
    matrixRegenerationTimer = setTimeout(addMatrix, 180);
}

function handleNoiseSettingChange() {
    if(!editableNoisyMatrices && !hopfieldAnimationData) return;
    clearRecallResults();
    clearEditableNoisyCues("Noise level changed. Generate the noisy cues again.");
    showMemoryEditingView();
}

document.getElementById("matrixSize").addEventListener("input", handleMatrixSettingChange);
document.getElementById("memorynum").addEventListener("input", handleMatrixSettingChange);
document.getElementById("noiselevel").addEventListener("input", handleNoiseSettingChange);

// Display the default editable memories immediately; no separate generate step is needed.
addMatrix();

function reset(){
    location.reload();
}

function renderMiniMatrix(containerId, matrix) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    container.style.gridTemplateColumns = "repeat(" + matrix.length + ", 1fr)";
    matrix.forEach(function(row) {
        row.forEach(function(value) {
            var cell = document.createElement("span");
            cell.className = "mini-cell";
            cell.style.backgroundColor = value === -1 || value === 0 ? "black" : "white";
            container.appendChild(cell);
        });
    });
}

function matrixHammingDistance(first, second) {
    var distance = 0;
    for(var row=0; row<first.length; row++){
        for(var column=0; column<first[row].length; column++){
            if(first[row][column] !== second[row][column]) distance++;
        }
    }
    return distance;
}

function renderSimilarityTable(memoryIndex) {
    var summary = hopfieldAnimationData.summaries[memoryIndex];
    var recalled = summary.recalled;
    var total = recalled.length * recalled.length;
    var tableBody = document.getElementById("similarityBody");
    var bestDistance = Infinity;
    var bestMemories = [];
    var exactMemories = [];
    var exactInverses = [];

    tableBody.innerHTML = "";
    hopfieldAnimationData.summaries.forEach(function(candidate, index) {
        var distance = matrixHammingDistance(recalled, candidate.stored);
        var inverseDistance = total - distance;
        if(distance < bestDistance){
            bestDistance = distance;
            bestMemories = [index];
        }
        else if(distance === bestDistance){
            bestMemories.push(index);
        }
        if(distance === 0) exactMemories.push(index);
        if(inverseDistance === 0) exactInverses.push(index);

        var row = document.createElement("tr");
        row.dataset.distance = distance;
        row.innerHTML =
            "<th scope=\"row\">Memory " + (index + 1) + "</th>" +
            "<td>" + distance + " / " + total + "</td>" +
            "<td>" + inverseDistance + " / " + total + "</td>";
        tableBody.appendChild(row);
    });

    var closestRows = tableBody.querySelectorAll(
        "tr[data-distance=\"" + bestDistance + "\"]"
    );
    closestRows.forEach(function(row) {
        row.classList.add("closest-state");
    });

    function memoryList(indices) {
        return indices.map(function(index) { return index + 1; }).join(", ");
    }

    var outcome;
    var range = hopfieldAnimationData.ranges[memoryIndex];
    if(!range.converged){
        outcome = "The update limit was reached before the network became stable.";
    }
    else if(exactMemories.length){
        outcome = exactMemories.length === 1 ?
            "Exact recall of memory " + (exactMemories[0] + 1) + "." :
            "Exact recall of identical memories " + memoryList(exactMemories) + ".";
    }
    else if(exactInverses.length){
        outcome = exactInverses.length === 1 ?
            "The network reached the inverse of memory " +
                (exactInverses[0] + 1) + "." :
            "The network reached the inverse of identical memories " +
                memoryList(exactInverses) + ".";
    }
    else{
        outcome = "Stable non-memory state; closest to " +
            (bestMemories.length === 1 ? "memory " : "memories ") +
            memoryList(bestMemories) + " (" + bestDistance + " / " + total +
            " cells different).";
    }
    document.getElementById("recallOutcome").textContent = outcome;
}

function renderRecallSummary(memoryIndex) {
    if(!hopfieldAnimationData || !hopfieldAnimationData.summaries) return;
    var summary = hopfieldAnimationData.summaries[memoryIndex];
    currentSummaryMemoryIndex = memoryIndex;
    document.getElementById("summaryTitle").textContent =
        "Recall summary — memory " + (memoryIndex + 1);
    renderMiniMatrix("summaryStored", summary.stored);
    renderMiniMatrix("summaryNoisy", summary.noisy);
    renderMiniMatrix("summaryRecalled", summary.recalled);
    renderSimilarityTable(memoryIndex);

    var xValues = summary.energy.map(function(_, index) { return index; });
    Plotly.react("summaryEnergy", [{
        x: xValues,
        y: summary.energy,
        type: "scatter",
        mode: "lines",
        line: {color: "rgb(17, 157, 255)", width: 2},
        hovertemplate: "Update %{x}<br>Energy %{y:.2f}<extra></extra>"
    }], {
        autosize: true,
        height: 145,
        margin: {l: 42, r: 8, t: 8, b: 28},
        xaxis: {
            title: {text: "Updates", font: {size: 10}},
            tickfont: {size: 9},
            gridcolor: "#e3e9ec"
        },
        yaxis: {
            tickfont: {size: 9},
            gridcolor: "#e3e9ec"
        },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        showlegend: false
    }, {
        responsive: true,
        displayModeBar: false
    });
}

function rerunWithNewUpdateOrder() {
    if(!editableNoisyMatrices) return;
    hopfield(currentSummaryMemoryIndex);
}

function renderAnimationFrame(memoryIndex, localFrame) {
    var range = hopfieldAnimationData.ranges[memoryIndex];
    var frameCount = range.end - range.start;
    var frameNumber = Math.max(0, Math.min(localFrame, frameCount - 1));
    var globalFrame = range.start + frameNumber;
    var currentMatrix = hopfieldAnimationData.frames[globalFrame];
    var matrixSize = Number(document.getElementById("matrixSize").value);

    for(var row=0; row<matrixSize; row++){
        for(var column=0; column<matrixSize; column++){
            var cell = document.getElementById('0,3,'+(row+1)+','+(column+1));
            var state = currentMatrix[row * matrixSize + column];
            cell.style.backgroundColor = state === -1 || state === 0 ? 'black' : 'white';
        }
    }

    var completeEnergy = hopfieldAnimationData.energies.slice(range.start, range.end);
    var shownEnergy = hopfieldAnimationData.energies.slice(range.start, globalFrame + 1);
    var xValues = shownEnergy.map(function(_, index) { return index; });
    var minimum = Math.min.apply(null, completeEnergy);
    var maximum = Math.max.apply(null, completeEnergy);
    var padding = Math.max(1, (maximum - minimum) * 0.08);

    var data = [{
        x: xValues,
        y: shownEnergy,
        type: "scatter",
        mode: "lines",
        line: {color: "rgb(17, 157, 255)", width: 3},
        hovertemplate: "Update %{x}<br>Energy %{y:.2f}<extra></extra>"
    }];
    var layout = {
        autosize: true,
        height: 430,
        margin: {l: 70, r: 25, t: 55, b: 60},
        title: "Network energy during recall",
        xaxis: {
            title: "Asynchronous neuron updates",
            range: [0, Math.max(1, completeEnergy.length - 1)],
            gridcolor: "#dce4e8"
        },
        yaxis: {
            title: "Energy",
            range: [minimum - padding, maximum + padding],
            gridcolor: "#dce4e8"
        },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        showlegend: false
    };
    Plotly.react('LyPlot', data, layout, hopfieldPlotConfig());
}

function showNoisyCue(memoryIndex) {
    clearInterval(myInt);
    hopfieldAnimationState = {
        memoryIndex: memoryIndex,
        localFrame: 0,
        mode: "ready"
    };
    renderRecallSummary(memoryIndex);
    renderAnimationFrame(memoryIndex, 0);

    var total = hopfieldAnimationData.ranges.length;
    var animate = document.getElementById("animation").checked;
    var startButton = document.getElementById("startIt");
    document.getElementById("previousMemory").disabled = memoryIndex === 0;
    document.getElementById("nextMemory").disabled = memoryIndex === total - 1;
    document.getElementById("animationStatus").textContent = animate ?
        "Memory " + (memoryIndex + 1) + " of " + total +
            ": the noisy cue is shown. Inspect it, then start the animation." :
        "Memory " + (memoryIndex + 1) + " of " + total +
            ": the completed recall is shown in the summary above.";
    startButton.textContent = "Start animation";
    startButton.style.display = animate ? "inline-block" : "none";
}

function initializeAnimationSequence(memoryIndex) {
    if(!hopfieldAnimationData || !hopfieldAnimationData.ranges.length) return;
    showNoisyCue(memoryIndex || 0);
}

function showAdjacentMemory(direction) {
    if(!hopfieldAnimationData) return;
    var nextIndex = currentSummaryMemoryIndex + direction;
    nextIndex = Math.max(0,
        Math.min(nextIndex, hopfieldAnimationData.ranges.length - 1));
    if(nextIndex === currentSummaryMemoryIndex) return;
    showNoisyCue(nextIndex);
}

function finishCurrentAnimation() {
    clearInterval(myInt);
    hopfieldAnimationState.mode = "complete";
    var memoryIndex = hopfieldAnimationState.memoryIndex;
    var range = hopfieldAnimationData.ranges[memoryIndex];
    var total = hopfieldAnimationData.ranges.length;
    var result = range.converged ?
        "The network has reached a stable pattern." :
        "The update limit was reached before a stable pattern was found.";

    if(memoryIndex < total - 1){
        document.getElementById("animationStatus").textContent =
            "Memory " + (memoryIndex + 1) + " of " + total + ": " + result +
            " Click to show the next noisy cue.";
        document.getElementById("startIt").textContent = "Show next memory";
    }
    else{
        document.getElementById("animationStatus").textContent =
            "Memory " + total + " of " + total + ": " + result +
            " Click to restart with memory 1.";
        document.getElementById("startIt").textContent = "Restart sequence";
    }
}

function advanceAnimationFrame() {
    var range = hopfieldAnimationData.ranges[hopfieldAnimationState.memoryIndex];
    var lastFrame = range.end - range.start - 1;
    if(hopfieldAnimationState.localFrame >= lastFrame){
        finishCurrentAnimation();
        return;
    }
    hopfieldAnimationState.localFrame++;
    renderAnimationFrame(
        hopfieldAnimationState.memoryIndex,
        hopfieldAnimationState.localFrame
    );
}

function startit(){
    if(!hopfieldAnimationState) return;
    var button = document.getElementById("startIt");
    var status = document.getElementById("animationStatus");
    var total = hopfieldAnimationData.ranges.length;

    if(hopfieldAnimationState.mode === "complete"){
        var nextMemory = hopfieldAnimationState.memoryIndex + 1;
        if(nextMemory >= total) nextMemory = 0;
        showNoisyCue(nextMemory);
        return;
    }

    if(hopfieldAnimationState.mode === "playing"){
        clearInterval(myInt);
        hopfieldAnimationState.mode = "paused";
        button.textContent = "Resume animation";
        status.textContent =
            "Memory " + (hopfieldAnimationState.memoryIndex + 1) + " of " + total +
            ": recall is paused.";
        return;
    }

    hopfieldAnimationState.mode = "playing";
    button.textContent = "Pause animation";
    status.textContent =
        "Memory " + (hopfieldAnimationState.memoryIndex + 1) + " of " + total +
        ": asynchronous neuron updates are recalling a stored pattern.";
    myInt = setInterval(advanceAnimationFrame, 35);
}


    



