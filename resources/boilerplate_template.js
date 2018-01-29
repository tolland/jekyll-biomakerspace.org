/**
 * 
 * 
 */


//    ____        __             _ _
//   |  _ \  ___ / _| __ _ _   _| | |_ ___
//   | | | |/ _ \ |_ / _` | | | | | __/ __|
//   | |_| |  __/  _| (_| | |_| | | |_\__ \
//   |____/ \___|_|  \__,_|\__,_|_|\__|___/
//


var _o = __options_default = {


  debug: {
    warning: true,
    info: true,
    verbose: false,
    silly: false
  },

  gui_stats: true,
  gui_camera: true, // enables selecting the active camera
  /** selecting an object will show its properties in the gui */
  gui_select: false,
  gui_object_list: false, // puts Object3D objects in the debug gui

  gui: {
    menu: true
  },

  controls: {
    lock: true, // lock the active camera to the 
    orbit: {
      enableRotate: true,
      enableKeys: false,
      enablePan: true,
      enableZoom: true,
    }
  },

  controls_fly: false,
  controls_drag: false,
  controls_transform: false,
  controls_firstperson: false,
  controls_pointerlock: false,
  controls_trackball: false,
  controls_marquee_2d: false,
  controls_marquee_3d: false,

  lighting: {
    directionalLight: {

    },
    skyLight: {

    }
  },

  //expose the options so they can be set in the gui
  camera_main: {
    fov: 60,
    near: 1,
    far: 10000,
    enableZoom: true,
    enablePan: true
  },
  camera_fps: {
    fov: 60,
    near: 1,
    far: 10000
  },
  camera_ortho: {
    fov: 60,
    near: 1,
    far: 10000
  },

  extensions: {
    terrain: false,
    ccapture: false,
  },

  examples: {
    debugCube: false,
  },

  environment: {
    skyDome: false,
    skyLight: false,
    sunShader: false,
    sunShader_gui: true,
    water: false,

  },

  misc: {
    resize_handler: true,
    water: false,
    container_id: 'container',
    rendererClearColor: 0xEEEEEE
  },

  renderCallbacks: []
};

// merge user supplied options

_o = mergeRecursive(_o, _options);

// override some options for extensions
// TODO how to merge these and allow overrides - maybe config opject
// like is vscode

if (_o.extensions.terrain) {
  _o.environment.skyDome = false;
  _o.environment.skyLight = true;
  _o.environment.water = false;
  _o.camera_main.far = 20000;
  // disable conflicting controls
  _o.controls.orbit.enableRotate = false;
  // set the marquee controller to false, as we will handle it in terrain
  _o.controls_marquee_2d = false;
}

// check if its being displayed in a thumbnail view of the window
if (getUrlParameter('mini_iframe')) {
  _o.gui.menu = false;
  _o.gui_stats = false;

}

//     ____            _        _
//    / ___|___  _ __ | |_ __ _(_)_ __   ___ _ __
//   | |   / _ \| '_ \| __/ _` | | '_ \ / _ \ '__|
//   | |__| (_) | | | | || (_| | | | | |  __/ |
//    \____\___/|_| |_|\__\__,_|_|_| |_|\___|_|
//

// Workaround: in Chrome, if a page is opened with window.open(),
// window.innerWidth and window.innerHeight will be zero.
if (window.innerWidth === 0) {
  window.innerWidth = parent.innerWidth;
  window.innerHeight = parent.innerHeight;
}

// check to see if an existing placeholder exists
var container = document.getElementById('container');

// set _o.width and _o.height based on the container type
setDimensions();





//    ____       _             _____ _                       _ ____
//   / ___|  ___| |_ _   _ _ _|_   _| |__  _ __ ___  ___    | / ___|
//   \___ \ / _ \ __| | | | '_ \| | | '_ \| '__/ _ \/ _ \_  | \___ \
//    ___) |  __/ |_| |_| | |_) | | | | | | | |  __/  __/ |_| |___) |
//   |____/ \___|\__|\__,_| .__/|_| |_| |_|_|  \___|\___|\___/|____/
//                        |_|

// these are globals that expected by libs, examples and extensions
var scene, renderer, clock, camera, controls, stats, gui;

scene = new THREE.Scene();
scene.name = 'Scene';

var _renderer_options = {
  antialias: true,
  // ccapture.js doesn't seem to work with webm with alpha: true
  // https://github.com/spite/ccapture.js/issues/40
  alpha: _o.extensions_capture ? false : true
};

renderer = new THREE.WebGLRenderer(_renderer_options);

renderer.setSize(_o.width, _o.height);
renderer.setClearColor(_o.misc.rendererClearColor, 1.0);
renderer.clear();

var width = _o.width;
var height = _o.height;

if (container) {
  container.appendChild(renderer.domElement);
} else {
  document.body.appendChild(renderer.domElement);
}

renderer.domElement.setAttribute('tabindex', -1);

// Clock for calculating deltas
clock = new THREE.Clock();

// Add stats to page.
if (_o.gui_stats) {
  stats = new Stats();
  document.body.appendChild(stats.dom);
}

// create the gui for use by the modules
gui = new dat.GUI();

if (!_o.gui.menu) {
  gui.__proto__.constructor.toggleHide();
}


