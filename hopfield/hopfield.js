const { min, derivative, dotDivide, all, identity, ConditionalNodeDependencies, row } = require("mathjs");
const { selectPoints } = require("plotly.js/lib/bar");
var matrice=[];


function hopfield(){
    inputmatrices=[];
    $(".grid").remove();
    

    
    const plot = document.getElementById("allPlots");
    plot.style.display="grid";
    document.querySelectorAll(".plots").forEach(a=>a.style.visibility="visible");

    const tohide = document.getElementById("matrix");
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
                waux=waux/number;
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

    //add noise
    var noiseLevel = document.getElementById("noiselevel").value;
    var p_val = noiseLevel/100;
    let results1 = new Array(number).fill(0);
    for(let k=1; k<=number; k++){
    eval('var mem_test = JSON.parse(JSON.stringify(matrix'+k+'));');
    eval('var matrix = matrix'+k+';');
    var countReplacements=0;
    for(let i=0; i<matrixSize; i++){
        for(let j=0; j<matrixSize; j++){
            if(Math.random()<p_val){
                mem_test[j][i]=-mem_test[j][i];
                countReplacements++;
            }
            else{
                mem_test[j][i]=mem_test[j][i];
            }
        }
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
        const newnumlist = JSON.parse(JSON.stringify(numlist));
        var inputmatrices=[];
        var alllyapunov=[];
        for(var p=1; p<=number; p++){
        numlist = JSON.parse(JSON.stringify(newnumlist));
        eval('var newMatrix = newMatrix'+p+';');
        eval('var matrix = matrix'+p+';');
        //eval('weight = weight'+p+';');
        eval('var mem_work = mem_work'+p+';');
        const mem_work_start = JSON.parse(JSON.stringify(mem_work));
        let s = mem_work;
        let s_old = s;
        let go=true;
        var t=0;
        E_temp=[];
        var counterfornow=0;
        for(var q=0; q<weightsize; q++){
            for(var w=0; w<weightsize; w++){
                counterfornow+= -1/2*weight[q][w]*s[q]*s[w];
            }         
        }
        E_temp.push(counterfornow);
        alllyapunov.push(counterfornow);
        inputmatrices.push(mem_work_start);
        variable=1;
        while(go){
            for(var iter=weightsize; iter>0; iter--){
                var value = Math.floor(Math.random()*iter);
                var i=numlist[value];
                numlist.splice(value, 1);
                let waux=0;
                var olds = s[i];
                for(let j=0; j<weightsize; j++){
                    waux = waux+weight[i][j]*s[j];
                }
                s[i]=waux;
                if(s[i]>0){
                    s[i]=1;
                }
                else if(s[i]<1){
                    s[i]=-1;
                }
                //if(variable==1){
                    eval('var cloneS'+i+'= JSON.parse(JSON.stringify(s));');
                    eval('inputmatrices.push(cloneS'+i+');');
                //}
                counterfornow=0;
                for(var q=0; q<weightsize; q++){
                    for(var w=0; w<weightsize; w++){
                        counterfornow+= -1/2*weight[q][w]*s[q]*s[w];
                    }
                }
                E_temp.push(counterfornow);
                //if(variable==1){
                    alllyapunov.push(counterfornow);
                //}
            }
            
            mem_work = JSON.parse(JSON.stringify(s));
            var count=0;
            for(let i=0; i<weightsize; i++){
                if(s_old[i]==s[i]){
                    count++;
                }
                else{
                    break;
                }
            }
            if(count==weightsize){
                if(variable==1){
                    variable++;
                    numlist = JSON.parse(JSON.stringify(newnumlist))
                }
                else{
                    go=false;
                    numlist = JSON.parse(JSON.stringify(newnumlist))
                }
            }
            s_old=s;
            console.log(alllyapunov.length);
        }
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
    }

    sessionStorage.setItem("Matrices", inputmatrices);
    sessionStorage.setItem("lyapunov", alllyapunov);

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
            let innerplot = document.createElement('td');
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
                let rowsize = document.createElement('tr');
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
                        let cell = document.createElement("td");
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
        let cellplace = document.createElement('td');
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
        title:"Lyapunouv function"
    };
    Plotly.newPlot('Lyplot'+k, data, layout);

    }
    document.getElementById("slide").innerText = 0;
    document.getElementById("countbox").innerText = 0;


    var animate = document.getElementById("animation").checked;
    if(animate){
        var startAni = document.getElementById("startAni");
        var aniplot = document.getElementById("plot0");
        startAni.style.display="flex";
        aniplot.style.display="flex";  
        var firstplot2 = document.getElementById("firstplot2");
        firstplot2.style.display="flex";
        firstplot2.style.borderStyle="none";
        
        contAnimate();  
    }
    else{
        var ani = document.getElementById("plot0");
        ani.style.display="none";
    }
    var x=number;
    for(x; x<=10; x++){
        let plotnum = "plot"+x;
        let inside = document.getElementById(plotnum);
        inside.style.display="none";
    }
    let plotnum = "plot"+number;
    let inner = document.getElementById(plotnum);
    inner.style.display="flex";
}

