(function(){
var canvas_width = 400,
	canvas_height = 400,
	controlbox_width = 400,
	controlbox_height = 400,
	controlbox_margin = {top:30,bottom:10,left:10,right:10},
	cartoon_x = 4 * controlbox_width / 5,
	cartoon_y =  controlbox_height / 3,
	cartoon_height = 100,
	radio_x = controlbox_width - 20,
	radio_y =  controlbox_height / 2,
	radiobox_height = 150,
	slider_width = 180;
	handleSize = 6, 
	trackSize = 4,
	bs = 25, 
	ibs = 15;


// fixed parameters
	
var lw_min = 0.5, // minimal linewidth
	N = 8, // depth of iterations
	presets = [ // parameter presets invoked by radiobuttons
		{r1:0.37,r2:0.89,r3:0.39,theta1:-16,theta2:3,theta3:18.34,sigma:0,eta:0,lw_max:lw_min},
		{r1:0.72,r2:0.82,r3:0.69,theta1:-26.25,theta2:-0.83,theta3:33.75,sigma:0.77,eta:0.10,lw_max:12.66},
		{r1:0.4,r2:0.73,r3:0.32,theta1:-23,theta2:4,theta3:43,sigma:0.77,eta:0.13,lw_max:0.5},
		{r1:0.73,r2:0.15,r3:0.8,theta1:-20,theta2:0,theta3:33,sigma:0.42,eta:0.5,lw_max:9},
		{r1:0.51,r2:0.9,r3:0.46,theta1:-29.1,theta2:-0.60,theta3:34,sigma:0.42,eta:0.0,lw_max:16}
	]

// slider parameters r1,r2,r3 branch lengths, theta1-3 angles, sigma noise strength on angles, eta noise strength on lengths, lw_max upper bound on linewidth

var r3 = {id:"r1", name:"length: left branch",range:[0,.95],value:0.39},
	r2 = {id:"r2", name:"length: central branch",range:[0,.95],value:0.89},
	r1 = {id:"r3", name:"length: right branch",range:[0,.95],value:0.37},
	theta3 = {id:"theta1", name:"angle: left branch",range:[0,50],value:18.34},
	theta2 = {id:"theta2", name:"angle: central branch",range:[-20,20],value:3},
	theta1 = {id:"theta3", name:"angle: right branch",range:[0,-50],value:-16},
	sigma =	{id:"sigma",name:"noise: angle",variable:"sigma",range:[0,1],value:0.0},
	eta = 	{id:"eta",name:"noise: length",variable:"eta",range:[0,.5],value:0.0},
	lw_max = {id:"lw_max",name:"thickness scale",range:[lw_min,30],value:lw_min};

// radio button choices
	
var c1 = {id:"c1", name:"Systems", choices: ["Weed","Tree","Phragmites","Tim Burton Tree","Fir"], value:0}

// two little buttons for new noise realizations

var b1 = { id:"b1", name:"", actions: ["reload"], value: 0};
var b2 = { id:"b2", name:"", actions: ["reload"], value: 0};

// scales used for drawing

var X = d3.scaleLinear().range([10,canvas_width-10]);
var Y = d3.scaleLinear().range([canvas_height,10]);
var	thickness = d3.scaleLinear().range([Math.log(lw_max.value),Math.log(lw_min)]).domain([0,N]);

// 	slider block: 4 groups of 3,3,2,1 elements with gap = 10

var sbl = new widget.block([3,3,2,1],controlbox_height-controlbox_margin.top-controlbox_margin.bottom,10,"[]");

////////////// widgets ///////////////

var handleSize = 8, trackSize = 5;

var sliders = [
		new widget.slider(r1).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(r2).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(r3).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(theta1).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(theta2).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(theta3).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(sigma).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(eta).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas),
		new widget.slider(lw_max).width(slider_width).trackSize(trackSize).handleSize(handleSize).update(updatecanvas)
]

var radios = [
	new widget.radio(c1).shape("rect").size(radiobox_height).update(selectsystem).label("left")
]

var buttons = [
	new widget.button(b1).shape("round").size(bs).symbolSize(ibs).update(anglenoise),
	new widget.button(b2).shape("round").size(bs).symbolSize(ibs).update(lengthnoise)
]


///////////// drawing stuff ///////////////

// canvas for the fractal

var canvas = d3.select("#weeds_trees_display").append("canvas")
		.attr("id", "canvas")
		.attr("width", canvas_width)
		.attr("height", canvas_height)
		.attr("class","explorable_display")

var context = canvas.node().getContext("2d");	

// svg for the widgets 
var controls = d3.selectAll("#weeds_trees_controls").append("svg")
	.attr("width",controlbox_width)
	.attr("height",controlbox_height)
		.attr("class","explorable_controls")

var slider = controls.append("g").attr("id","sliders")
	.attr("transform","translate("+controlbox_margin.left+","+ controlbox_margin.top +")")

var radio = controls.append("g").attr("id","radio")
	.attr("transform","translate("+radio_x+","+ radio_y +")")

var	cartoon = controls.append("g").attr("id","cartoon")
	.attr("transform","translate("+cartoon_x+","+cartoon_y+")")


slider.selectAll(".slider").data(sliders).enter().append(widget.sliderElement)
	.attr("transform",function(d,i){return "translate(0,"+sbl.x(i)+")"});

slider.selectAll(".button").data(buttons).enter().append(widget.buttonElement)	
		.attr("transform",function(d,i){return "translate("+(slider_width+20)+","+sbl.x(i==0 ? 6 : 7)+")"});

radio.selectAll(".radio").data(radios).enter().append(widget.radioElement)

cartoon.append("line").attr("class","stamm")
		.attr("x1",0).attr("y1",0)
		.attr("x2",0).attr("y2",- cartoon_height / 2)
			
cartoon.selectAll(".branch").data([[r3,theta3],[r2,theta2],[r1,theta1]]).enter()
		.append("line").attr("class","branch")
		.attr("x1",0)
		.attr("x2",function(d){return - cartoon_height / 2 * d[0].value * Math.sin(d[1].value/180*Math.PI)})
		.attr("y1", - cartoon_height / 2)
		.attr("y2",function(d){return  - cartoon_height / 2 - cartoon_height / 2 * d[0].value * Math.cos(d[1].value/180*Math.PI)})


/// computing stuff

var origin = {depth:0, x:0, y:0, l:1, dx:0, dy:0, parent:[]};
var node   = {depth:0, x:0, y:1, l:1, dx:0, dy:1, children:[], parent:origin};
var links = [];

// makes the tree
node = maketree(node,N);

// and the links
makelinks(node,links);

// drawing it
create();

// adding nodes to the angles

function update_angle_noise(node){
	if (node.children.length != 0) {
		node.sigma1theta = 2*(Math.random()-0.5);
		node.sigma2theta = 2*(Math.random()-0.5);
		node.sigma3theta = 2*(Math.random()-0.5);
		node.children.forEach(function(d){update_angle_noise(d,N)});
	}
	return node;	
}

// adding noise to the length

function update_length_noise(node){
	if (node.children.length != 0) {
		node.sigma1r = 2*(Math.random()-0.5);
		node.sigma2r = 2*(Math.random()-0.5);
		node.sigma3r = 2*(Math.random()-0.5);
		node.children.forEach(function(d){update_length_noise(d,N)});
	}
	return node;	
}


// this makes the tree recursively using the slider parameter values

function maketree(node,N){
		if (node.depth < N) {
			var t = node.depth + 1;
			
			node.sigma1theta = 2*(Math.random()-0.5);
			node.sigma2theta = 2*(Math.random()-0.5);
			node.sigma3theta = 2*(Math.random()-0.5);
			node.sigma1r = 2*(Math.random()-0.5);
			node.sigma2r = 2*(Math.random()-0.5);
			node.sigma3r = 2*(Math.random()-0.5);
		
			var R1 = r1.value*(1+eta.value*node.sigma1r);
			var R2 = r2.value*(1+eta.value*node.sigma2r);
			var R3 = r3.value*(1+eta.value*node.sigma3r);
			var TH1 = theta1.value*(1+sigma.value*node.sigma1theta);
			var TH2 = theta2.value*(1+sigma.value*node.sigma2theta);
			var TH3 = theta3.value*(1+sigma.value*node.sigma3theta);
		
			var dx1=(R1*Math.cos(TH1/180*Math.PI)*node.dx-R1*Math.sin(TH1/180*Math.PI)*node.dy);
			var dy1=(R1*Math.sin(TH1/180*Math.PI)*node.dx+R1*Math.cos(TH1/180*Math.PI)*node.dy);
			var dx2=(R2*Math.cos(TH2/180*Math.PI)*node.dx-R2*Math.sin(TH2/180*Math.PI)*node.dy);
			var dy2=(R2*Math.sin(TH2/180*Math.PI)*node.dx+R2*Math.cos(TH2/180*Math.PI)*node.dy);
			var dx3=(R3*Math.cos(TH3/180*Math.PI)*node.dx-R3*Math.sin(TH3/180*Math.PI)*node.dy);
			var dy3=(R3*Math.sin(TH3/180*Math.PI)*node.dx+R3*Math.cos(TH3/180*Math.PI)*node.dy);
			
			node.children=[];
			
			node.children.push({depth:t, dx:dx1, dy:dy1, x:node.x+dx1, y:node.y+dy1, l:node.l*R1, children:[], parent:node});
			node.children.push({depth:t, dx:dx2, dy:dy2, x:node.x+dx2, y:node.y+dy2, l:node.l*R2, children:[], parent:node});
			node.children.push({depth:t, dx:dx3, dy:dy3, x:node.x+dx3, y:node.y+dy3, l:node.l*R3, children:[], parent:node});
			node.children.forEach(function(d){maketree(d,N)});
		}
		return node
}

// this updates the tree with new values of the parameters

function updatetree(node){
	if (node.children.length != 0) {
		R1 = r1.value*(1+eta.value*node.sigma1r);
		R2 = r2.value*(1+eta.value*node.sigma2r);
		R3 = r3.value*(1+eta.value*node.sigma3r);
		TH1 = theta1.value*(1+sigma.value*node.sigma1theta);
		TH2 = theta2.value*(1+sigma.value*node.sigma2theta);
		TH3 = theta3.value*(1+sigma.value*node.sigma3theta);
		
		dx1=(R1*Math.cos(TH1/180*Math.PI)*node.dx-R1*Math.sin(TH1/180*Math.PI)*node.dy);
		dy1=(R1*Math.sin(TH1/180*Math.PI)*node.dx+R1*Math.cos(TH1/180*Math.PI)*node.dy);
		dx2=(R2*Math.cos(TH2/180*Math.PI)*node.dx-R2*Math.sin(TH2/180*Math.PI)*node.dy);
		dy2=(R2*Math.sin(TH2/180*Math.PI)*node.dx+R2*Math.cos(TH2/180*Math.PI)*node.dy);
		dx3=(R3*Math.cos(TH3/180*Math.PI)*node.dx-R3*Math.sin(TH3/180*Math.PI)*node.dy);
		dy3=(R3*Math.sin(TH3/180*Math.PI)*node.dx+R3*Math.cos(TH3/180*Math.PI)*node.dy);
		node.children[0].dx=dx1;
		node.children[0].dy=dy1;
		node.children[0].x=node.x+dx1;
		node.children[0].y=node.y+dy1;
		node.children[0].l=node.l*r1;
		node.children[1].dx=dx2;
		node.children[1].dy=dy2;
		node.children[1].x=node.x+dx2;
		node.children[1].y=node.y+dy2;
		node.children[1].l=node.l*r2;
		node.children[2].dx=dx3;
		node.children[2].dy=dy3;
		node.children[2].x=node.x+dx3;
		node.children[2].y=node.y+dy3;
		node.children[2].l=node.l*r3;
			
		node.children.forEach(function(d){updatetree(d)});
	} 
}

// making the links

function makelinks(node,links){
	if(node.parent != null){ links.push([node,node.parent]) }
	if(node.children.length>0){ node.children.forEach(function(d){makelinks(d,links)})}
}

// this just scales the tree to the canvas

function scaletocanvas(){
	var xr = [], yr=[];
	xr[0]=d3.min(links,function(d){return d[0].x < d[1].x ? d[0].x : d[1].x});
	xr[1]=d3.max(links,function(d){return d[0].x > d[1].x ? d[0].x : d[1].x});
	yr[0]=d3.min(links,function(d){return d[0].y < d[1].y ? d[0].y : d[1].y});
	yr[1]=d3.max(links,function(d){return d[0].y > d[1].y ? d[0].y : d[1].y});

	thickness.range([Math.log(lw_max.value),Math.log(lw_min)])
	var lx=xr[1]-xr[0];
	var ly=yr[1]-yr[0];
	if (ly>lx){
		Y.domain(yr);		
		X.domain([xr[0]/lx*ly,xr[1]/lx*ly]);
	} else {
		Y.domain([yr[0]/ly*lx,yr[1]/ly*lx]);
		X.domain(xr);		
	}
	
}

// this is the central drawing function

function create(){
	scaletocanvas();
	context.fillStyle = "rgb(230,230,230)";
	context.fillRect(0,0,canvas_width-1,canvas_height-1)	
	links.forEach(function(d){
		context.beginPath();
		context.moveTo(X(d[0].x), Y(d[0].y));
		context.lineTo(X(d[1].x), Y(d[1].y));
		context.lineWidth = Math.exp(thickness(d[0].depth));
		context.lineCap = "round"
		context.strokeStyle = "black";
		context.stroke();
	})
}

// this is invoked by slider movements selecting systems

function updatecanvas(){
	var p = [[r3,theta3],[r2,theta2],[r1,theta1]];
	d3.selectAll(".branch").data(p)
		.attr("x1",0)
		.attr("x2",function(d){return - cartoon_height / 2 * d[0].value * Math.sin(d[1].value/180*Math.PI)})
		.attr("y1", - cartoon_height / 2)
		.attr("y2",function(d){return  - cartoon_height / 2 - cartoon_height / 2 * d[0].value * Math.cos(d[1].value/180*Math.PI)})
	updatetree(node);	
	create();
}

// these updates is invoked by the buttons

function anglenoise(){
	update_angle_noise(node);
	updatetree(node);
	create();
}

function lengthnoise(){
	update_length_noise(node);
	updatetree(node);
	create();
}

function selectsystem(d){
	var s = presets[d.value()];
	r1.value = s.r1;
	r2.value = s.r2;
	r3.value = s.r3;
	theta1.value = s.theta1;
	theta2.value = s.theta2;
	theta3.value = s.theta3;
	sigma.value = s.sigma;
	eta.value = s.eta;
	lw_max.value =s.lw_max;
	updatecanvas();
	d3.selectAll(".slider").select(".handle").transition()
	.attr("cx", function(q){return q.X(q.value())});
}	
})()