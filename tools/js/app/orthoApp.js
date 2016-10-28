var glob = require('./orthoGlobals')
var orthoRender = require('./orthoRender')
log=console.log

const cellSize = glob.cellSize;
var iconSelect=false;

const scaleMin=glob.scaleMin;
const scaleMax=glob.scaleMax;
var toolbarSelect=false;


var hx=0;
var hy=0;
var oldX=0;
var oldY=0;
var oldtouches=null;
var cleared=false;
var moved=false;


var moving=false;
var minDist=5.0;
var minDistHit=false;

var mousex=0;
var mousey=0;
var startPosX=0;
var startPosY=0;

function SaveState(){
    var sketch_save = JSON.stringify({book:glob.sketchBook,page:glob.sketchBookIndex});
    localStorage.setItem("glob.sketchBookDat",sketch_save);
    console.log(JSON.stringify(glob.sketchBook))
}

function TryRestoreState(){
/*

       var dict = require("../../dat/scrapbook/dictionarytemplate.json")
        glob.sketchBook=dict;
        glob.sketchBookIndex=0;
        LoadPage();
*/
    var sketch_save = localStorage.getItem("glob.sketchBookDat");
    if (sketch_save!==null){
        var dat = JSON.parse(sketch_save);
        glob.sketchBook=dat.book;
        glob.sketchBookIndex=dat.page;
        LoadPage();
    }
}

var ctx
function doStart(){
    glob.canvas = document.getElementById("mainCanvas");
    glob.ctx=glob.canvas.getContext('2d');
    ctx = glob.ctx;
    ctx.imageSmoothingEnabled = false;


function handleKeyDown(evt){
    if (evt.keyCode===13){
        //return
        newTitle();
        renderApp();
    } else if (evt.keyCode===37){
        //return
        PageLeft();
    } else if (evt.keyCode===39){
        //return
        PageRight();
    } 

}

handleStart
    document.addEventListener('keydown', handleKeyDown, false);

    glob.canvas.addEventListener("mousedown", handleStart, false);
    glob.canvas.addEventListener("mousemove", handleMove, false);
    glob.canvas.addEventListener("mouseup", handleEnd, false);

    glob.canvas.addEventListener("touchstart", handleStart, false);
    glob.canvas.addEventListener("touchend", handleEnd, false);
    glob.canvas.addEventListener("touchcancel", handleEnd, false);
    glob.canvas.addEventListener("touchleave", handleEnd, false);
    glob.canvas.addEventListener("touchmove", handleMove, false);
    TryRestoreState();

    renderApp();
}


function LoadPage(){
    if(glob.sketchBookIndex===glob.sketchBook.length){
        glob.sketchBook.push({
            elements:[],
            lines:[],
            offsetX:0,
            offsetY:0,
            scale:1,
            sketchTitle:""
        });
    }
    log(glob.page);
    glob.page=glob.sketchBook[glob.sketchBookIndex];
    log(glob.page);
    renderApp();
}
function PageLeft(){
    if (glob.sketchBookIndex===0){
        return;
    }
    if (PageEmpty()&&glob.sketchBookIndex===glob.sketchBook.length-1){
        glob.sketchBook.splice(glob.sketchBookIndex,1);
    }
    glob.sketchBookIndex--;  
    LoadPage();      
    SaveState();
}

function PageEmpty(){
    return glob.page.lines.length===0&&glob.page.elements.length===0&&glob.page.sketchTitle==="";
}
function PageRight(){
    if (PageEmpty()===false){
        glob.sketchBookIndex++;
        LoadPage();
        SaveState();
    }
}

function clearEverything(){        
    glob.sketchBook.splice(glob.sketchBookIndex,1);
    if (glob.sketchBookIndex===glob.sketchBook.length &&
        glob.sketchBookIndex>0){
        glob.sketchBookIndex--;
    }
    LoadPage();
    SaveState();
}

function iconAt(tx,ty){
    for (var i=0;i<glob.page.elements.length;i++){
        var el = glob.page.elements[i];
        if (el[0]===tx&&el[1]===ty){
            return true;
        }
    }
    return false;
}