//    _     _       _     _   _
//   | |   (_) __ _| |__ | |_(_)_ __   __ _
//   | |   | |/ _` | '_ \| __| | '_ \ / _` |
//   | |___| | (_| | | | | |_| | | | | (_| |
//   |_____|_|\__, |_| |_|\__|_|_| |_|\__, |
//            |___/                   |___/

/**
 * A light that gets emitted in a specific direction. This light will behave as 
 * though it is infinitely far away and the rays produced from it are all 
 * parallel. The common use case for this is to simulate daylight; the sun is 
 * far enough away that its position can be considered to be infinite, and all 
 * light rays coming from it are parallel.
 */
if (_o.lighting.directionalLight) {
  dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(-1, 1, 1).normalize();
  dirLight.name = 'Directional Light'
  scene.add(dirLight);
}

if (_o.lighting.skyLight) {
  skyLight = new THREE.DirectionalLight(0xe8bdb0, 1.5);
  skyLight.position.set(2950, 2625, -160); // Sun on the sky texture
  skyLight.name = 'skyLight';
  scene.add(skyLight);
  var light = new THREE.DirectionalLight(0xc3eaff, 0.75);
  light.position.set(-1, -0.5, -1);
  light.name = 'Directional Light (skyLight)';
  scene.add(light);
}


// var skyLight2 = new THREE.DirectionalLight(0xe8bdb0, 1.5);
// skyLight2.position.set(2950, 2625, -160); // Sun on the sky texture
// scene.add(skyLight2);
// var light = new THREE.DirectionalLight(0xc3eaff, 0.75);
// light.position.set(-1, -0.5, -1);
// scene.add(light);



//     ____
//    / ___|__ _ _ __ ___   ___ _ __ __ _ ___
//   | |   / _` | '_ ` _ \ / _ \ '__/ _` / __|
//   | |__| (_| | | | | | |  __/ | | (_| \__ \
//    \____\__,_|_| |_| |_|\___|_|  \__,_|___/
//

if (_o.camera_main) {

  camera_main = new THREE.PerspectiveCamera(60,
    renderer.domElement.width / renderer.domElement.height, 1,
    _o.camera_main.far);

  camera_main.position.set(0, 5, 10);
  //camera.setLens(20);
  //give the camera a name so it can be found in console.log
  camera_main.name = 'Main Cam';

  if (DEBUG)
  console.log("setting main camera position");

  if (DEBUG)
    console.log(camera_main);

  camera_main.position.x = 449;
  camera_main.position.y = 311;
  camera_main.position.z = 376;

  if (DEBUG)
  console.log(camera_main);

  scene.add(camera_main);

  //store a reference in the commonly used var
  if (!camera) camera = camera_main;
}

if (_o.camera_fps) {

  camera_fps = new THREE.PerspectiveCamera(45,
    renderer.domElement.width / renderer.domElement.height, 1, 5000);

  //give the camera a name so it can be found in console.log
  camera_fps.name = 'FPS Cam';
  camera_fps.position.x = 449;
  camera_fps.position.y = 311;
  camera_fps.position.z = 376;

  scene.add(camera_fps);

  //store a reference in the commonly used var
  if (!camera) camera = camera_fps;
}

//     ____            _             _
//    / ___|___  _ __ | |_ _ __ ___ | |___
//   | |   / _ \| '_ \| __| '__/ _ \| / __|
//   | |__| (_) | | | | |_| | | (_) | \__ \
//    \____\___/|_| |_|\__|_|  \___/|_|___/
//

//globals to access the various control systems
var controls_fly, controls_orbit, controls_drag, controls_transform,
  controls_marquee_2d, controls_marquee_3d;

if (_o.controls.orbit) {

  controls_orbit = new THREE.OrbitControls(camera, renderer.domElement);

  if (!_o.controls.orbit.enableRotate)
    controls_orbit.enableRotate = false;

  if (!_o.controls.orbit.enableKeys)
    controls_orbit.enableKeys = false;

  //TODO when is this appropriate??
  //controls_orbit.addEventListener('change', render);

  //store a reference in the commonly used var
  if (!controls) controls = controls_orbit;
}

if (_o.controls_fly) {

  controls_fly = new THREE.FlyControls(camera, renderer.domElement);
  controls_fly.movementSpeed = 1000;
  controls_fly.rollSpeed = Math.PI / 24;
  controls_fly.autoForward = false;
  controls_fly.dragToLook = false;
  controls_fly.addEventListener('change', render);

  if (!controls) controls = controls_orbit;
}

if (_o.controls_drag) {

  controls_drag = new THREE.DragControls(camera, renderer.domElement);
  controls_drag.enableRotate = false;
  controls_drag.enableKeys = false;

}

if (_o.controls_transform) {

  controls_transform = new THREE.TransformControls(camera, renderer.domElement);
  controls_transform.enableRotate = false;
  controls_transform.enableKeys = false;

}

if (_o.controls_firstperson) {

  controls_firstperson = new THREE.FirstPersonControls(camera, renderer.domElement);
  controls_firstperson.enableRotate = false;
  controls_firstperson.enableKeys = false;

}

