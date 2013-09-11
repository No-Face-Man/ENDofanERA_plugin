/**
***
***  Quadtree game engine
***  FeatureProof
***  
***  No where near finished
***
**/

/* Todo:
**
**   - Changing paintbrush. 
**   - Saving to JSON? 
**   - Multiple large nodes in one canvas. 
**     - This will require a form of "World object" to be added. Should be fun. 
**   - Efficiency enhancements. Like what?
**     - Make an array of node sizes and other commonly required info so that I don't have to calculate them unnecessarily. 
**     - Store as much info as possible in the smallest way possible, lots of integers and bitwise tests. 
**     - Use seperate canvases at this point. Check to see how the canvas plugin deals with this stuff. 
**     - 
*/

"use strict";

var canvas, ctx, width, height, root, inter, effectSquare, mouse, numberOfNodes, paintType, isMouseDown;

var refreshRate = 0;

function init() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	width = 512; 
	height = 512;

	canvas.width = width;
	canvas.height = height;

	canvas.addEventListener("mousedown", onMouseDown, false);
	// canvas.addEventListener("mouseup", onMouseUp, false);
	// var inter = setInterval(function(){step();}, (1000/10));
	
	effectSquare = {
		x:0,
		y:0,
		w:32,
		h:32
	}
	
	mouse = {
		x:0,
		y:0
	}
	
	// Tracking the number of nodes in a really dumb way
	// Can't just see how many instances are active in the debugger? 
	numberOfNodes = 0;
	root = new Node(0,0,0,"Space");
	paintType = "Concrete";

	// root.saveJSON("test");
	// root.loadJSON("test");
	// root.saveJSON("test");
	
	// root.subdivide();
	root.draw();
	
	isMouseDown = false;

	// inter = setInterval(function(){step();}, (1000/refreshRate));
}

/* MOUSE CALCS 
**************************************************************************/

document.onmousemove = function(e){
	mouse = {
		x:getMousePos(canvas, e).x,
		y:getMousePos(canvas, e).y
	}
	if (isMouseDown === true) paintNode(paintType, effectSquare, root);
	// Could put numberOfNodes here...
	if (!inter) step();
}

document.onmouseup = function(){
	var e = window.event;
	if ( !e.which && e.button !== undefined ) {
		e.which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
	}
	switch (e.which) {
		case 1: isMouseDown = false;; break;
		case 2: break;
		case 3: break; 
	}
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: Math.floor(evt.clientX - rect.left),
		y: Math.floor(evt.clientY - rect.top)
	};
}

function onMouseDown() {
	var e = window.event;
	if ( !e.which && e.button !== undefined ) {
		e.which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
	}
	/*
	var mouse = {
		x:getMousePos(canvas, event).x,
		y:getMousePos(canvas, event).y
	}
	*/
	switch (e.which) {
		case 1: onMouseLeftDown(); break;
		case 2: root.saveJSON("test");
			/*
			if (!inter) {
				inter = setInterval(function(){step();}, (1000/refreshRate));
				//alert(inter);
			} else {
				clearInterval(inter);
				//alert("STUFF");
				inter = undefined;
			}
			*/ 
			return false;
			break;
		case 3: root.loadJSON("test");/*onMouseRight(mouse);*/ break; 
	}
}
/*
function onMouseUp() {
	var e = window.event;
	if ( !e.which && e.button !== undefined ) {
		e.which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
	}
	switch (e.which) {
		case 1: isMouseDown = false;; break;
		case 2: break;
		case 3: break; 
	}
}
*/
function onMouseLeftDown() {
	// var node = pointCollison(mouse, root);
	// node.subdivide();
	// console.log("Test 1:" + root.t);
	paintNode(paintType, effectSquare, root);
	isMouseDown = true;
	// root.draw();
	// ctx.stroke();
	step();
}
/*
function onMouseLeftUp() {
	isMouseDown = false;
}
*/
function onMouseRight(mouse) {
	var node = pointCollison(mouse, root);
	// node = node.parent;
	if(node) {
		// console.log(node);
		root.saveJSON("test");
		// node.clear();
	}
}

/* END MOUSE CALCS 
**************************************************************************/

/* (NODE) COLLISIONS
**************************************************************************/