function triggerPan(evt){
    if ("touches" in evt){
        if (evt.touches.length===2){
            return true;
        }
        return false;
    } else {
        return evt.button===2;
    }
}

function zoomCoords(evt){
    if ("touches" in evt){
         return evt.touches.length===2 ?
                [evt.touches[0].clientX,evt.touches[0].clientY,evt.touches[1].clientX,evt.touches[1].clientY] :
                [evt.touches[0].clientX,evt.touches[0].clientY,evt.touches[0].clientX,evt.touches[0].clientY];
    } else {
        return [evt.clientX,event.clientY,event.clientX,event.clientY]
    }
}

function exactlyOneDown(evt){
    if ("touches" in evt){
        return evt.touches.length===1;
    } else {
        return true;
    }
}

function noTouches(evt){
    if ("touches" in evt){
        return evt.touches.length===0;
    } else {
        return true
    }
}
function getTouch(evt){
    if ("touches" in evt){
        return evt.touches[0];
    } else {
        return evt;
    }

}

function changedTouch(evt){
    if ("touches" in evt){
        return evt.changedTouches[0];
    } else {
        return evt;
    }
}


function changedTouches(evt){
    if ("touches" in evt){
        return evt.changedTouches;
    } else {
        return [evt];
    }
}

function handleStart(evt) {
    if (iconSelect===true){
        iconSelect=false;
    }
    evt.preventDefault();

    if (triggerPan(evt)){
        moved=true;
        oldtouches=zoomCoords(evt);
    } 
   if (exactlyOneDown(evt)){

        var t= changedTouch(evt);

        var cx = t.clientX-glob.page.offsetX;
        var cy = t.clientY-glob.page.offsetY;

        if (t.clientY<cellSize+20){

            toolbarSelect=true;
            console.log("toolbarSelect = "+toolbarSelect);

            if (t.clientX<cellSize){
                //delete
                clearEverything();
            } else if (t.clientX<glob.canvas.width-2*cellSize){
                //set title
                newTitle();
            } else if (t.clientX<glob.canvas.width-cellSize){
                //move left
                PageLeft();
            } else {
                //move right
                PageRight();
            }
            renderApp();
            return;
        }
        oldtouches=zoomCoords(evt);

        var gx = Math.round(cx/(cellSize*glob.page.scale));
        var gy = Math.round(cy/(cellSize*glob.page.scale));
        mousex=t.clientX;
        mousey=t.clientY;
        var iconat = iconAt(gx,gy);
        if (!iconat){
            startPosX=mousex;
            startPosY=mousey;
            iconSelect=true;
            minDistHit=false;
        }
        oldX=gx;
        oldY=gy;           
    }

    renderApp();
}


function newTitle(){        
    var onSucess = function(){};
    var s = prompt("enter title",glob.page.sketchTitle).toUpperCase();
//    if (s.length>5){
//        s=s.substr(0,5);
//    }
    glob.page.sketchTitle=s;
    SaveState();
}
function clickCell(x,y,n){
    for (var i=0;i<glob.page.elements.length;i++){
        var e = glob.page.elements[i];
        if (e[0]===x&&e[1]===y){
            glob.page.elements.splice(i,1);
            break;
        }
    }
    glob.page.elements.push([x,y,n]);
    SaveState();
}

function tryRemoveCell(x,y){
    for (var i=0;i<glob.page.elements.length;i++){
        var e = glob.page.elements[i];
        if (e[0]===x&&e[1]===y){
            glob.page.elements.splice(i,1);
            break;
        }
    }   

    for (var i=0;i<glob.page.lines.length;i++){
        var l = glob.page.lines[i];
        var x1=l[0];
        var y1=l[1];
        var x2=l[2];
        var y2=l[3];
        if (x1===x&&y1===y){
            if (!iconAt(x2,y2)){
                glob.page.lines.splice(i,1);
                i--;
            }
        } else if (x2===x&&y2===y){
            if (!iconAt(x1,y1)){
                glob.page.lines.splice(i,1);
                i--;
            }
        }
    }
    SaveState();
}