if (_o.controls_marquee_2d) {

  controls_marquee_2d = new THREE.Marquee2DControls(camera, renderer.domElement);
  controls_marquee_2d.enableRotate = false;
  controls_marquee_2d.enableKeys = false;

  //set to be the default controls, if none other set
  if (!controls) controls = controls_marquee_2d;
}

if (_o.controls_marquee_3d) {

  controls_marquee_3d = new THREE.Marquee2DControls(camera, renderer.domElement);
  controls_marquee_3d.enableRotate = false;
  controls_marquee_3d.enableKeys = false;

  //set to be the default controls, if none other set
  if (!controls) controls = controls_marquee_2d;
}

//    _____            _                                      _
//   | ____|_ ____   _(_)_ __ ___  _ __  _ __ ___   ___ _ __ | |_
//   |  _| | '_ \ \ / / | '__/ _ \| '_ \| '_ ` _ \ / _ \ '_ \| __|
//   | |___| | | \ V /| | | | (_) | | | | | | | | |  __/ | | | |_
//   |_____|_| |_|\_/ |_|_|  \___/|_| |_|_| |_| |_|\___|_| |_|\__|
//

// create some default sky

if (_o.environment.skyDome) {

  new THREE.TextureLoader().load('resources/img/sky1.jpg', function (t1) {
    t1.minFilter = THREE.LinearFilter; // Texture is not a power-of-two size; use smoother interpolation.
    skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(8192, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshBasicMaterial({
        map: t1,
        side: THREE.BackSide,
        fog: false
      })
    );
    skyDome.position.y = -99;
    skyDome.name = 'SkyDome';
    scene.add(skyDome);
  });

}

if (_o.environment.water) {

  water = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(16384 + 1024, 16384 + 1024, 16, 16),
    new THREE.MeshLambertMaterial({
      color: 0x006ba0,
      transparent: true,
      opacity: 0.6
    })
  );
  water.position.y = -99;
  water.rotation.x = -0.5 * Math.PI;
  water.name = 'water';
  scene.add(water);
}


if (_o.examples.debugCube) {
  var debug_cube = getDebugCube();
  debug_cube.position.y = 150;
  scene.add(debug_cube);
}

//    __       __
//   (_    ._ (_ |_  _. _| _ ._
//   __)|_|| |__)| |(_|(_|(/_|
//

if (_o.environment.sunShader) {
  if (_o.debug.info)
    console.log('Adding Sun Shader - http://localhost:18887/three.js/examples/webgl_shaders_sky.html');

  var helper = new THREE.GridHelper(10000, 2, 0xffffff, 0xffffff);
  scene.add(helper);

  var sky, sunSphere;
  sky = new THREE.Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  // Add Sun Helper
  sunSphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(20000, 16, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff
    })
  );
  sunSphere.position.y = -700000;
  sunSphere.visible = false;
  scene.add(sunSphere);

  if (_o.environment.sunShader_gui) {
    if (_o.debug.info)
      console.log('Adding Sun Shader GUI');

    var effectController = {
      turbidity: 10,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: 0.49, // elevation / inclination
      azimuth: 0.25, // Facing front,
      sun: !true
    };

    var distance = 400000;

    function guiChanged() {

      if (_o.debug.verbose)
        console.log('Sun Shader GUI Update');

      var uniforms = sky.material.uniforms;
      uniforms.turbidity.value = effectController.turbidity;
      uniforms.rayleigh.value = effectController.rayleigh;
      uniforms.luminance.value = effectController.luminance;
      uniforms.mieCoefficient.value = effectController.mieCoefficient;
      uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

      var theta = Math.PI * (effectController.inclination - 0.5);
      var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

      sunSphere.position.x = distance * Math.cos(phi);
      sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
      sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);

      sunSphere.visible = effectController.sun;

      uniforms.sunPosition.value.copy(sunSphere.position);

      renderer.render(scene, camera);

    }

    var sunshader = gui.addFolder('SunShader');

    sunshader.add(effectController, "turbidity", 1.0, 20.0, 0.1).onChange(guiChanged);
    sunshader.add(effectController, "rayleigh", 0.0, 4, 0.001).onChange(guiChanged);
    sunshader.add(effectController, "mieCoefficient", 0.0, 0.1, 0.001).onChange(guiChanged);
    sunshader.add(effectController, "mieDirectionalG", 0.0, 1, 0.001).onChange(guiChanged);
    sunshader.add(effectController, "luminance", 0.0, 2).onChange(guiChanged);
    sunshader.add(effectController, "inclination", 0, 1, 0.0001).onChange(guiChanged);
    sunshader.add(effectController, "azimuth", 0, 1, 0.0001).onChange(guiChanged);
    sunshader.add(effectController, "sun").onChange(guiChanged);

    guiChanged();

  }
}

//    _____                   _
//   |_   _|__ _ __ _ __ __ _(_)_ __
//     | |/ _ \ '__| '__/ _` | | '_ \
//     | |  __/ |  | | | (_| | | | | |
//     |_|\___|_|  |_|  \__,_|_|_| |_|
//

