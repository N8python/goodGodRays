import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';
import { EffectComposer } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/RenderPass.js';
import { FullScreenQuad } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/Pass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/ShaderPass.js';
import { VerticalBlurShader } from 'https://unpkg.com/three@0.137.0/examples/jsm/shaders/VerticalBlurShader.js';
import { HorizontalBlurShader } from 'https://unpkg.com/three@0.137.0/examples/jsm/shaders/HorizontalBlurShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/SMAAPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.137.0/examples/jsm/shaders/GammaCorrectionShader.js';
import { EffectShader } from "./EffectShader.js";
import { EffectCompositer } from "./EffectCompositer.js";
import { OrbitControls } from 'https://unpkg.com/three@0.137.0/examples/jsm/controls/OrbitControls.js';
import { TeapotGeometry } from 'https://unpkg.com/three@0.137.0/examples/jsm/geometries/TeapotGeometry.js';
import { AssetManager } from './AssetManager.js';
import { Stats } from "./stats.js";
import { GUI } from 'https://unpkg.com/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js';
async function main() {
    // Setup basic renderer, controls, and profiler
    const clientWidth = window.innerWidth;
    const clientHeight = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(50, 75, 50);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(clientWidth, clientHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 25, 0);
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    // Setup scene
    // Skybox
    const environment = new THREE.CubeTextureLoader().load([
        "skybox/Box_Right.bmp",
        "skybox/Box_Left.bmp",
        "skybox/Box_Top.bmp",
        "skybox/Box_Bottom.bmp",
        "skybox/Box_Front.bmp",
        "skybox/Box_Back.bmp"
    ]);
    scene.background = environment;
    // Lighting
    const ambientLight = new THREE.AmbientLight(new THREE.Color(1.0, 1.0, 1.0), 0.25);
    //scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.35);
    directionalLight.position.set(150, 200, 50);
    // Shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -75;
    directionalLight.shadow.camera.right = 75;
    directionalLight.shadow.camera.top = 75;
    directionalLight.shadow.camera.bottom = -75;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.blurSamples = 8;
    directionalLight.shadow.radius = 4;
    //scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.15);
    directionalLight2.color.setRGB(1.0, 1.0, 1.0);
    directionalLight2.position.set(-50, 200, -150);
    //scene.add(directionalLight2);
    // Objects
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100).applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
    ground.castShadow = true;
    ground.receiveShadow = true;
    // scene.add(ground);
    const box = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, color: new THREE.Color(1.0, 0.0, 0.0) }));
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.y = 5.01;
    //  scene.add(box);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(6.25, 32, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, metalness: 1.0, roughness: 0.25 }));
    sphere.position.y = 7.5;
    sphere.position.x = 25;
    sphere.position.z = 25;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    // scene.add(sphere);
    const torusKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, metalness: 0.5, roughness: 0.5, color: new THREE.Color(0.0, 1.0, 0.0) }));
    torusKnot.position.y = 10;
    torusKnot.position.x = -25;
    torusKnot.position.z = -25;
    torusKnot.castShadow = true;
    torusKnot.receiveShadow = true;
    //  scene.add(torusKnot);
    const dragonGeo = (await AssetManager.loadGLTFAsync("dragon.glb")).scene.children[0].children[0].geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2)).applyMatrix4(new THREE.Matrix4().makeScale(1.75, 1.75, 1.75));
    const dragon2 = new THREE.Mesh(dragonGeo,
        new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, metalness: 0.5, roughness: 0.2, color: new THREE.Color(1.0, 0.0, 0.0) }));
    dragon2.position.x = 80;
    dragon2.rotation.y = Math.PI / 2;
    dragon2.castShadow = true;
    dragon2.receiveShadow = true;
    scene.add(dragon2);
    const bunnyGeo = (await AssetManager.loadGLTFAsync("bunny.glb")).scene.children[0].children[0].geometry;
    const bunny = new THREE.Mesh(bunnyGeo.applyMatrix4(new THREE.Matrix4().makeScale(0.075 / 2, 0.075 / 2, 0.075 / 2)).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 9, 0)), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, metalness: 0.5, roughness: 0.2, color: new THREE.Color(0.0, 0.0, 1.0) }));
    bunny.position.x = -85;
    bunny.castShadow = true;
    bunny.receiveShadow = true;
    scene.add(bunny);
    const teapotGeo = new TeapotGeometry().applyMatrix4(new THREE.Matrix4().makeScale(0.25, 0.25, 0.25)).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0));
    const teapot1 = new THREE.Mesh(teapotGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
    teapot1.position.x = 0;
    //teapot1.scale.set(0.5, 0.5, 0.5);
    teapot1.castShadow = true;
    teapot1.receiveShadow = true;
    //scene.add(teapot1);
    const teapot2 = new THREE.Mesh(teapotGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
    teapot2.position.x = -40;
    teapot2.scale.set(0.5, 0.5, 0.5);
    //scene.add(teapot2);

    // Build postprocessing stack
    // Render Targets
    const sponza = (await AssetManager.loadGLTFAsync("sponza.glb")).scene;
    sponza.traverse(object => {
        if (object.material) {
            object.material.envMap = environment;
            object.material.envMapIntensity = 0.05;
            object.material.dithering = true;
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
    sponza.scale.set(10, 10, 10)
    scene.add(sponza);
    const defaultTexture = new THREE.WebGLRenderTarget(clientWidth, clientHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    });
    defaultTexture.depthTexture = new THREE.DepthTexture(clientWidth, clientHeight, THREE.FloatType);
    const godraysTexture = new THREE.WebGLRenderTarget(clientWidth / 2, clientHeight / 2, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.FloatType
    });
    godraysTexture.depthTexture = new THREE.DepthTexture(clientWidth / 2, clientHeight / 2, THREE.FloatType);
    const godraysBlurTexture = godraysTexture.clone();
    // Post Effects
    const composer = new EffectComposer(renderer);
    const smaaPass = new SMAAPass(clientWidth, clientHeight);
    const effectCompositer = new ShaderPass(EffectCompositer);
    composer.addPass(effectCompositer);
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    composer.addPass(smaaPass);
    const light = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial());
    light.position.set(0, 50, 0);
    scene.add(light);
    const cubeRenderTargetDepth = new THREE.WebGLCubeRenderTarget(512, {
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        maxFilter: THREE.NearestFilter
    });
    const cubeCameraDepth = new THREE.CubeCamera(0.1, 1000, cubeRenderTargetDepth);
    scene.add(cubeCameraDepth);
    const customMeshDepth = new THREE.ShaderMaterial({
        uniforms: {
            lightPos: { value: light.position }
        },
        vertexShader: /*glsl*/ `
        varying vec3 vPosition;
        void main() { 
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: /*glsl*/ `
        varying vec3 vPosition;
        uniform vec3 lightPos;
        void main() {
            float lightDistance = length(vPosition - lightPos);
            gl_FragColor = vec4(lightDistance / 1000.0, 0.0, 0.0, 1.0);
        }
        `
    });
    const lightDepthFallback = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 32), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    // scene.add(lightDepthFallback);
    const pointLight = new THREE.PointLight(new THREE.Color(1.0, 1.0, 1.0), 5, 200);
    pointLight.position.copy(light.position);
    pointLight.castShadow = true;
    //pointLight.shadow.bias = -0.005;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    scene.add(pointLight);
    let frame = 0;
    const effectQuad = new FullScreenQuad(new THREE.ShaderMaterial(EffectShader));
    const verticalBlur = new FullScreenQuad(new THREE.ShaderMaterial(VerticalBlurShader));
    verticalBlur.material.uniforms.v.value = 0.25 / (clientHeight / 2.0);
    const horizontalBlur = new FullScreenQuad(new THREE.ShaderMaterial(HorizontalBlurShader));
    horizontalBlur.material.uniforms.h.value = 0.25 / (clientWidth / 2.0);
    const effectPass = effectQuad.material;
    const gui = new GUI();
    const effectController = {
        edgeStrength: 2,
        edgeRadius: 2,
        distanceAttenuation: 0.005,
        density: 1.0 / 128.0
    }
    gui.add(effectController, "density", 0, 1.0 / 16.0, 0.0001).name("Density");
    gui.add(effectController, "distanceAttenuation", 0, 0.1, 0.0001).name("Distance Attenuation");
    gui.add(effectController, "edgeStrength", 0, 8, 0.001).name("Edge Strength");
    gui.add(effectController, "edgeRadius", 0, 4, 1.0).name("Edge Radius");
    const noiseTex = await new THREE.TextureLoader().loadAsync("bluenoise.png");
    noiseTex.wrapS = THREE.RepeatWrapping;
    noiseTex.wrapT = THREE.RepeatWrapping;
    noiseTex.magFilter = THREE.NearestFilter;
    noiseTex.minFilter = THREE.NearestFilter;

    function animate() {
        if (frame === 0) {
            /* lightDepthFallback.position.copy(light.position);
             scene.overrideMaterial = customMeshDepth;
             cubeCameraDepth.position.copy(light.position);
             light.visible = false;
             lightDepthFallback.visible = true;
             //console.log(renderer.getClearColor(new THREE.Vector3()));
             renderer.setClearColor(new THREE.Color(1.0, 0.0, 0.0), 1.0);
             cubeCameraDepth.update(renderer, scene);
             renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 1.0);
             //scene.background = cubeRenderTargetDepth.texture;
             light.visible = true;
             lightDepthFallback.visible = false;
             scene.overrideMaterial = null;*/
        }
        light.position.y = 50.0 + 10.0 * Math.sin(performance.now() / 2500);
        pointLight.position.copy(light.position);
        if (frame === 0) {
            renderer.shadowMap.needsUpdate = true;
        } else {
            renderer.shadowMap.needsUpdate = true;
        }
        renderer.setRenderTarget(defaultTexture);
        renderer.clear();
        renderer.render(scene, camera);
        effectPass.uniforms["sceneDiffuse"].value = defaultTexture.texture;
        effectPass.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
        effectPass.uniforms["depthCube"].value = pointLight.shadow.map.texture;
        camera.updateMatrixWorld();
        effectPass.uniforms["projectionMatrixInv"].value = camera.projectionMatrixInverse;
        effectPass.uniforms["viewMatrixInv"].value = camera.matrixWorld;
        effectPass.uniforms["lightPos"].value = light.position;
        effectPass.uniforms['resolution'].value = new THREE.Vector2(godraysTexture.width, godraysTexture.height);
        effectPass.uniforms['noiseResolution'].value = new THREE.Vector2(noiseTex.image.width, noiseTex.image.height);
        effectPass.uniforms['time'].value = performance.now() / 1000;
        effectPass.uniforms["cameraPos"].value = camera.position;
        effectPass.uniforms['mapSize'].value = pointLight.shadow.mapSize.height;
        effectPass.uniforms["near"].value = pointLight.shadow.camera.near;
        effectPass.uniforms["far"].value = pointLight.shadow.camera.far;
        effectPass.uniforms["blueNoise"].value = noiseTex;
        effectPass.uniforms["density"].value = effectController.density;
        effectPass.uniforms["distanceAttenuation"].value = effectController.distanceAttenuation;
        renderer.setRenderTarget(godraysTexture);
        effectQuad.render(renderer);
        renderer.setRenderTarget(godraysBlurTexture);
        /*  horizontalBlur.material.uniforms.tDiffuse.value = godraysTexture.texture;
          horizontalBlur.render(renderer);
          renderer.setRenderTarget(godraysTexture);
          verticalBlur.material.uniforms.tDiffuse.value = godraysBlurTexture.texture;
          verticalBlur.render(renderer);*/
        effectCompositer.uniforms["sceneDiffuse"].value = defaultTexture.texture;
        effectCompositer.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
        effectCompositer.uniforms["resolution"].value = new THREE.Vector2(clientWidth, clientHeight);
        effectCompositer.uniforms["edgeRadius"].value = effectController.edgeRadius;
        effectCompositer.uniforms["edgeStrength"].value = effectController.edgeStrength;
        effectCompositer.uniforms["godrays"].value = godraysTexture.texture;
        renderer.setRenderTarget(null);
        composer.render();
        controls.update();
        stats.update();
        requestAnimationFrame(animate);
        frame++;
    }
    requestAnimationFrame(animate);
}
main();