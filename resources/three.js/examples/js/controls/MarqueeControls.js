//
//
//
//
//

/**
 * 
 * @param {*} object 
 * @param {*} domElement 
 */

THREE.Marquee2DControls = function (object, obj_array, _domElement) {


  var DEBUG = false;
  var DEBUG_SELECTION = false;
  var DEBUG_MARQUEE = true;

  this.domElement = (_domElement !== undefined) ? _domElement : document;

  // track the surface for this marquee control
  this.object = object;

  //referenec to array of objects which can be selected
  this.obj_array = obj_array;

  if (!clock.running)
    clock.start();


  clock.start();

  //in milliseconds
  this.DragTime = 0;
  this.DragTimeWait = 0.2;

  // track the state of whether the mouse is being held down
  // this is mostly used to capture the state before a drag is triggered
  this.mouseDragOn = false;

  // the mouse is being held down, and has triggered dragging
  // used to update the highlighted objects list
  this.mouseSelectionDragOn = false;

  this.mouseDragStart = new THREE.Vector3();
  this.mouseDragEnd = new THREE.Vector3();

  var mouse = new THREE.Vector2();

  // these are used by the shader to draw the marquee, update by events
  this.uniforms = {
    center: {
      value: new THREE.Vector3()
    },
    size: {
      value: new THREE.Vector2(50, 50)
    },
    lineHalfWidth: {
      value: 4.0
    },
    enabled: {
      value: false
    },
    theta: {
      value: 0
    }
  };

  var vertShader =
    `
      varying vec2 vPos;
      void main() {
        vPos = position.xz;
        gl_Position = projectionMatrix *
                      modelViewMatrix *
                      vec4(position,1.0);
      }
    `;

  var fragShader =
    `
    #define PI 3.1415926 * 100000.
    
      uniform vec3 center;
      uniform vec2 size;
      uniform float lineHalfWidth;
      uniform float theta;
      uniform bool enabled;
      
      varying vec2 vPos;
      
      void main() {

        float cs = cos(theta), sn = sin(theta); 
        mat2 m = mat2(cs, -sn, sn, cs);

          // dims of select box change to match rotation
        vec2 Ro = abs (( size * .5 ) * m );
      
        vec2 Uo = abs( (vPos - center.xz) * m ) - Ro;
        
        vec3  c = mix(vec3(1.), vec3(1.,0.,0.), float(abs(max(Uo.x,Uo.y)) < lineHalfWidth));
        
        gl_FragColor = vec4(c, float(enabled && (abs(max(Uo.x,Uo.y)) < lineHalfWidth)  ));

      }
      
    `;

  //the shader material used for the marquee
  this.matShader = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    // this is using the shader defined in the html file
    vertexShader: vertShader,
    fragmentShader: fragShader,
    //visible: false,
    //  wireframe: true
    transparent: true,
  });


  //used if we want to debug display the dragged surface
  this.matWire = new THREE.MeshBasicMaterial({
    color: "blue",
    wireframe: true,
    visible: false
  });

  // clone the geometry of the mesh object passed in
  this.geom = object.geometry.clone();

  this.geom.rotateX(-Math.PI * .5);
  this.geom.translate(0, 1, 0);
  this.geom.computeFaceNormals();
  this.geom.computeVertexNormals();


  var obj = THREE.SceneUtils.createMultiMaterialObject(this.geom, [this.matShader, this.matWire]);

  obj.name = 'Surface Duplicate';

  obj.children.forEach(element => {
    element.name = 'Surface Duplicate';
  });

  scene.add(obj);


  var raycaster = new THREE.Raycaster();

  this.selected_objects = [];
  this.highlighted_objects = [];

  // random point
  var point = new THREE.Vector3();

  // store the local context for use in events
  var that = this;

  //    __  __                      ____                      
  //   |  \/  | ___  _   _ ___  ___|  _ \  _____      ___ __  
  //   | |\/| |/ _ \| | | / __|/ _ \ | | |/ _ \ \ /\ / / '_ \ 
  //   | |  | | (_) | |_| \__ \  __/ |_| | (_) \ V  V /| | | |
  //   |_|  |_|\___/ \__,_|___/\___|____/ \___/ \_/\_/ |_| |_|     
  //                                                 


  function onMouseDown(ev) {

    event.preventDefault();


    //which mouse button is triggering this event
    switch (ev.button) {

      //only care about mouse button 1 clicks
      case 0:
        break;
      case 1:
        return;
      case 2:
        return;

    }

    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

    // should this be mouseClickOn, or something?
    that.mouseDragOn = true;

    that.DragTime = clock.getElapsedTime();

    raycaster.setFromCamera(mouse, camera);

    // find objects for selection
    intersects = raycaster.intersectObjects(scene.children, true);

    //select the top most object
    if (intersects.length > 0) {
      toggleSelectObject(intersects[0].object);
    }

    // look for intersection with the marqueed object
    intersects = raycaster.intersectObject(obj, true);
    that.mouseDragOn = true;

    if (intersects.length === 0) {
      return;
    }
    /*     intersects.forEach(element => {
          //    console.log(element)
        }); */

    point.copy(intersects[0].point);
    obj.worldToLocal(point);

    that.mouseDragStart.copy(intersects[0].point.clone());
    that.mouseDragEnd.copy(point);

    that.mouseSelectionDragOn = false;
  };


  //    __  __                      _   _       
  //   |  \/  | ___  _   _ ___  ___| | | |_ __  
  //   | |\/| |/ _ \| | | / __|/ _ \ | | | '_ \ 
  //   | |  | | (_) | |_| \__ \  __/ |_| | |_) |
  //   |_|  |_|\___/ \__,_|___/\___|\___/| .__/ 
  //                                     |_|    

  function onMouseUp(ev) {


    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

    switch (ev.button) {

      // ignore other clicks
      case 0:
        break;
      case 1:
        return;
      case 2:
        return;

    }


    if (that.mouseSelectionDragOn) {

      raycaster.setFromCamera(mouse, camera);
      intersects = raycaster.intersectObject(obj, true);
      if (intersects.length === 0) return;
      // Updates the vector from world space to local space.
      obj.worldToLocal(point.copy(intersects[0].point));
      that.uniforms.lineHalfWidth.value = 0;

      // var c1 = createCubeFromMinMaxPoints(that.mouseDragStart,
      //   that.mouseDragEnd, 15000, true);
      var c1 = createCubeFromCentreXwidthYwidthRadius(
        that.uniforms.center.value,
        that.uniforms.size.value.x,
        that.uniforms.size.value.y,
        that.uniforms.theta.value,
        false
      );

      //var bbox = new THREE.Box3().setFromObject(c1);

      //terrainScene.children[0].visible = false;

      var targets = that.obj_array;
      targets.forEach(element => {
        // createDebugSphereAtPoint(element.position);

        //var tmp = that.object.localToWorld(element.position.clone());

        // var helper = new THREE.Box3Helper(bbox, 0xffff00);
        // scene.add(helper);
        var tmp = element.getWorldPosition();
        if (c1.containsPoint(tmp, boxpoints)) {
          //  console.log("found object " + element);

          // createDebugSphereAtPoint(element.position);

          selectObject(element);
          unHighlightObject(element);
          //createDebugSphereAtPoint(tmp);
        } else {
          if (DEBUG_SELECTION)
            console.log("unselecting object in mouse up");
          //  console.log(element);
          if (that.selected_objects.includes(element)) {
            if (DEBUG_SELECTION)
              console.log("unselecting due to not being included in the drag")
            unSelectObject(element);
          }

        }
      });

    }



    that.highlighted_objects.forEach(el => {
      if (DEBUG_SELECTION)
        console.log("unhighlighting due to mouse up");
      unHighlightObject(el);
    });

    that.mouseDragOn = false;
    that.mouseSelectionDragOn = false;

  }

  //    __  __                      __  __                
  //   |  \/  | ___  _   _ ___  ___|  \/  | _____   _____ 
  //   | |\/| |/ _ \| | | / __|/ _ \ |\/| |/ _ \ \ / / _ \
  //   | |  | | (_) | |_| \__ \  __/ |  | | (_) \ V /  __/
  //   |_|  |_|\___/ \__,_|___/\___|_|  |_|\___/ \_/ \___|
  //                                              

  var spherical = new THREE.Spherical();
  var tempVector = new THREE.Vector3();

  function onMouseMove(ev) {


    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // just hovering over the surface...
    if (!that.mouseDragOn && !that.mouseSelectionDragOn) {

      // if (DEBUG)
      //   console.log("not drag or selected");

      var intersects = raycaster.intersectObjects(that.obj_array, true);

      var tmp_array = []

      for (var i = 0; i < intersects.length; i++) {
        var o = intersects[i].object;

        tmp_array.push(o);
        highlightObject(o);

      }

      that.highlighted_objects.forEach(element => {

        if (!tmp_array.includes(element)) {
          unHighlightObject(element);
        }
      });

      // drag not triggered, check drag conditions
    } else if (that.mouseDragOn && !that.mouseSelectionDragOn) {

      // if (DEBUG)
      //   console.log("dragging in not selection drag");

      // drag after .5 seconds???
      if (clock.getElapsedTime() > (that.DragTime + that.DragTimeWait)) {
        that.mouseSelectionDragOn = true;
      }


    } else if (that.mouseDragOn && that.mouseSelectionDragOn) {

      // if (DEBUG)
      //   console.log("dragging in selection drag");

      intersects = raycaster.intersectObject(obj, true);
      if (intersects.length === 0) return;

      //  console.log("dragging");

      that.uniforms.enabled.value = true;
      that.uniforms.lineHalfWidth.value = 1;

      // get the current intersection point of the drag
      point.copy(intersects[0].point);

      //copy it into the object
      that.mouseDragEnd.copy(point);

      var v_moved = point.clone().sub(that.mouseDragStart);
      var v_midpoint_delta = v_moved.clone().divideScalar(2);
      var v_centre = v_midpoint_delta.add(that.mouseDragStart.clone());

      //  scene.add(getVertLine(v_centre, 100, 0xBBBBBB));
      //   console.log(v_centre);

      // found the mid point of the drag
      that.uniforms.center.value.copy(v_centre);

      // that.uniforms.theta.value = spherical.setFromVector3(tempVector.subVectors(camera.position, v_centre)).theta;
      // lengths of drags in world x and z direction
      var xpos = that.mouseDragEnd.x - that.mouseDragStart.x;
      var zpos = that.mouseDragEnd.z - that.mouseDragStart.z;

      // if ((xpos > 0 && zpos < 0)) {
      //   console.log("here");
      // }

      that.uniforms.size.value.x = that.mouseDragEnd.x - that.mouseDragStart.x;
      that.uniforms.size.value.y = that.mouseDragEnd.z - that.mouseDragStart.z;
      that.uniforms.theta.value = spherical.setFromVector3(tempVector.subVectors(camera.position, v_centre)).theta;


      if (DEBUG_SELECTION)
        console.log(`size.x: ${_round(that.uniforms.size.value.x)}, size.z: ${_round(that.uniforms.size.value.y)}, xpos: ${_round(xpos)}, zpos: ${_round(zpos)}  theta: ${_round(that.uniforms.theta.value)}`);


      scene.remove(c1);

      c1 = createCubeFromCentreXwidthYwidthRadius(
        that.uniforms.center.value,
        that.uniforms.size.value.x,
        that.uniforms.size.value.y,
        that.uniforms.theta.value,
        false
      );

      var targets = this.obj_array;

      boxpoints.forEach(bp => {
        scene.remove(bp);
      });

      that.obj_array.forEach(element => {

        // var tmp = that.object.localToWorld(element.position.clone());
        var tmp = element.getWorldPosition();
        if (c1.containsPoint(tmp, boxpoints)) {
          //console.log("found object " + element);

          highlightObject(element);
        } else {
          unHighlightObject(element);
        }


      });
    }
  }
  var c1;
  var bbox;
  var boxpoints = [];

  //    _   _ _       _     _ _       _     _   _
  //   | | | (_) __ _| |__ | (_) __ _| |__ | |_(_)_ __   __ _
  //   | |_| | |/ _` | '_ \| | |/ _` | '_ \| __| | '_ \ / _` |
  //   |  _  | | (_| | | | | | | (_| | | | | |_| | | | | (_| |
  //   |_| |_|_|\__, |_| |_|_|_|\__, |_| |_|\__|_|_| |_|\__, |
  //            |___/           |___/                   |___/

  // use these colors if the object has one material, set the colo
  _color_highlight = 0x888800;
  _color_selected = 0x880000;
  _color_both = 0x00FFFF;

  // use these materials of the object has an array of materials
  var _highlight_material = new THREE.MeshLambertMaterial({
    color: 0xFFD700
  }); // gold

  var _both_material = new THREE.MeshLambertMaterial({
    color: 0x00FFFF
  }); // gold


  var _select_material = new THREE.MeshLambertMaterial({
    color: 0x880000
  }); // 


  function highlightObject(object) {

    // don't highlight stuff
    if (['water', 'sand', 'SkyDome', 'Helper',
        'Drag Box', 'Terrain Mesh', 'Drag Line', 'Surface Duplicate'
      ].includes(object.name))
      return;


    if (!that.highlighted_objects.includes(object)) {
      //tmp_array.push(object);
      try {
        // if (DEBUG){

        // console.log("on mouse move, hit object");
        // console.log(object);
        // }

        if (Array.isArray(object.material)) {

          if (!that.selected_objects.includes(object))
            object.__dirty_materials = object.material;

          let tmpmat = []

          for (let i = 0; i < object.material.length; i++) {
            const el = object.material[i];

            //      console.log("highlighting element color array");



            //if the object is selected, let unselect handle color change
            if (!that.selected_objects.includes(object)) {
              if (DEBUG)
                console.log("highlighting element not selected");
              //dirty color is usually the original color
              // if there was a weird transition, then it could be lost
              // object.__dirty_materials[i] = el;
              tmpmat[i] = _highlight_material;
              //object.material.color.set( 0xff0000 ); 
            } else {
              //        console.log("highlighting element selected");
              //if object is already selected, high light with alternative
              //element.color.setHex(_color_both);
              tmpmat[i] = _both_material;
            }

          };

          object.material = tmpmat;


        } else {

          var h = object.material.color.getHex();
          //if the object is selected, let unselect handle color change
          if (!that.selected_objects.includes(object)) {
            if (DEBUG_SELECTION)
              console.log("highlighting unselected, setting hex to highligh");

            //dirty color is usually the original color
            // if there was a weird transition, then it could be lost
            object.material.color.__dirtycolor = h;
            object.material.color.setHex(_color_highlight);
            //object.material.color.set( 0xff0000 ); 
          } else {
            if (DEBUG_SELECTION)

              console.log("highlighting selected, setting hex to both");
            //if object is already selected, high light with alternative
            object.material.color.setHex(_color_both);
          }
        }




        that.highlighted_objects.push(object);


      } catch (error) {

        console.log(error);
        console.log(object);
      }

    } else {
      //already highlighted
    }

  }

  function array_remove(array, element) {
    return array.filter(e => e !== element);
  }

  function unHighlightObject(object) {

    // don't highlight stuff
    if (['water', 'sand', 'SkyDome', 'Helper', 'Drag Box', 'Terrain Mesh', 'Drag Line', 'Surface Duplicate'].includes(object.name))
      return;

    if (that.highlighted_objects.includes(object)) {

      //tmp_array.push(object);
      try {
        // console.log(object);

        if (Array.isArray(object.material)) {

          /**
           
                      object.__dirty_materials[i] = el;
                      object.material[i] = _highlight_material;
           */

          for (let i = 0; i < object.material.length; i++) {
            const el = object.material[i];

            //if the object is selected, let unselect handle color change
            if (!that.selected_objects.includes(object)) {

              if (DEBUG_SELECTION)
                console.log("restoring not selected object from highlighted");
              object.material = object.__dirty_materials;
            } else {

              if (DEBUG_SELECTION)
                console.log("restoring selected object from highlighted");
              object.material[i] = _select_material;
            }

          };

        } else {
          let h = object.material.color.__dirtycolor;
          //if the object is selected, let unselect handle color change
          if (!that.selected_objects.includes(object)) {


            if (DEBUG_SELECTION)
              console.log("unhighlighting not selected object to dirtycolor");
            object.material.color.setHex(h);
          } else {

            if (DEBUG_SELECTION)
              console.log("unhighlighting selected object to selected color");
            object.material.color.setHex(_color_selected);
          }


        }

        that.highlighted_objects = array_remove(that.highlighted_objects, object);





      } catch (error) {

        console.log(error);
        console.log(object);
      }

    } else {
      //already highlighted
    }

  }





  //    ____       _           _   _
  //   / ___|  ___| | ___  ___| |_(_)_ __   __ _
  //   \___ \ / _ \ |/ _ \/ __| __| | '_ \ / _` |
  //    ___) |  __/ |  __/ (__| |_| | | | | (_| |
  //   |____/ \___|_|\___|\___|\__|_|_| |_|\__, |
  //                                       |___/




  function toggleSelectObject(o) {
    if (that.selected_objects.includes(o)) {
      // console.log("de selecting");
      unSelectObject(o);
    } else {
      // console.log("selecting");
      selectObject(o);
    }

  }

  function selectObject(object) {

    // don't highlight stuff
    if (['water', 'sand', 'SkyDome', 'Helper', 'Drag Box', 'Terrain Mesh', 'Drag Line', 'Surface Duplicate'].includes(object.name))
      return;

    if (!that.selected_objects.includes(object)) {
      //tmp_array.push(object);
      try {
        if (Array.isArray(object.material)) {

          object.__dirty_materials_select = object.material;
          let tmpmat = []

          for (let i = 0; i < object.material.length; i++) {
            const el = object.material[i];


            //if the object is highlighted, let unselect handle color change
            if (!that.highlighted_objects.includes(object)) {
              if (DEBUG_SELECTION)
                console.log("selecting unselected unhighlighted element color array");

              tmpmat[i] = _select_material;
            } else {
              if (DEBUG_SELECTION)
                console.log("selecting unselected highligted element color array");
              tmpmat[i] = _both_material;
            }

          };

          object.material = tmpmat;


        } else {

          var h = object.material.color.getHex();
          if (DEBUG_SELECTION)
            console.log("selecting unselected, setting hex");
          // this is probably the highlighted color
          object.material.color.__dirtycolor_select = h;
          object.material.color.setHex(0x880000);
          //object.material.color.set( 0xff0000 ); 
        }

        that.selected_objects.push(object);

        //update the gui, and other stuff if appropriate
        updateSelectedObjects();

      } catch (error) {

        console.log(error);
        console.log(object);
      }

    } else {
      //already highlighted
    }

  }

  function array_remove(array, element) {
    return array.filter(e => e !== element);
  }

  function unSelectObject(object) {
    // don't highlight stuff
    if (['water', 'sand', 'SkyDome', 'Helper', 'Drag Box', 'Terrain Mesh', 'Drag Line', 'Surface Duplicate'].includes(object.name))
      return;

    if (that.selected_objects.includes(object)) {

      //tmp_array.push(object);
      try {

        if (Array.isArray(object.material)) {

          for (let i = 0; i < object.material.length; i++) {

            //if the object is selected, let unselect handle color change
            if (!that.highlighted_objects.includes(object)) {
              //    console.log("restoring __dirty Materials");
              if (DEBUG_SELECTION)
                console.log("unselecting unhighlighted array");

              if (object.__dirty_materials) {
                //   console.log("restoring __dirty Materials");
                object.material = object.__dirty_materials;
              } else if (object.__dirty_materials_select) {
                // this might happen if the object was
                // selected via a byproduct
                //    console.log("restoring __dirty Materials (select)");
                object.material = object.__dirty_materials_select;
              } else {

                throw "No material to restore!!!!";
              }
            } else {
              if (DEBUG_SELECTION)
                console.log("unselecting highlighted array");
              //     console.log("restoring highlighted object from select");
              object.material[i] = _highlight_material;
            }

          };

        } else {
          if (DEBUG_SELECTION)
            console.log("unselecting selected, setting hex to dirty color");

          // console.log(object);
          var h = object.material.color.__dirtycolor;
          object.material.color.setHex(h);
          //object.material.color.set( 0xff0000 ); 
        }

        that.selected_objects = array_remove(that.selected_objects, object);

        //update the gui, and other stuff if appropriate
        updateSelectedObjects();

      } catch (error) {

        console.log(error);
        console.log(object);
      }

    } else {
      //already highlighted
    }

  }

  //(-1)[0]
  function updateSelectedObjects() {

    if (that.selected_objects.length == 0) {
      /*     if (_current_controller) {
            gui.removeFolder(_current_controller);
            //    _current_controller = null;
          } else {
          
          } */


    } else if (that.selected_objects.length == 1) {
      // showObjectInGui(selected_objects[0]);
    } else if (that.selected_objects.length > 1) {
      //    showObjectsInGui(selected_objects);

    }
  }


  //    _____                 _
  //   | ____|_   _____ _ __ | |_ ___
  //   |  _| \ \ / / _ \ '_ \| __/ __|
  //   | |___ \ V /  __/ | | | |_\__ \
  //   |_____| \_/ \___|_| |_|\__|___/
  //

  this.activate = function () {




    that.domElement.addEventListener('mousemove', onMouseMove, false);
    that.domElement.addEventListener('mousedown', onMouseDown, false);
    that.domElement.addEventListener('mouseup', onMouseUp, false);
    // _domElement.addEventListener('mouseleave',this. onMouseCancel, false);
    // _domElement.addEventListener('touchmove', this.onTouchMove, false);
    // _domElement.addEventListener('touchstart', this.onTouchStart, false);
    // _domElement.addEventListener('touchend', this.onTouchEnd, false);

  }

  this.deactivate = function () {

    scene.remove(obj);

    that.domElement.removeEventListener('mousemove', onMouseMove, false);
    that.domElement.removeEventListener('mousedown', onMouseDown, false);
    that.domElement.removeEventListener('mouseup', onMouseUp, false);
    // _domElement.removeEventListener('mouseleave', this.onMouseCancel, false);
    // _domElement.removeEventListener('touchmove', this.onTouchMove, false);
    // _domElement.removeEventListener('touchstart', this.onTouchStart, false);
    // _domElement.removeEventListener('touchend', this.onTouchEnd, false);

  }

  function dispose() {

    this.deactivate();

  }

};