function makeLine(x1,y1,x2,y2){
    /*if (x2>x1+1){
        x2=x1+1;
    } else if (x2<x1-1){
        x2=x1-1;
    }
    if (y2>y1+1){
        y2=y1+1;
    } else if (y2<y1-1){
        y2=y1-1;
    }*/


    var dx=x2-x1;
    var dy=y2-y1;

    var l = Math.max(Math.abs(dx),Math.abs(dy));
    dx = Math.sign(dx)*l;
    dy = Math.sign(dy)*l;
    x2=x1+dx;
    y2=y1+dy;

    if (x1<x2|| (x1===x2&&y1<y2)){
        var tx=x1;
        x1=x2;
        x2=tx;

        var ty=y1;
        y1=y2;
        y2=ty;
    }

    for (var i=0;i<glob.page.lines.length;i++){
        var l = glob.page.lines[i];
        if (l[0]===x1&&l[1]===y1&&l[2]===x2&&l[3]===y2) {
            if (l[4]===0){
                l[4]=1;
            } else {
                glob.page.lines.splice(i,1);
            }
            SaveState();
            return;
        }
    }

    glob.page.lines.push([x1,y1,x2,y2,0]);
    SaveState();
}


function handleEnd(evt){
    evt.preventDefault();
    if (cleared===true || moved===true || toolbarSelect===true){
        if (noTouches(evt)){
            cleared=false;
            moved=false;
            toolbarSelect=false;
            console.log("toolbarSelect = "+toolbarSelect);
        }
        renderApp();
        return;

    }

    if (glob.page.scale<=scaleMin){
        renderApp();
        return;
    }

    if (noTouches(evt)){
        if (iconSelect&&minDistHit){
            var t = changedTouch(evt);
            var px = t.clientX;
            var py = t.clientY;
            drawSelectionPanel(true,px,py);
            iconSelect=false;
            renderApp();
            return;
        }
    }

    var ct = changedTouches(evt)
    for (var i=0;i<ct.length;i++){

        var t= ct[i];

        var cx = t.clientX-glob.page.offsetX;
        var cy = t.clientY-glob.page.offsetY;

        var gx = Math.round(cx/(cellSize*glob.page.scale));
        var gy = Math.round(cy/(cellSize*glob.page.scale));

        if (oldX===gx && oldY===gy){
            tryRemoveCell(gx,gy);
        } else {
            makeLine(oldX,oldY,gx,gy);
        }
    }
    renderApp();
}

function handleCancel(evt) {
}

function dist(ar){
    var dx = ar[2]-ar[0];
    var dy = ar[3]-ar[1];
    return Math.sqrt(dx*dx+dy*dy);
}

