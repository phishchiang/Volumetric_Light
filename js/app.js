import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

import fragment from "./shader/pp_volumetric_light/fragment.glsl";
import vertex from "./shader/pp_volumetric_light/vertex.glsl";
import pp_volumetric_light_fs from "./shader/post/pp_volumetric_light_fs.glsl";
import pp_chromatic_aberration_fs from "./shader/post/pp_chromatic_aberration_fs.glsl";
import rays_model from "../rays.glb";
import * as dat from "dat.gui";
import gsap from "gsap";
import arrow_01 from "../arrow_01.fbx";
import nyancat from "../nyancat.jpg";
import nyancat_mp3 from "../nyancat.mp3";



export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000, 1); 
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderConfig({ type: 'js' });
    this.dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'); // use a full url path
    this.loader.setDRACOLoader(this.dracoLoader);

    this.count = 0;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    
    
    var frustumSize = 1;
    var aspect = 1;
    this.camera_post = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    // this.camera_post = new THREE.PerspectiveCamera(
    //   70,
    //   window.innerWidth / window.innerHeight,
    //   0.01,
    //   1000
    // );
    // this.camera_post.position.set(0, 0, 500);


    this.camera.position.set(0, 0, 2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.time = 0;

    this.isPlaying = true;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.listener = new THREE.AudioListener();
    this.camera.add( this.listener );

    // create an Audio source
    this.sound = new THREE.Audio( this.listener );
    this.audioLoader = new THREE.AudioLoader();
    this.audioLoader.load( nyancat_mp3, (buffer) => {
      this.sound.setBuffer( buffer );
      this.sound.setLoop(true);
      this.sound.setVolume(0.5);
      // this.sound.play();
    });

    // create an AudioAnalyser, passing in the sound and desired fftSize
    this.analyser = new THREE.AudioAnalyser( this.sound, 32 );

    this.addObjects();
    this.initPost();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
    this.addLights();
    this.audioPlay();

    this.loader.load(rays_model, (gltf => {
      this.model = gltf.scene;
      this.model.traverse((mesh)=>{
        if(mesh.isMesh){
          mesh.material = this.material;
        }
      })
      // this.scene.add(this.model);
    }))


    const fbx_loader = new FBXLoader();
    fbx_loader.load( arrow_01, ( object ) => {
      this.fbx = object.children[0]
      this.fbx.traverse((mesh)=>{
        if(mesh.isMesh) mesh.material = this.material;
      })
      // this.scene.add(this.fbx);
    });

    // console.log(nyancat);
    
    // this.render = this.render.bind(this);
  }
  audioPlay(){
    window.addEventListener('click', (event) => {
      event.preventDefault(); 
      if(!this.sound.isPlaying){
        this.sound.play();
        console.log('stop');
        this.material.uniforms.u_is_play.value = 1;
      }else{
        this.sound.stop();
        console.log('playing');
        this.material.uniforms.u_is_play.value = 0;
      }
      
    });
  }

  initPost(){
    this.render_target_01 = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    
    this.material_pp_volumetric_light = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        u_map: { value: null },
        progress: { value: 0.6 },
        t_audio_data: { value: new THREE.DataTexture( this.analyser.data, 16, 1, THREE.RedFormat)},
      },
      vertexShader: vertex,
      fragmentShader: pp_volumetric_light_fs
    });
    this.mesh_pp_volumetric_light = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), this.material_pp_volumetric_light);
    this.scene_pp_volumetric_light = new THREE.Scene();
    this.scene_pp_volumetric_light.add(this.mesh_pp_volumetric_light);

    this.render_texture_02 = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    this.material_pp_chromatic_aberration = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        u_map: { value: null },
        tDiffuse: {value: null},
        resolution: {value: null},
        uTime: {value: 0},
      },
      vertexShader: vertex,
      fragmentShader: pp_chromatic_aberration_fs
    });

    this.mesh_pp_chromatic_aberration = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), this.material_pp_chromatic_aberration);
    this.scene_pp_chromatic_aberration = new THREE.Scene();
    this.scene_pp_chromatic_aberration.add(this.mesh_pp_chromatic_aberration);
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0.6,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 2, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 1;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;


    this.camera.updateProjectionMatrix();


  }

  addLights() {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  addObjects() {
    let that = this;

    let texture_nyancat = new THREE.TextureLoader().load(nyancat);
    texture_nyancat.wrapS = texture_nyancat.wrapT = THREE.RepeatWrapping;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        u_map: { value: texture_nyancat },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
        u_is_play: { value: 0 },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    

    
    this.geometry = new THREE.SphereBufferGeometry(1, 30, 30);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.progress.value = this.settings.progress;
    requestAnimationFrame(this.render.bind(this));
    // requestAnimationFrame(this.render);
    this.controls.update();
    this.material_pp_volumetric_light.uniforms.progress.value = this.settings.progress;

    this.analyser.getFrequencyData();
    this.material_pp_volumetric_light.uniforms.t_audio_data.value.needsUpdate = true;
    
    this.mesh.rotation.y = -this.time/30;

    // Original Render
    this.renderer.setRenderTarget(this.render_target_01);
    this.renderer.render(this.scene, this.camera); // OUT for original render
    this.material_pp_volumetric_light.uniforms.u_map.value = this.render_target_01.texture; // IN for 1st pass render texture
    
    // 1st Render Pass for Volumetric_Light
    this.renderer.setRenderTarget(this.render_texture_02);
    this.renderer.render(this.scene_pp_volumetric_light, this.camera_post); // OUT for 1st pass render
    this.material_pp_chromatic_aberration.uniforms.tDiffuse.value = this.render_texture_02.texture; // IN for 2nd pass render texture
    
    // 2nd Render Pass for Chromatic_Aberration
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene_pp_chromatic_aberration, this.camera_post); // OUT for final 2nd pass render
  }
}

new Sketch({
  dom: document.getElementById("container")
});