// check to see if point is in rectangle
// this could be made more efficient
function pointCollison(point, node) {
	var result;
	var square = {
		x:node.x,
		y:node.y,
		wh:node._maxSize/Math.pow(2,node.d)
	}
	// If node is inside the rectangle and length === 0 then return self, otherwise apply test to children
	// dont return an undefined value...
	if (point.x >= square.x && point.x < square.x+square.wh &&
	    point.y >= square.y && point.y < square.y+square.wh) {
		if (node.n.length <= 0) {
			return node; 
		} else {
			for (var i = 0; i < node.n.length; i++) {
				result = pointCollison(point, node.n[i]);
				if (result !== undefined) return result;
			}
		}
	}
}

// checks to see if a rectangle collides with a node
function rectCollison(rect, node) {
	var nodeEdges = {
		left:node.x,
		top:node.y,
		right:node.x + node._maxSize/Math.pow(2,node.d),
		bottom:node.y + node._maxSize/Math.pow(2,node.d)
	}
	var rectEdges = {
		left:rect.x,
		top:rect.y,
		right:rect.x + rect.w,
		bottom:rect.y + rect.h
	}
	return !((nodeEdges.bottom < rectEdges.top) || (nodeEdges.right < rectEdges.left) || 
	         (nodeEdges.top > rectEdges.bottom) || (nodeEdges.left > rectEdges.right));
}

// checks to see if a circle collides with a node
// uses this method: http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
function circCollison(x, y, radius, node) {
	var nodeRect = {
		// center of node
		x:node.x+node._maxSize/Math.pow(2,node.d+1),
		y:node.y+node._maxSize/Math.pow(2,node.d+1),
		// half of width or height
		wh:node._maxSize/Math.pow(2,node.d+1)
	}
	var circleDistance = {
		x:Math.abs(x - nodeRect.x),
		y:Math.abs(y - nodeRect.y)
	}
	
	if (circleDistance.x >= (nodeRect.wh + radius)) return false; 
	if (circleDistance.y >= (nodeRect.wh + radius)) return false; 
	
	if (circleDistance.x <= nodeRect.wh) return true;
	if (circleDistance.y <= nodeRect.wh) return true;
	
	var cornerDistance_sq = Math.pow(circleDistance.x - nodeRect.wh, 2) +
	                        Math.pow(circleDistance.y - nodeRect.wh, 2);
	
	return (cornerDistance_sq <= Math.pow(radius,2));
	// return true;
}

/* END (NODE) COLLISIONS
**************************************************************************/

/* SAVING AND LOADING 
**************************************************************************/

function save() {

}

/* END SAVING AND LOADING 
**************************************************************************/

// Will paint nodes of a type when called on. 
function paintNode(type, rect, node) {
	// take the node
	// if it has a different type and it collides with the rect, subdivide
	// if (rectCollison(rect, node)){// && node.getType() !== type) {
	if (circCollison(mouse.x, mouse.y, rect.w/2, node)){
		node.subdivide();
		
		if (node.n.length <= 0) {
			// if cant subdivide, you are done: change the nodes type
			node.t = type;
		} else {
			// if it can subdivide then perform the test on the subdivided nodes
			for (var i = 0; i < node.n.length; i++) {
				paintNode(type, rect, node.n[i]);
			}
			// after all of this clean up
			node.sameType();
		}
	}
} 

function updateStencil(mouse) {
	effectSquare.x = mouse.x - effectSquare.w/2;
	effectSquare.y = mouse.y - effectSquare.h/2;
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#FF0000";
	// ctx.strokeRect(effectSquare.x,effectSquare.y,effectSquare.w,effectSquare.h);
	ctx.arc(mouse.x,mouse.y,effectSquare.w/2,0,2*Math.PI);
	ctx.stroke();
	// ctx.fillStyle = "#FF0000";
	// ctx.fillRect(effectSquare.x,effectSquare.y,effectSquare.w,effectSquare.h);
}

// Draw a randomly coloured rectangle
function randRect(x,y,width,height) {
	ctx.fillStyle="#"+(parseInt(Math.random()*4095)).toString(16);
	ctx.fillRect(x,y,width,height);
}

// Runs every step
function step() {
	// mouse = getMousePos(canvas, event); 
	root.draw();
	updateStencil(mouse);
	
	// console.log("numberOfNodes = " + numberOfNodes);
}