function handleMove(evt) {

    evt.preventDefault();

    if (cleared===true){
        return;
    }
    if (exactlyOneDown(evt)&&glob.page.scale>scaleMin){  
        var t = getTouch(evt);          
        mousex=t.clientX;
        mousey=t.clientY;
        var d = dist([startPosX,startPosY,mousex,mousey]);
        if (iconSelect&& d>minDist){
            minDistHit=true;
        }
        renderApp();
    }

    if (triggerPan(evt)||(exactlyOneDown(evt)&&glob.page.scale<=scaleMin)){
        var curtouches = zoomCoords(evt);
                
        if (oldtouches===null){
            oldtouches=curtouches;
            return;
        }


        var oldCenterX = (oldtouches[0]+oldtouches[2])/2;
        var oldCenterY = (oldtouches[1]+oldtouches[3])/2;
        var curCenterX = (curtouches[0]+curtouches[2])/2;
        var curCenterY = (curtouches[1]+curtouches[3])/2;
        glob.page.offsetX+=(curCenterX-oldCenterX);
        glob.page.offsetY+=(curCenterY-oldCenterY);


        var oldDist = dist(oldtouches);
        var newDist = dist(curtouches);
        var scaleMultiplier = newDist/oldDist;
        var oldScale=glob.page.scale;
        if ( triggerPan(evt)){
            glob.page.scale = glob.page.scale * scaleMultiplier;
            if (glob.page.scale<scaleMin){
                glob.page.scale=scaleMin;
            } 
            if (glob.page.scale>scaleMax){
                glob.page.scale=scaleMax;
            }
            //scale around center
            var dOffsetX=glob.page.offsetX-curCenterX;
            var dOffsetY=glob.page.offsetY-curCenterY;
            glob.page.offsetX=dOffsetX*glob.page.scale/oldScale+curCenterX;
            glob.page.offsetY=dOffsetY*glob.page.scale/oldScale+curCenterY;
        }

        oldtouches=curtouches;
        renderApp();
        return;
    } else {
        oldtouches=null;
    }
    
    renderApp();
/*
    if (evt.touches.length===1 && iconSelect===false && moved===false)
    {
        for (var i =0; i<evt.changedTouches.length; i++){
            var t= evt.changedTouches[0];

            var cx = t.clientX;
            var cy = t.clientY;

            var gx = Math.round(cx/cellSize);
            var gy = Math.round(cy/cellSize);

            if (cx!=oldX||cy!=oldY){
                var x2=gx;
                var x1=oldX;
                var y2=gy;
                var y1=oldY;

                var dx=x2-x1;
                var dy=y2-y1;

                var l = Math.max(Math.abs(dx),Math.abs(dy));
                dx = Math.sign(dx)*l;
                dy = Math.sign(dy)*l;
                x2=x1+dx;
                y2=y1+dy;

                ctx.beginPath();
                ctx.moveTo(x1*cellSize+0.5,y1*cellSize+0.5);
                ctx.lineTo(x2*cellSize+0.5,y2*cellSize+0.5);
                ctx.strokeStyle="#888888"
                ctx.stroke();
            }
        }
    }*/
}