var line222;
var cube1;

function createCubeFromCentreXwidthYwidthRadius(c, w, d, r,
  visible = false, timeout = 5000) {

  var size = v2(w, d);


  // draw line through point c, on axis axis
  var vc1 = v(0, 0, 1);

  vc1.applyAxisAngle(v(0, 1, 0), r);

  if (DEBUG_SELECTION)
    console.log(`before rotation width: ${size.x}, height: ${size.y}, theta: ${r}`);
  size.rotateAround(v2(0, 0), r);

  if (DEBUG_SELECTION)
    console.log(`after rotation width: ${size.x}, height: ${size.y}`);



  var cube = new THREE.Mesh(new THREE.CubeGeometry(size.x, 200, size.y),

    new THREE.MeshBasicMaterial({
      color: _c_color(),
      transparent: true,
      wireframe: true,
      opacity: 0.5,
      visible: visible
    }));

  cube.position.x = c.x;
  cube.position.y = c.y;
  cube.position.z = c.z;

  cube.rotation.y = r;



  cube.containsPoint = function (p, boxpoints = []) {


    // vector from cube centre to point
    var pclone = p.clone();

    var pclone2 = pclone.sub(cube.position);



    // scene.add(getVertLine(pclone2, 100, 0xFFFF00));

    // rotate the point into the cubes coords
    var pclone3 = pclone2.applyAxisAngle(v(0, 1, 0), -r);

    // scene.add(getVertLine(pclone3, 100, 0xFF00FF));

    // console.log(`width ratio: ${size.x/ w}`);
    // console.log(`depth ratio: ${size.y/ d}`);
    // var pclone2_scaled = v(pclone3.x * (size.x/ w), pclone3.y,  
    //pclone3.z * (size.y/ d));

    var pclone4 = pclone3.add(cube.position);

    // var bptmp = getVertLine(pclone4, 100, 0x00FFFF);
    // boxpoints.push(bptmp);

    // scene.add(bptmp);


    var geometry = new THREE.BoxGeometry(size.x, 500, size.y);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: false,
      visible: false,
    });

    scene.remove(cube1);
    cube1 = new THREE.Mesh(geometry, material);
    cube1.position.x = cube.position.x;
    cube1.position.z = cube.position.z;

    scene.add(cube1);

    // var box22 = new THREE.BoxHelper( cube1, 0xffff00 );
    // scene.add( box22 );

    // cube.position.x
    var box = new THREE.Box3();

    box.setFromObject(cube1);

    setTimeout(function () {
      scene.remove(cube1);
    }, 50000);

    if (box.containsPoint(pclone)) {
      return true;
    }
    return false;

  }

  scene.add(cube);
  setTimeout(function () {
    scene.remove(cube);
  }, timeout);
  return cube;
}


