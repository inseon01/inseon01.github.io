import * as THREE from 'three';  

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// main scene
const scene = new THREE.Scene();
scene.backgroundColor = 0x000000;  // white background

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 120;
camera.position.y = 60;
camera.position.z = 180;
camera.lookAt(scene.position);
scene.add(camera);

// setup the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// add Stats: 현재 FPS를 보여줌으로써 rendering 속도 표시
const stats = new Stats();
document.body.appendChild(stats.dom);

// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const gui = new GUI();

const folder0 = gui.addFolder('Camera');
const folder0Params = {
    currentCamera: 'Perspective',
    switchCameraType: function() {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            folder0Params.currentCamera = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            folder0Params.currentCamera = "Perspective";
        }
    }
};
folder0.add(folder0Params, 'switchCameraType');
folder0.add(folder0Params, 'currentCamera').listen();

const folder1 = gui.addFolder('Mercury');
const folder1Params = {
    rotationSpeed: 0.02,
    orbitSpeed: 0.02
};
folder1.add(folder1Params, 'rotationSpeed', 0, 0.1);
folder1.add(folder1Params, 'orbitSpeed', 0, 0.1);

const folder2 = gui.addFolder('Venus');
const folder2Params = {
    rotationSpeed: 0.015,
    orbitSpeed: 0.015
};
folder2.add(folder2Params, 'rotationSpeed', 0, 0.1);
folder2.add(folder2Params, 'orbitSpeed', 0, 0.1);

const folder3 = gui.addFolder('Earth');
const folder3Params = {
    rotationSpeed: 0.01,
    orbitSpeed: 0.01
};
folder3.add(folder3Params, 'rotationSpeed', 0, 0.1);
folder3.add(folder3Params, 'orbitSpeed', 0, 0.1);

const folder4 = gui.addFolder('Mars');
const folder4Params = {
    rotationSpeed: 0.008,
    orbitSpeed: 0.008
};
folder4.add(folder4Params, 'rotationSpeed', 0, 0.1);
folder4.add(folder4Params, 'orbitSpeed', 0, 0.1);


// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// add ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(5, 12, 8); // 여기서 부터 (0, 0, 0) 방향으로 light ray 방향
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();
const mercuryTexture = textureLoader.load('Mercury.jpg');
const venusTexture = textureLoader.load('Venus.jpg');
const earthTexture = textureLoader.load('Earth.jpg');
const marsTexture = textureLoader.load('Mars.jpg');

const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffff00,
    emissiveIntensity: 1,
    roughness: 1,
    metalness: 0
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const mercuryOrbit = new THREE.Object3D();
const venusOrbit = new THREE.Object3D();
const earthOrbit = new THREE.Object3D();
const marsOrbit = new THREE.Object3D();
scene.add(mercuryOrbit, venusOrbit, earthOrbit, marsOrbit);

const mercuryGeometry = new THREE.SphereGeometry(1.5);
const mercuryMaterial = new THREE.MeshStandardMaterial({
    map: mercuryTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.position.set(20, 0, 0);
mercuryOrbit.add(mercury);

const venusGeometry = new THREE.SphereGeometry(3);
const venusMaterial = new THREE.MeshStandardMaterial({
    map: venusTexture,
    roughness: 0.8,
    metalness: 0.2
});
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.position.set(35, 0, 0);
venusOrbit.add(venus);

const earthGeometry = new THREE.SphereGeometry(3.5);
const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(50, 0, 0);
earthOrbit.add(earth);

const marsGeometry = new THREE.SphereGeometry(2.5);
const marsMaterial = new THREE.MeshStandardMaterial({
    map: marsTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.position.set(65, 0, 0);
marsOrbit.add(mars);

function animate() {

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    stats.update();
    orbitControls.update();

    mercury.rotation.y += folder1Params.rotationSpeed;
    mercuryOrbit.rotation.y += folder1Params.orbitSpeed;

    venus.rotation.y += folder2Params.rotationSpeed;
    venusOrbit.rotation.y += folder2Params.orbitSpeed;

    earth.rotation.y += folder3Params.rotationSpeed;
    earthOrbit.rotation.y += folder3Params.orbitSpeed;

    mars.rotation.y += folder4Params.rotationSpeed;
    marsOrbit.rotation.y += folder4Params.orbitSpeed;

    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    renderer.render(scene, camera);

    // 다음 frame을 위해 requestAnimationFrame 호출 
    requestAnimationFrame(animate);
}

animate();