if (_o.extensions.terrain) {

  // var heightmapImage = new Image();
  // heightmapImage.src = 'resources/heightmap.png';

  var terrainScene;
  var controls_marquee_2d;
  //sets the terrainScene
  var settings = new TerrainSettings(() => {

    if (controls_marquee_2d) {
      controls_marquee_2d.deactivate();
    }
    // it looks like the mesh of the terrain is the first child
    // from the demo
    controls_marquee_2d = new THREE.Marquee2DControls(terrainScene.children[0],
      terrainScene.children[1].children, renderer.domElement);

    controls_marquee_2d.activate();
  });


  function TerrainSettings(callback) {
    //presumably to allow it to be used in event handlers
    var that = this;

    var decoScene;

    // template for trees that are scattered later
    var mesh = buildTree();

    function altitudeProbability(z) {
      if (z > -80 && z < -50) return THREE.Terrain.EaseInOut((z + 80) / (-50 + 80)) * that.spread * 0.002;
      else if (z > -50 && z < 20) return that.spread * 0.002;
      else if (z > 20 && z < 50) return THREE.Terrain.EaseInOut((z - 20) / (50 - 20)) * that.spread * 0.002;
      return 0;
    }
    this.altitudeSpread = function (v, k) {
      return k % 4 === 0 && Math.random() < altitudeProbability(v.z);
    };

    this.easing = 'Linear';
    this.heightmap = 'PerlinDiamond';
    this.smoothing = 'None';
    this.maxHeight = 200;
    this.segments = 63;
    this.steps = 1;
    this.turbulent = false;
    this.size = 2048;
    this.sky = true;
    this.texture = 'Blended';
    this.edgeDirection = 'Normal';
    this.edgeType = 'Box';
    this.edgeDistance = 256;
    this.edgeCurve = 'EaseInOut';
    this['width:length ratio'] = 1.0;
    this['Light color'] = '#' + skyLight.color.getHexString();
    this.spread = 60;
    this.scattering = 'PerlinAltitude';
    this.after = function (vertices, options) {
      if (that.edgeDirection !== 'Normal') {
        (that.edgeType === 'Box' ? THREE.Terrain.Edges : THREE.Terrain.RadialEdges)(
          vertices,
          options,
          that.edgeDirection === 'Up' ? true : false,
          that.edgeType === 'Box' ? that.edgeDistance : Math.min(options.xSize, options.ySize) * 0.5 - that.edgeDistance,
          THREE.Terrain[that.edgeCurve]
        );
      }
    };

    var mat = new THREE.MeshBasicMaterial({
      color: 0x5566aa,
      wireframe: true
    });
    var gray = new THREE.MeshPhongMaterial({
      color: 0x88aaaa,
      specular: 0x444455,
      shininess: 10
    });
    var loader = new THREE.TextureLoader();
    //load the texture
    loader.load('resources/img/sand1.jpg', function (t1) {
      t1.wrapS = t1.wrapT = THREE.RepeatWrapping;

      //create the mesh, with a big plane, and map the sand onto it
      sand = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(16384 + 1024, 16384 + 1024, 64, 64),
        new THREE.MeshLambertMaterial({
          map: t1
        })
      );

      sand.name = 'sand';
      sand.position.y = -101;
      sand.rotation.x = -0.5 * Math.PI;

      scene.add(sand);

      loader.load('resources/img/grass1.jpg', function (t2) {
        t2.wrapS = t2.wrapT = THREE.RepeatWrapping;
        loader.load('resources/img/stone1.jpg', function (t3) {
          t3.wrapS = t3.wrapT = THREE.RepeatWrapping;
          loader.load('resources/img/snow1.jpg', function (t4) {
            t4.wrapS = t4.wrapT = THREE.RepeatWrapping;
            // t2.repeat.x = t2.repeat.y = 2;
            blend = THREE.Terrain.generateBlendedMaterial([{
                texture: t1
              },
              {
                texture: t2,
                levels: [-80, -35, 20, 50]
              },
              {
                texture: t3,
                levels: [20, 50, 60, 95]
              },
              {
                texture: t4,
                glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'
              },
              {
                texture: t3,
                glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'
              }, // between 27 and 45 degrees
            ]);
            that.Regenerate(callback);


          });
        });
      });
    });


    window.rebuild = this.Regenerate = function () {
      var s = parseInt(that.segments, 10),
        h = that.heightmap === 'heightmap.png';
      var o = {
        after: that.after,
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : (that.heightmap === 'influences' ? customInfluences : THREE.Terrain[that.heightmap]),
        material: blend,
        maxHeight: that.maxHeight - 100,
        minHeight: -100,
        steps: that.steps,
        stretch: true,
        turbulent: that.turbulent,
        useBufferGeometry: false,
        xSize: that.size,
        ySize: Math.round(that.size * that['width:length ratio']),
        xSegments: s,
        ySegments: Math.round(s * that['width:length ratio']),
        _mesh: typeof terrainScene === 'undefined' ? null : terrainScene.children[0], // internal only
      };
      scene.remove(terrainScene);
      terrainScene = THREE.Terrain(o);

      terrainScene.name = 'Terrain';
      applySmoothing(that.smoothing, o);
      scene.add(terrainScene);

      if (_o.environment.skyDome) {
        skyDome.visible = that.texture != 'Wireframe';
      }

      if (_o.environment.water) {
        water.visible = that.texture != 'Wireframe';
      }

      sand.visible = that.texture != 'Wireframe';
      sand.visible = false;

      var he = document.getElementById('heightmap');
      if (he) {
        o.heightmap = he;
        THREE.Terrain.toHeightmap(terrainScene.children[0].geometry.vertices, o);
      }

      lastOptions = o;

      that['Scatter meshes']();

      if (callback) {
        callback();
      }
    };


    this['Scatter meshes'] = function () {
      var s = parseInt(that.segments, 10),
        spread,
        randomness;
      var o = {
        xSegments: s,
        ySegments: Math.round(s * that['width:length ratio']),
      };
      if (that.scattering === 'Linear') {
        spread = that.spread * 0.0005;
        randomness = Math.random;
      } else if (that.scattering === 'Altitude') {
        spread = that.altitudeSpread;
      } else if (that.scattering === 'PerlinAltitude') {
        spread = (function () {
          var h = THREE.Terrain.ScatterHelper(THREE.Terrain.Perlin, o, 2, 0.125)(),
            hs = THREE.Terrain.InEaseOut(that.spread * 0.01);
          return function (v, k) {
            var rv = h[k],
              place = false;
            if (rv < hs) {
              place = true;
            } else if (rv < hs + 0.2) {
              place = THREE.Terrain.EaseInOut((rv - hs) * 5) * hs < Math.random();
            }
            return Math.random() < altitudeProbability(v.z) * 5 && place;
          };
        })();
      } else {
        spread = THREE.Terrain.InEaseOut(that.spread * 0.01) * (that.scattering === 'Worley' ? 1 : 0.5);
        randomness = THREE.Terrain.ScatterHelper(THREE.Terrain[that.scattering], o, 2, 0.125);
      }


      var geo = terrainScene.children[0].geometry;

      terrainScene.remove(decoScene);
      decoScene = THREE.Terrain.ScatterMeshes(geo, {
        mesh: mesh,
        w: s,
        h: Math.round(s * that['width:length ratio']),
        spread: spread,
        smoothSpread: that.scattering === 'Linear' ? 0 : 0.2,
        randomness: randomness,
        maxSlope: 0.6283185307179586, // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
        maxTilt: 0.15707963267948966, //  9deg or  9 / 180 * Math.PI. Trees grow up regardless of slope but we can allow a small variation
      });

      //this is putting the trees on.
      if (decoScene) {
        if (that.texture == 'Wireframe') {
          decoScene.children[0].material = decoMat;
        } else if (that.texture == 'Grayscale') {
          decoScene.children[0].material = gray;
        }
        terrainScene.add(decoScene);
      }


      console.log("dispatching event");
      scene.dispatchEvent('terrain_ready');
    };

  } //end of terrain settings object definition

}