/**
*********************************************************************************************************
*** Node object ***
*********************************************************************************************************
**/
function Node(x, y, depth, type, parent) {
	this.n = [];
	this.x = x;
	this.y = y;
	this.d = depth;
	// I gotta improve the type data storage. 
	// Using plain strings is terribad, I need to use something like that Node.TOP_LEFT stuff or some form of enumeration
	this.t = type || undefined; 
	// this.parent = parent || null;
	
	// numberOfNodes++;
}

// Node.prototype.n = this.n;
Node.prototype._maxNodes = 4;
Node.prototype._maxDepth = 7;
Node.prototype._maxSize = 512;
Node.prototype.sizeArray = [];
// Node.prototype.parent = null;

// List of available types ***
Node.prototype._types = {
	Empty:{
		// id:0,
	},
	Space:{
		// id:1,
		opaque:false,
		colour:"#FFFFFF"
	},
	Dirt:{
		// id:2,
		opaque:true,
		colour:"#8B2500",
		randColour:20
	},
	Concrete:{
		// id:3,
		opaque:true,
		colour:"#AAAAAA"
	},
}

Node.prototype.getType = function() {
	return this._types[this.t];
}

Node.prototype.setType = function() {
	return this._types[this.t];
}

Node.TOP_LEFT = 0;
Node.TOP_RIGHT = 1;
Node.BOTTOM_LEFT = 2;
Node.BOTTOM_RIGHT = 3;

/* NODE EDITING 
**************************************************************************/

// Splits a node
Node.prototype.subdivide = function() {
	if (this.n.length > 0) {
		// throw "Error: Already subdivided";
		// return false;
	} else if (this.d >= this._maxDepth) {
		// throw "Error: Reached max depth";
		// return false;
	} else {
		var depth = this.d + 1;

		var xOffset = this.x+this._maxSize/Math.pow(2,depth);
		var yOffset = this.y+this._maxSize/Math.pow(2,depth);
		
		// Create the new nodes
		// top left
		this.n[Node.TOP_LEFT] = new Node(this.x,this.y,depth,this.t,this);
		// top right
		this.n[Node.TOP_RIGHT] = new Node(xOffset,this.y,depth,this.t,this);
		// bottom left
		this.n[Node.BOTTOM_LEFT] = new Node(this.x,yOffset,depth,this.t,this);
		// bottom right
		this.n[Node.BOTTOM_RIGHT] = new Node(xOffset,yOffset,depth,this.t,this);
		
		// Tracking the number of nodes in a really dumb way
		// console.log("numberOfNodes = " + numberOfNodes);
		
		// Setting type to undefined prevents the sameType method below merging parents
		// otherwise, if a node is dirt and is subdivided, and its siblings are dirt
		// then a single child is made concrete the children will not be subdivided 
		// BUT the parent and its siblings will. 
		this.t = "Empty";
	}
	// return true;
}

// Clears a node if its children have the same type
Node.prototype.sameType = function() { 
	if (this.n[Node.TOP_LEFT].t !== ("Empty" || undefined) && //nodes[Node.TOP_LEFT].t !== type_parent && 
	    this.n[Node.TOP_LEFT].t === this.n[Node.TOP_RIGHT].t 
	 && this.n[Node.TOP_LEFT].t === this.n[Node.BOTTOM_LEFT].t  
	 && this.n[Node.TOP_LEFT].t === this.n[Node.BOTTOM_RIGHT].t) { 
		// set the type of the node to the type of its children
		this.t = this.n[Node.TOP_LEFT].t;  
		this.clear();
		// console.log(this);
		// return true;
	}
	// return false;
	
	// THIS DUMB FUNCTION IS MERGING PARENTS FOR SOME REASON
	// fixed it, the solution is in the subdivide function. 
}

// Deletes the children of the node
Node.prototype.clear = function() { 
	// clear all children
	if (this.n.length > 0) {
		for(var i = 0; i < this.n.length; i++) {
			this.n[i].clear();
		}
		// This line prevents a minor bug that should never really occur, but just in case
		if (this.t === undefined) this.t = this.n[Node.TOP_LEFT].t;
		// console.log("Quadtree Error: Weird clear occured. ");
		// clear the child array.
		this.n.length = 0;
		
		// numberOfNodes = numberOfNodes-4;
		
		// Tracking the number of nodes in a really dumb way
		// console.log("numberOfNodes = " + numberOfNodes);
	}
}

/* END NODE EDITING 
**************************************************************************/

/* SAVING AND LOADING 
**************************************************************************/