var DEBUG = false;
var DEBUG_SELECTION = false;
var DEBUG_MARQUEE = true;

function createCubeFromMinMaxPoints(minP, maxP, timeout = 15000, visible = true, theta = 0) {

  // console.log(maxP);
  // console.log(minP);



  var d = maxP.clone().sub(minP);

  // console.log(d);
  var c2 = d.clone().divideScalar(2);
  var c = c2.clone().add(minP);

  var cube = new THREE.Mesh(new THREE.CubeGeometry(d.x, d.y + 1000, d.z),

    new THREE.MeshBasicMaterial({
      color: _c_color(),
      transparent: false,
      wireframe: true,
      opacity: 0.5
    }));

  cube.position.x = c.x;
  cube.position.y = c.y - 200;
  cube.position.z = c.z;

  if (!visible) {
    cube.visible = false;
  }

  scene.add(cube);
  setTimeout(function () {
    scene.remove(cube);
  }, timeout);
  return cube;

}


var _c_color = (function () {

  var index = 0;
  var colors = [
    '#FFFFFF', //white
    '#DC143C', //crison/red
    '#FF7F50', //Coral/orange
    '#FFD700', //gold/yellow
    '#008000', //green
    '#0000CD', //medium blue
    '#4B0082', //indigo
    '#EE82EE', //violet
    '#8B4513', //brown
    '#708090', //slate gray
    '#000000' //black
  ];
  return function () {
    return colors[index++ % colors.length];
  }

})();




function createDebugSphereAtPoint(p) {

  var d = p.clone();

  // mesh
  var sphereGeometry = new THREE.SphereGeometry(5, 32, 16);
  var sphereMaterial = new THREE.MeshLambertMaterial({
    color: _c_color()
  });
  var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.x = d.x;
  sphere.position.y = d.y;
  sphere.position.z = d.z;
  scene.add(sphere);

  setTimeout(function () {
    scene.remove(sphere);
  }, 10000);

}