//    ____                _             _
//   |  _ \ ___ _ __   __| | ___ _ __  | |    ___   ___  _ __
//   | |_) / _ \ '_ \ / _` |/ _ \ '__| | |   / _ \ / _ \| '_ \
//   |  _ <  __/ | | | (_| |  __/ |    | |__| (_) | (_) | |_) |
//   |_| \_\___|_| |_|\__,_|\___|_|    |_____\___/ \___/| .__/
//                                                      |_|

// If anything moves on its own, we need to call the render loop
// otherwise, things can can render() themselves when necessary


function animate(){

  requestAnimationFrame(render);

  render();
}

function render() {
  //if (_o.debug.silly)
    console.log('Renderer Loop');


  // if (controls && _o.controls.lock && controls.object !== camera)
  //   controls.object = camera;


  if (_o.renderCallbacks.length > 0) {
    _o.renderCallbacks.forEach(callback => {
      callback();
    });
  }

  renderer.render(scene, camera);

  // if controls needs updates, for example damping controls
  // controls.update();

  if (stats) {
    stats.update();
  }

}

function init() {
  if (_o.debug.info)
    console.log('Calling init()');

  animate();

}


//   _____                 _
//  | ____|_   _____ _ __ | |_ ___
//  |  _| \ \ / / _ \ '_ \| __/ __|
//  | |___ \ V /  __/ | | | |_\__ \
//  |_____| \_/ \___|_| |_|\__|___/
//


function onWindowResize(event) {
  setDimensions();
  updateThreeJSDimensions();
}

/**
 * If the container has non-zero margin, then probably
 * clientHeight and clientWidth is the useful writable area??
 */
function setDimensions() {
  if (container) {
    _o.width = container.clientWidth;
    _o.height = container.clientHeight;
  } else {
    _o.width = window.innerWidth;
    _o.height = window.innerHeight;
  }
}

function updateThreeJSDimensions() {

  renderer.setSize(_o.width, _o.height);
  renderer.setPixelRatio(window.devicePixelRatio);

  camera.aspect = _o.width / _o.height;
  camera.updateProjectionMatrix();

  //composer.reset();
}

if (_o.misc.resize_handler) {
  window.addEventListener('resize', onWindowResize, false);
}

function disposeThis() {

  window.removeEventListener('resize', onWindowResize, false);

}


//          _   _ _ _ _   _
//    _   _| |_(_) (_) |_(_) ___  ___
//   | | | | __| | | | __| |/ _ \/ __|
//   | |_| | |_| | | | |_| |  __/\__ \
//    \__,_|\__|_|_|_|\__|_|\___||___/
//