function hamming_distance(m1, m2){
    let inside = new Array(1).fill(0);
    let d =0;
        for(var j=0; j<10; j++){
            if(m1[j]==-1){
                m1[j]=0;
            }
            if(m2[j]==-1){
                m2[j]=0;
            }
            let absvalue = parseInt(m1[j])-parseInt(m2[j]);
            d+=Math.abs(absvalue);
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

function addMatrix(){
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
    errormsg.innerText = "Input correct values!";
}
else{
    var errormsg = document.getElementById("errormsg");
    errormsg.innerText = "";
var i=1;
for(i=1; i<=number; i++){
    var value = "mem"+i;
    const mem1 = document.getElementById(value);
    mem1.style.visibility="visible";
    mem1.style.display="block";
    mem1.style.padding= "10px";
    //mem1.style.border= "1px solid black";
    var tag = document.createElement("tr");
    var value = 60*matrixSize;
    //mem1.style.width=value+'px';
    //mem1.style.heigth = value+'px';
    for(var p=1; p<=matrixSize; p++){
      /*  var middletag = document.createElement("tr");
        middletag.style.border="1px solid black";
        mem1.appendChild(middletag);*/
        let myRow = document.createElement('tr');
        mem1.appendChild(myRow);
        myRow.id = p+','+i;
        const rowi = document.getElementById(p+','+i);
        rowi.style.width = 36/matrixSize*9;
        rowi.style.height = 36/matrixSize*3
        for(var l=1; l<=matrixSize; l++){
            var cell = document.createElement("td");
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
document.querySelectorAll('#matrix td')
.forEach(e => e.addEventListener("mousedown", function() {
    mouseIsDown = true}));

document.querySelectorAll('#matrix td')
.forEach(e => e.addEventListener("mouseup", function() {
    mouseIsDown = false}));

document.querySelectorAll('#matrix td')
.forEach(e=> e.addEventListener("click", function(){
    if (e.style.backgroundColor == 'white'){
        color = 'rgb(17, 157, 255)';
        e.style.backgroundColor = color;
    }
    else if(e.style.backgroundColor == 'rgb(17, 157, 255)'){
        color = 'white';
        e.style.backgroundColor = color;
    }


}));

document.querySelectorAll('#matrix td')
.forEach(e => e.addEventListener("mousemove", function() {
   if(mouseIsDown){
        e.style.backgroundColor=color
   }
}));


    // Here, `this` refers to the element the event was hooked on



for(var p=i; p<=10; p++){
    var value = "mem"+p;
    const mem2 = document.getElementById(value);
    mem2.style.display="none";
}

const allMatrix = document.getElementById("matrix");
if(number<=5){
    var pxadd = 220*number;
    allMatrix.style.width = pxadd+'px';
}
else{
    var pxadd = 220*5;
    allMatrix.style.width = pxadd+'px';
}



const plots = document.getElementById("allPlots");
plots.style.visibility="hidden";

let noise = document.getElementById("noiseadd");
noise.style.display="block";

let animate = document.getElementById("animate");
animate.style.display="block";

let submit = document.getElementById("finish");
submit.style.display="block";

let iteration = document.getElementById("slide");
iteration.style.display="block";

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

function reset(){
    location.reload();
}

function animation(currentmatrix, count, lyapunov){
    let countBox = document.getElementById("countbox");
    const matrixSize = parseFloat(document.getElementById("matrixSize").value);
    let m=0;
    var xlyapunov = [];
    var ylyapunov=[];
    var start;
    count= parseFloat(count);
    var num = JSON.parse(JSON.stringify(count));
    if((count)%(2*matrixSize*matrixSize+1)==0){
        start=count;
        sessionStorage.setItem("start", start);
    }
    start=sessionStorage.getItem("start");
    if(start==null){
        start=0;
    }
    var ysmall = lyapunov[count];
    var ylarge = lyapunov[start];

    var p=0;
    for(var i=start; i<=count; i++){
        ylyapunov.push(lyapunov[i]);
        xlyapunov.push(p);
        p++;
    }

    let matrixback = new Array(matrixSize);
    for(let i=0; i<matrixSize; i++){
        matrixback[i]=new Array(matrixSize).fill(0);
    }

    for(let i=0; i<matrixSize; i++){
        for(let j=0; j<matrixSize; j++){
            matrixback[i][j]=currentmatrix[m];
            m++;
        }
    }


for(var p=0; p<matrixSize; p++){
    for (var l=0; l<matrixSize; l++){
        var posp = p+1;
        var posl = l+1;
        if(matrixback[p][l]==-1|| matrixback[p][l]==0){

            var cell = document.getElementById('0,3,'+posp+','+posl);
            cell.style.backgroundColor = 'black';
        }
        else{
            var cell = document.getElementById('0,3,'+posp+','+posl);
            cell.style.backgroundColor = 'white';

        }
    }
  }

        let data1 = [{
            x: xlyapunov,
            y: ylyapunov,
            type: "scatter",
        }];
        let layout1 = {
            xaxis:{
                range: [0, 2*matrixSize*matrixSize]
            },
            yaxis: {
                range: [ysmall, ylarge]
            },
            autosize: false,
            width: 500,
            height: 500,
            title:"Lyapunov Animation"
        };
    
        let config1 = {
            responsive:true,
        };
    
        Plotly.newPlot('LyPlot', data1, layout1);
}

function contAnimate(){
    var newone=true;
    const matrixSize = parseFloat(document.getElementById("matrixSize").value);
    const memnum = parseFloat(document.getElementById("memorynum").value);
    const doublethat = matrixSize*matrixSize;
    let countEl = document.getElementById("slide");
    let countBox = document.getElementById("countbox");
    let matrixnum = parseFloat(countBox.innerText);
    let animateCount =countEl.innerText;
    if(animateCount>memnum*(2*matrixSize*matrixSize+1)){
        animateCount=0;
        matrixnum=0;
        countBox.innerText = matrixnum;
        sessionStorage.setItem("start", 0);
    }

    var allmatrices = sessionStorage.getItem("Matrices");
    var alllyapunov = sessionStorage.getItem("lyapunov");
    var lyapunov = JSON.parse("[" + alllyapunov + "]");
    var matrices = JSON.parse("[" + allmatrices + "]");
    var start=animateCount*doublethat;
    var end = start + doublethat;
    var inputmatrices=[];
    for(var i=start; i<end; i++){
        inputmatrices.push(matrices[i]);
    }
    animation(inputmatrices, animateCount, lyapunov);
    animateCount++;
    countEl.innerText = animateCount;
    let statement = document.getElementById("startIt");
    if((animateCount)%(2*matrixSize*matrixSize+1)==0 /*|| animateCount == document.getElementById("memorynum").value*doublethat*/){
        clearInterval(myInt);
        matrixnum++;
        countBox.innerText = matrixnum;
        statement.innerText = "Start Animation";
    }


}

function startit(){
    let statement = document.getElementById("startIt");
    const matrixSize = document.getElementById("matrixSize").value;
    if(statement.innerText.toString()=="Start Animation"){
        statement.innerText = "Pause Animation";
        myInt = setInterval(function(){ document.getElementById("animateBtn").click(); }, (10-matrixSize)*30);
    }
    else{
        statement.innerText = "Start Animation";
        clearInterval(myInt);
    }
   
}


    