function drawSelectionPanel(select,x,y){
    ctx=glob.ctx;
    var panelRows=5;
    var panelCols=Math.ceil(glob.symbolCount/panelRows);

    var w = window.innerWidth;
    var h = window.innerHeight;

    var centerX = w/2;
    var centerY = h/2;

    var panelLeft = centerX-panelRows*cellSize/2;
    var panelRight = centerX+panelRows*cellSize/2;
    var panelTop = centerY-panelCols*cellSize/2;
    var panelBottom = centerY+panelCols*cellSize/2;
    log(panelLeft,panelTop,panelRight,panelBottom)
    panelTop+=cellSize/2;
    panelBottom+=cellSize/2;

    var ox = panelLeft;
    var oy = panelTop;

    //draw panel
    ctx.lineWidth = 1.0;   
    ctx.strokeStyle="#000000"
    ctx.fillStyle="#ffffff";

    ctx.beginPath();
    ctx.moveTo(panelLeft,panelTop);
    ctx.lineTo(panelRight,panelTop);
    ctx.lineTo(panelRight,panelBottom);
    ctx.lineTo(panelLeft,panelBottom);
    ctx.closePath();


    ctx.fill()
    ctx.stroke()


    var titleBarHeight=cellSize;
    var titleBarTop=panelTop-titleBarHeight;
    var titleBarBottom=panelTop;
    var titleBarIndent=0;
    var titleBarWidth=(panelRight-panelLeft);
    var titleBarLeft=panelLeft+titleBarIndent;
    var titleBarRight=titleBarLeft+titleBarWidth;


    
    //draw title bar
    ctx.strokeStyle="#000000"
    ctx.fillStyle="#ffffff";

    ctx.beginPath();
    ctx.moveTo(titleBarLeft,titleBarTop);
    ctx.lineTo(titleBarRight,titleBarTop);
    ctx.lineTo(titleBarRight,titleBarBottom);
    ctx.lineTo(titleBarLeft,titleBarBottom);
    ctx.closePath();


    ctx.fill()
    ctx.stroke()

    
    var dx=x-ox;
    var dy=y-oy;
    var w = panelRight-panelLeft;
    var h = panelBottom-panelTop;
    var gridx=-1;
    var gridy=-1;
    var highlightedglyphtext="";
    if (dx<0||dy<0||dx>=w||dy>=h){
        highlightedglyphicon=-1;
        //nothing
    } else {
        var xpos = Math.floor(dx/cellSize);
        var ypos = Math.floor(dy/cellSize);
        gridx=xpos;
        gridy=ypos;
        var i = xpos+ypos*panelRows;
        highlightedglyphicon=i;
        highlightedglyphtext=glob.glyphNames[i];
        if (select===true){
            clickCell(oldX,oldY,i);
        }
    }

    //draw name
    ctx.lineWidth = 0;                        
    ctx.fillStyle="#000000";
    ctx.textAlign ="center";
    ctx.font = "38px helvetica";
    ctx.fillText(highlightedglyphtext,(titleBarLeft+titleBarRight)/2,titleBarBottom-14);
    if (highlightedglyphicon>=0){
        var titleBarMid = (titleBarTop+titleBarBottom)/2;

        orthoRender.drawIcon(
            titleBarLeft+cellSize/2,titleBarMid,highlightedglyphicon);
        orthoRender.drawIcon(
            titleBarRight-cellSize/2,titleBarMid,highlightedglyphicon);
    }

    var oldscale=glob.page.scale;
    glob.page.scale=1;
    for (var i=0;i<35;i++){            
        var ix = i%panelRows;
        var iy = Math.floor(i/panelRows);
        if (ix===gridx&&iy===gridy){
            ctx.globalalpha=1.0;
        }
        var mx = ox+ix*cellSize+cellSize/2;
        var my = oy+iy*cellSize+cellSize/2;
        if (i===highlightedglyphicon){
            ctx.fillStyle="#bbbbbb";
            ctx.beginPath();
            ctx.moveTo(mx-cellSize/2,my-cellSize/2);
            ctx.lineTo(mx+cellSize/2,my-cellSize/2);
            ctx.lineTo(mx+cellSize/2,my+cellSize/2);
            ctx.lineTo(mx-cellSize/2,my+cellSize/2);
            ctx.closePath();
            ctx.fill()
        }
        orthoRender.drawIcon(mx,my,i);

    }
    glob.page.scale=oldscale;

    ctx.globalalpha=1.0;
}

function renderApp(){
    if (glob.canvas.getContext) {
        ctx.canvas.width  = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
    }

    orthoRender.render();


    {
        //window title bar
        ctx.strokeStyle="#000000";
        ctx.fillStyle="#ffffff";

        ctx.beginPath();
        ctx.moveTo(0,0);        
        ctx.lineTo(glob.canvas.width,0);
        ctx.lineTo(glob.canvas.width,20+cellSize);
        ctx.lineTo(0,20+cellSize);
        ctx.closePath();
        ctx.fill()
        ctx.stroke()

        //left button

        if (glob.sketchBook.length===1&&PageEmpty()){
        } else {
            orthoRender.drawIcon(cellSize/2,20+cellSize/2,-3);
        }

        ctx.fillStyle="#000000";
        ctx.textAlign ="center";
        ctx.font = "38px helvetica";
        ctx.fillText(glob.page.sketchTitle,(glob.canvas.width-cellSize)/2,20+cellSize-14);

        if (glob.sketchBookIndex>0){
            orthoRender.drawIcon(glob.canvas.width-3*cellSize/2,20+cellSize/2,-1);
        } 
        if (!PageEmpty()){
            if (glob.sketchBookIndex===glob.sketchBook.length-1){
                orthoRender.drawIcon(glob.canvas.width-cellSize/2,20+cellSize/2,-4);
            } else {
                orthoRender.drawIcon(glob.canvas.width-cellSize/2,20+cellSize/2,-2);
            }
        }
    }

    if (iconSelect&&minDistHit)
    {            
        drawSelectionPanel(false,mousex,mousey);
    }
    //draw top panel
}

window.onload = doStart
window.onresize = renderApp