function mergeRecursive() {

  // _mergeRecursive does the actual job with two arguments.
  var _mergeRecursive = function (dst, src) {
    if (isDOMNode(src) || typeof src !== 'object' || src === null) {
      return dst;
    }

    for (var p in src) {
      if (!src.hasOwnProperty(p))
        continue;
      if (src[p] === undefined)
        continue;
      if (typeof src[p] !== 'object' || src[p] === null) {
        dst[p] = src[p];
      } else if (typeof dst[p] !== 'object' || dst[p] === null) {
        dst[p] = _mergeRecursive(src[p].constructor === Array ? [] : {}, src[p]);
      } else {
        _mergeRecursive(dst[p], src[p]);
      }
    }
    return dst;
  }

  // Loop through arguments and merge them into the first argument.
  var out = arguments[0];
  if (typeof out !== 'object' || out === null)
    return out;
  for (var i = 1, il = arguments.length; i < il; i++) {
    _mergeRecursive(out, arguments[i]);
  }
  return out;
}

function isDOMNode(v) {
  if (v === null) return false;
  if (typeof v !== 'object') return false;
  if (!('nodeName' in v)) return false;

  var nn = v.nodeName;
  try {
    // DOM node property nodeName is readonly.
    // Most browsers throws an error...
    v.nodeName = 'is readonly?';
  } catch (e) {
    // ... indicating v is a DOM node ...
    return true;
  }
  // ...but others silently ignore the attempt to set the nodeName.
  if (v.nodeName === nn) return true;
  // Property nodeName set (and reset) - v is not a DOM node.
  v.nodeName = nn;

  return false;
}

// function mergeRecursive(obj1, obj2) {
//   if (Array.isArray(obj2)) { return obj1.concat(obj2); }
//   for (var p in obj2) {
//     try {
//       // Property in destination object set; update its value.
//       if ( obj2[p].constructor==Object ) {
//         obj1[p] = mergeRecursive(obj1[p], obj2[p]);
//       } else if (Array.isArray(obj2[p])) {
//         obj1[p] = obj1[p].concat(obj2[p]);
//       } else {
//         obj1[p] = obj2[p];
//       }
//     } catch(e) {
//       // Property in destination object not set; create it and set its value.
//       obj1[p] = obj2[p];
//     }
//   }
//   return obj1;
// }


// Debug objects

function makeBasicPlane() {


  var planeGroup = new THREE.Object3D();

  var geometry = new THREE.PlaneGeometry(1000, 1000, 32);
  var material = new THREE.MeshBasicMaterial({
    color: 0xDDDDDD,
    side: THREE.DoubleSide
  });
  var plane = new THREE.Mesh(geometry, material);

  plane.rotation.x = -0.5 * Math.PI;

  plane.name = 'Basic Plane (child)';
  planeGroup.add(plane);


  var axisGroup = new THREE.Object3D();
  axisGroup.name = 'Axis Group';
  planeGroup.add(axisGroup);

  addDebugOriginLinesToObject(axisGroup);

  planeGroup.name = 'Basic Plane';

  return planeGroup;

}



/**
 * 
 * @param {Oject3d} o add red x axis, green y, and blue z andx
 * attach to object as child
 */
function addDebugOriginLinesToObject(o) {


  var extents = 1000;

  var lineGeoX = new THREE.Geometry();
  lineGeoX.vertices.push(
    v(-extents, 0, 0), v(extents, 0, 0)
  );

  var lineGeoY = new THREE.Geometry();
  lineGeoY.vertices.push(
    v(0, -extents, 0), v(0, extents, 0)
  );

  var lineGeoZ = new THREE.Geometry();
  lineGeoZ.vertices.push(
    v(0, 0, -extents), v(0, 0, extents)
  );

  var lineMatX = new THREE.LineBasicMaterial({
    color: 0xFF0000,
    linewidth: 1
  });

  var lineMatY = new THREE.LineBasicMaterial({
    color: 0x00FF00,
    linewidth: 1
  });

  var lineMatZ = new THREE.LineBasicMaterial({
    color: 0x0000FF,
    linewidth: 1
  });

  var lineX = new THREE.Line(lineGeoX, lineMatX);
  lineX.type = THREE.Lines;

  var lineY = new THREE.Line(lineGeoY, lineMatY);
  lineY.type = THREE.Lines;

  var lineZ = new THREE.Line(lineGeoZ, lineMatZ);
  lineZ.type = THREE.Lines;


  lineX.name = 'X axis';
  lineY.name = 'Y axis';
  lineZ.name = 'Z axis';

  o.add(lineX);
  o.add(lineY);
  o.add(lineZ);
}




