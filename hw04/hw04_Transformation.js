/*-------------------------------------------------------------------------
08_Transformation.js

Sun (Red)
- canvas의 중심인 원점에 위치한 edge length=0.2인 정사각형
- 45 degree/sec 속도로 자전 => RTS
- red color

Earth (Cyan)
- edge length=0.1인 정사각형
- 180 degree/sec 속도로 자전
- 30 degree/sec 속도로 sun을 중심으로 0.7 떨어져 공전

Moon (Yellow)
- edge length=0.05인 정사각형
- 180 degree/sec 속도로 자전
- 360 degree/sec 속도로 earth를 중심으로 0.2 떨어져 공전
---------------------------------------------------------------------------*/
import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let axes;
let rotationAngle = 0;
let lastTime = 0;
let earthSelfAngle = 0;
let earthOrbitAngle = 0;
let moonSelfAngle = 0;
let moonOrbitAngle = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    const cubeVertices = new Float32Array([
        -0.5,  0.5,  // 좌상단
        -0.5, -0.5,  // 좌하단
         0.5, -0.5,  // 우하단
         0.5,  0.5   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function drawObject(finalTransform, color) {
    shader.setMat4("u_model", finalTransform);
    shader.setVec4("u_color", color);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw axes
    axes.draw(mat4.create(), mat4.create()); 

    shader.use();  
    gl.bindVertexArray(vao);

    // --- SUN ---
    const sunTransform = mat4.create();
    const sunRotate = mat4.create();
    const sunScale = mat4.create();

    mat4.rotate(sunRotate, sunRotate, rotationAngle, [0, 0, 1]);
    mat4.scale(sunScale, sunScale, [0.2, 0.2, 1]);

    mat4.multiply(sunTransform, sunScale, sunTransform);
    mat4.multiply(sunTransform, sunRotate, sunTransform);

    drawObject(sunTransform, [1.0, 0.0, 0.0, 1.0]);

    // --- EARTH ---
    const earthTransform = mat4.create();
    const orbitRotate = mat4.create();
    const orbitTranslate = mat4.create();
    const selfRotate = mat4.create();
    const scale = mat4.create();

    mat4.rotate(orbitRotate, orbitRotate, earthOrbitAngle, [0, 0, 1]);
    mat4.translate(orbitTranslate, orbitTranslate, [0.7, 0.0, 0.0]);
    mat4.rotate(selfRotate, selfRotate, earthSelfAngle, [0, 0, 1]);
    mat4.scale(scale, scale, [0.1, 0.1, 1]);

    mat4.multiply(earthTransform, scale, earthTransform);
    mat4.multiply(earthTransform, selfRotate, earthTransform);
    mat4.multiply(earthTransform, orbitTranslate, earthTransform);
    mat4.multiply(earthTransform, orbitRotate, earthTransform);

    drawObject(earthTransform, [0.0, 1.0, 1.0, 1.0]);

    // --- MOON ---
    const moonTransform = mat4.create();
    const orbitRotate1 = mat4.create();     // 태양 중심 지구처럼 도는 공전
    const orbitTranslate1 = mat4.create();  // 태양에서 지구까지 거리
    const orbitRotate2 = mat4.create();     // 지구 중심 달의 공전
    const orbitTranslate2 = mat4.create();  // 지구에서 달까지 거리
    const moonScale = mat4.create();
    const moonSelfRotate = mat4.create();   // 달 자전

    mat4.rotate(orbitRotate1, orbitRotate1, earthOrbitAngle, [0, 0, 1]);
    mat4.translate(orbitTranslate1, orbitTranslate1, [0.7, 0, 0]);
    mat4.rotate(orbitRotate2, orbitRotate2, moonOrbitAngle, [0, 0, 1]);
    mat4.translate(orbitTranslate2, orbitTranslate2, [0.2, 0, 0]);
    mat4.scale(moonScale, moonScale, [0.05, 0.05, 1]);
    mat4.rotate(moonSelfRotate, moonSelfRotate, moonSelfAngle, [0, 0, 1]);

    mat4.multiply(moonTransform, moonScale, moonTransform);
    mat4.multiply(moonTransform, moonSelfRotate, moonTransform);
    mat4.multiply(moonTransform, orbitTranslate2, moonTransform);
    mat4.multiply(moonTransform, orbitRotate2, moonTransform);
    mat4.multiply(moonTransform, orbitTranslate1, moonTransform);
    mat4.multiply(moonTransform, orbitRotate1, moonTransform);

    drawObject(moonTransform, [1.0, 1.0, 0.0, 1.0]); // yellow

}

function animate(currentTime) {

    if (!lastTime) lastTime = currentTime; // if lastTime == 0
    // deltaTime: 이전 frame에서부터의 elapsed time (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Sun
    rotationAngle += (Math.PI / 4) * deltaTime;
    
    // Earth
    earthSelfAngle += Math.PI * deltaTime;
    earthOrbitAngle += (Math.PI / 6) * deltaTime;

    // Moon
    moonSelfAngle += Math.PI * deltaTime;
    moonOrbitAngle += 2 * Math.PI * deltaTime;

    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        await initShader();

        setupBuffers();
        axes = new Axes(gl, 1.0); 

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