Node.prototype.saveJSON = function(filename) {
	//var testObject = { 'one': 1, 'two': 2, 'three': 3 };

	// console.log(JSON.stringify(this));
	// console.log(this);
	localStorage.setItem(filename, JSON.stringify(this));

	var test = JSON.stringify(this);
	console.log(test.length);
}

Node.prototype.loadJSON = function(filename) {
	//try { 
		var result = JSON.parse(localStorage.getItem(filename));
		// result.__proto__ = Node.prototype;
		

		var recur = function(test) {
			test.__proto__ = Node.prototype;
			if (test.n.length > 0) {
				for (var i = 0; i < 4; i++) {
					recur(test.n[i]);
				}
			}
			// console.log(test.__proto__);
		}

		recur(result);

		this.n = result.n;
		this.x = result.x;
		this.y = result.y;
		this.d = result.d;
		// I gotta improve the type data storage. 
		// Using plain strings is terribad, I need to use something like that Node.TOP_LEFT stuff or some form of enumeration
		this.t = result.t || undefined; 
		// this.parent = result.parent;// || undefined;
	//} catch(e) {
		//console.log("There was an Error: " + e.message);
	//}
}

/* END SAVING AND LOADING 
**************************************************************************/

// Draws the specified node or its children
// Only draw when updated?
/*
Node.prototype.draw = function() {
	// ctx.clearRect(0,0,width,height);
	this.drawRecursive();
	// ctx.stroke();
}
*/
Node.prototype.draw = function() {
	//randRect(this.x,this.y,this._maxSize/Math.pow(2,this.d-1),this._maxSize/Math.pow(2,this.d-1))
	// ctx.beginPath();
	// draw all children
	if (this.n.length > 0){
		for(var i = 0; i < this._maxNodes; i++) {
			this.n[i].draw();
		}
	} else {// if (this.getType() !== undefined){ // <<== WTF, WHY IS IT UNDEFINED???? Hopefully not a problem anymore....
		
		var wh = this._maxSize/Math.pow(2,this.d);
		
		if (this.getType().opaque === false) {
			ctx.clearRect(this.x,this.y,wh,wh);
		} else {
			// ctx.beginPath();
			ctx.fillStyle=this.getType().colour;
			ctx.fillRect(this.x,this.y,wh,wh);
			// ctx.rect(this.x,this.y,this._maxSize/Math.pow(2,this.d),this._maxSize/Math.pow(2,this.d));
			// ctx.fill(); <-- I need to use begin path to prevent probs when I manually stroke etc...
			
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#" + (parseInt(this.getType().colour.slice(1), 16) - parseInt(402000, 16)).toString(16);
			ctx.strokeRect(this.x+0.5,this.y+0.5,wh,wh);
			/*
			ctx.moveTo(this.x+0.5, this.y+wh+0.5);
			ctx.lineTo(this.x+0.5, this.y+0.5);
			ctx.lineTo(this.x+wh+0.5, this.y+0.5);
			ctx.stroke();
			*/
		}
	}
}

Node.prototype.toString = function() {
  var ret = "[Node x=" + this.x + ", y=" + this.y + ", depth=" + this.d + ", arrayLength=" + this.n.length + "]";
  return ret;
}




/*
// This function creates a closure and puts a mousedown handler on the element specified in the "button" parameter.
function makeButtonIncrement(button, action, target, initialDelay, multiplier){
	var holdTimer, changeValue, timerIsRunning = false, delay = initialDelay;
	changeValue = function(){
		if(action == "add" && target.value < 1000)
			target.value++;
		else if(action == "subtract" && target.value > 0)
			target.value--;
		holdTimer = setTimeout(changeValue, delay);
		if(delay > 20) delay = delay * multiplier;
		if(!timerIsRunning){
			// When the function is first called, it puts an onmouseup handler on the whole document 
			// that stops the process when the mouse is released. This is important if the user moves
			// the cursor off of the button.
			document.onmouseup = function(){
				clearTimeout(holdTimer);
				document.onmouseup = null;
				timerIsRunning = false;
				delay = initialDelay;
			}
			timerIsRunning = true;
		}
	}
	button.onmousedown = changeValue;
}

//should only be called after the window/DOM has been loaded
window.onload = function() {
	makeButtonIncrement(document.getElementById('btnUP'), "add", document.getElementById('amount'), 500, 0.7);
	makeButtonIncrement(document.getElementById('btnDOWN'), "subtract", document.getElementById('amount'), 500, 0.7);
}
*/