function getDebugCube() {

  var length = 1500;

  var lineGeoX = new THREE.Geometry();
  lineGeoX.vertices.push(
    v(-length, 0, 0), v(length, 0, 0)
  );

  var lineGeoY = new THREE.Geometry();
  lineGeoY.vertices.push(
    v(0, -length, 0), v(0, length, 0)
  );

  var lineGeoZ = new THREE.Geometry();
  lineGeoZ.vertices.push(
    v(0, 0, -length), v(0, 0, length)
  );

  var lineMatX = new THREE.LineBasicMaterial({
    color: 0xFF0000,
    linewidth: 1
  });

  var lineMatY = new THREE.LineBasicMaterial({
    color: 0x00FF00,
    linewidth: 1
  });

  var lineMatZ = new THREE.LineBasicMaterial({
    color: 0x0000FF,
    linewidth: 1
  });

  var lineX = new THREE.Line(lineGeoX, lineMatX);
  lineX.type = THREE.Lines;

  var lineY = new THREE.Line(lineGeoY, lineMatY);
  lineY.type = THREE.Lines;

  var lineZ = new THREE.Line(lineGeoZ, lineMatZ);
  lineZ.type = THREE.Lines;


  lineZ.name = 'Z axis on cube';

  var cubeGeom = new THREE.CubeGeometry(50, 50, 50);

  var c0 = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 72, 6, 1, false));
  c0.position.y = 60;
  // var g = new THREE.Geometry();
  cubeGeom.merge(c0.geometry, c0.matrix);

  litCube = new THREE.Mesh(
    cubeGeom,
    new THREE.MeshLambertMaterial({
      color: 0xFFFFFF
    }));
  litCube.position.x = 0;
  litCube.position.y = 0;
  litCube.position.z = 0;

  litCube.add(lineX);
  litCube.add(lineY);
  litCube.add(lineZ);

  litCube.linegroup = new THREE.Group();
  litCube.add(litCube.linegroup);

  litCube.name = 'LitCube';

  return litCube;
}

function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function v2(x, y) {
  return new THREE.Vector2(x, y);
}


//    _____                   _         _   _ _   _ _
//   |_   _|__ _ __ _ __ __ _(_)_ __   | | | | |_(_) |___
//     | |/ _ \ '__| '__/ _` | | '_ \  | | | | __| | / __|
//     | |  __/ |  | | | (_| | | | | | | |_| | |_| | \__ \
//     |_|\___|_|  |_|  \__,_|_|_| |_|  \___/ \__|_|_|___/
//




function applySmoothing(smoothing, o) {
  var m = terrainScene.children[0];
  var g = m.geometry.vertices;
  if (smoothing === 'Conservative (0.5)') THREE.Terrain.SmoothConservative(g, o, 0.5);
  if (smoothing === 'Conservative (1)') THREE.Terrain.SmoothConservative(g, o, 1);
  if (smoothing === 'Conservative (10)') THREE.Terrain.SmoothConservative(g, o, 10);
  else if (smoothing === 'Gaussian (0.5, 7)') THREE.Terrain.Gaussian(g, o, 0.5, 7);
  else if (smoothing === 'Gaussian (1.0, 7)') THREE.Terrain.Gaussian(g, o, 1, 7);
  else if (smoothing === 'Gaussian (1.5, 7)') THREE.Terrain.Gaussian(g, o, 1.5, 7);
  else if (smoothing === 'Gaussian (1.0, 5)') THREE.Terrain.Gaussian(g, o, 1, 5);
  else if (smoothing === 'Gaussian (1.0, 11)') THREE.Terrain.Gaussian(g, o, 1, 11);
  else if (smoothing === 'GaussianBox') THREE.Terrain.GaussianBoxBlur(g, o, 1, 3);
  else if (smoothing === 'Mean (0)') THREE.Terrain.Smooth(g, o, 0);
  else if (smoothing === 'Mean (1)') THREE.Terrain.Smooth(g, o, 1);
  else if (smoothing === 'Mean (8)') THREE.Terrain.Smooth(g, o, 8);
  else if (smoothing === 'Median') THREE.Terrain.SmoothMedian(g, o);
  THREE.Terrain.Normalize(m, o);
}




function buildTree() {
  var material = [
    new THREE.MeshLambertMaterial({
      color: 0x3d2817
    }), // brown
    new THREE.MeshLambertMaterial({
      color: 0x2d4c1e
    }), // green
  ];

  var c0 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6, 1, true));
  c0.position.y = 6;
  var c1 = new THREE.Mesh(new THREE.CylinderGeometry(0, 10, 14, 8));
  c1.position.y = 18;
  var c2 = new THREE.Mesh(new THREE.CylinderGeometry(0, 9, 13, 8));
  c2.position.y = 25;
  var c3 = new THREE.Mesh(new THREE.CylinderGeometry(0, 8, 12, 8));
  c3.position.y = 32;

  var g = new THREE.Geometry();
  c0.updateMatrix();
  c1.updateMatrix();
  c2.updateMatrix();
  c3.updateMatrix();
  g.merge(c0.geometry, c0.matrix);
  g.merge(c1.geometry, c1.matrix);
  g.merge(c2.geometry, c2.matrix);
  g.merge(c3.geometry, c3.matrix);

  var b = c0.geometry.faces.length;
  for (var i = 0, l = g.faces.length; i < l; i++) {
    g.faces[i].materialIndex = i < b ? 0 : 1;
  }

  var m = new THREE.Mesh(g, material);

  m.name = "Tree";

  m.scale.x = m.scale.z = 5;
  m.scale.y = 1.25;
  return m;
}




