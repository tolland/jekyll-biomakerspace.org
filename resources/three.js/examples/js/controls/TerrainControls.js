/**
 *  designed to prevent the camera or some other object
 * panning, zomming or rotating through Terrain object layers
 * 
 * keep the observer, "in game" or "on set" as it were
 */

THREE.TerrainControls = function (object, terrain, domElement) {

  var scope = this;
  this.object = object;
  this.terrain = terrain;


  this.domElement = (domElement !== undefined) ? domElement : document;

  var raycaster = new THREE.Raycaster();

  var down = new THREE.Vector3(0, -1, 0);

  // this.removeEventListener ( type, listener )

  function onPositionChange(o) {

    console.log("position changed in object");
    console.log(o);
    var opos = o.target.object.position;

    raycaster.set(opos, down);

    intersects = raycaster.intersectObjects(scene.children, true);
    intersects.forEach(element => {
      console.log(element)

      if (element.distance < 5) {
        o.target.object.position.y += 5;
      }

    });



  }

  controls.addEventListener('change', onPositionChange);


  //this.object.addEventListener('change', onPositionChange);

  //this.object.onChange(onPositionChange);



}