function addDebugOriginLines() {



  var lineGeoX = new THREE.Geometry();
  lineGeoX.vertices.push(
    v(-5000, 0, 0), v(5000, 0, 0)
  );

  var lineGeoY = new THREE.Geometry();
  lineGeoY.vertices.push(
    v(0, -5000, 0), v(0, 5000, 0)
  );

  var lineGeoZ = new THREE.Geometry();
  lineGeoZ.vertices.push(
    v(0, 0, -5000), v(0, 0, 5000)
  );

  var lineMatX = new THREE.LineBasicMaterial({
    color: 0xFF0000,
    linewidth: 1
  });

  var lineMatY = new THREE.LineBasicMaterial({
    color: 0x00FF00,
    linewidth: 1
  });

  var lineMatZ = new THREE.LineBasicMaterial({
    color: 0x0000FF,
    linewidth: 1
  });

  var lineX = new THREE.Line(lineGeoX, lineMatX);
  lineX.type = THREE.Lines;

  var lineY = new THREE.Line(lineGeoY, lineMatY);
  lineY.type = THREE.Lines;

  var lineZ = new THREE.Line(lineGeoZ, lineMatZ);
  lineZ.type = THREE.Lines;


  lineX.name = 'X axis';
  lineY.name = 'Y axis';
  lineZ.name = 'Z axis';

  scene.add(lineX);
  scene.add(lineY);
  scene.add(lineZ);
}



function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getColFromV(vec) {
  return (vec.x * 255 * 0x10000) + (vec.y * 255 * 0x100) + (vec.z * 255)
}




function _round(number, precision = 2) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}


function getRadialLine(angle, length = 100, color = 0x0000FF) {


  var lineXXXX;
  var lineGeoX = new THREE.Geometry();

  lineGeoX.vertices.push(
    v(0, 0, 0), v(0, 0, 500)
  );

  var lineMatX = new THREE.LineBasicMaterial({
    color: 0xFF0000,
    linewidth: 1
  });

  lineXXXX = new THREE.Line(lineGeoX, lineMatX);
  lineXXXX.type = THREE.Lines;

  // lineXXXX.position.x = centrepoint.x;
  // lineXXXX.position.y = centrepoint.y;
  // lineXXXX.position.z = centrepoint.z;

  if (angle)
    lineXXXX.rotation.y = angle;

  lineXXXX.name = 'DEBUG radial LINE';

  return lineXXXX;

}


function getRandVectorXZ(minx = -300, maxx = 300, minz = -300, maxz = 300) {
  var posx = Math.random() > 0.5 ? Math.random() * minx : Math.random() * maxx;
  var posz = Math.random() > 0.5 ? Math.random() * minz : Math.random() * maxz;
  return new THREE.Vector3(posx, 0, posz);
}

function getVertLine(position, length = 100, color = 0x00FF00, timeout = 5000) {

  var lineXXXX;
  var lineGeoX = new THREE.Geometry();


  lineGeoX.vertices.push(
    v(0, -length, 0), v(0, length, 0)
  );



  var lineMatX = new THREE.LineBasicMaterial({
    color: color ? color : _c_color(),
    linewidth: 1
  });

  lineXXXX = new THREE.Line(lineGeoX, lineMatX);
  lineXXXX.type = THREE.Lines;

  // lineXXXX.position.x = centrepoint.x;
  // lineXXXX.position.y = centrepoint.y;
  // lineXXXX.position.z = centrepoint.z;

  lineXXXX.name = 'DEBUG LINE';

  if (position) {
    lineXXXX.position.x = position.x;
    lineXXXX.position.z = position.z;
  }

  setTimeout(function () {
    scene.remove(lineXXXX);
  }, timeout);


  return lineXXXX;
}

var lineXXXX;

function drawLine(centrepoint, lineaxis) {


  scene.remove(lineXXXX);

  var lineGeoX = new THREE.Geometry();


  var minusx = lineaxis.clone().multiplyScalar(-5000);
  var plusx = lineaxis.clone().multiplyScalar(5000);

  lineGeoX.vertices.push(
    minusx, plusx
  );



  var lineMatX = new THREE.LineBasicMaterial({
    color: 0xFF0000,
    linewidth: 1
  });

  lineXXXX = new THREE.Line(lineGeoX, lineMatX);
  lineXXXX.type = THREE.Lines;

  lineXXXX.position.x = centrepoint.x;
  lineXXXX.position.y = centrepoint.y;
  lineXXXX.position.z = centrepoint.z;

  lineXXXX.name = 'DEBUG LINE';

  scene.add(lineXXXX);
}

var lineXXXY;

function drawLine2Points(firstpoint, secondpoint) {


  scene.remove(lineXXXY);

  var lineGeoX = new THREE.Geometry();


  lineGeoX.vertices.push(
    firstpoint, secondpoint
  );



  var lineMatX = new THREE.LineBasicMaterial({
    color: 0x00FF00,
    linewidth: 1
  });

  lineXXXY = new THREE.Line(lineGeoX, lineMatX);
  lineXXXY.type = THREE.Lines;

  // lineXXXY.position.x = centrepoint.x;
  // lineXXXY.position.y = centrepoint.y;
  // lineXXXY.position.z = centrepoint.z;

  lineXXXY.name = 'DEBUG LINE2';

  scene.add(lineXXXY);
}