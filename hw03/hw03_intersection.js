/*-------------------------------------------------------------------------
hw03 intersection

---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

let isDrawingCircle = false;
let circleCenter = null;
let tempCircleEndPoint = null;
let radius;
let circleLines = [];
let tempCircleLines = [];
let currentMode = "circle";
let intersectionPoints = [];

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

function computeIntersectionPoints() {
    if (lines.length === 0 || !circleCenter || radius === undefined) return [];

    const [x1, y1, x2, y2] = lines[0];
    const [cx, cy] = circleCenter;
    const r = radius;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    const discriminant = b * b - 4 * a * c;

    let points = [];

    if (discriminant < 0) {
        return []; // No intersection
    }

    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    const inRange = t => t >= 0 && t <= 1;

    if (inRange(t1)) {
        const ix1 = x1 + t1 * dx;
        const iy1 = y1 + t1 * dy;
        points.push([ix1, iy1]);
    }
    if (inRange(t2) && t2 !== t1) {
        const ix2 = x1 + t2 * dx;
        const iy2 = y1 + t2 * dy;
        points.push([ix2, iy2]);
    }

    return points;
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표

        let [glX, glY] = convertToWebGLCoordinates(x, y);
        
        if (currentMode === "circle") { 
            circleCenter = [glX, glY];
            isDrawingCircle = true;
        } else if (currentMode === "line") {
            startPoint = [glX, glY];
            isDrawing = true;
        }
    }

    function handleMouseMove(event) {
        if (!isDrawingCircle && !isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
            
        let [glX, glY] = convertToWebGLCoordinates(x, y);

        if (isDrawingCircle) {
            tempCircleEndPoint = [glX, glY];

            radius = Math.sqrt(
                Math.pow(tempCircleEndPoint[0] - circleCenter[0], 2) + 
                Math.pow(tempCircleEndPoint[1] - circleCenter[1], 2)
            );

            tempCircleLines = [];
            for(var i = 0; i < 100; i++) {
                let theta = (2 * Math.PI) / 100;
                tempCircleLines.push([
                    circleCenter[0] + (radius * Math.cos(theta * i)), 
                    circleCenter[1] + (radius * Math.sin(theta * i)),
                    circleCenter[0] + (radius * Math.cos(theta * (i + 1))), 
                    circleCenter[1] + (radius * Math.sin(theta * (i + 1)))
                ])
            }
        }

        if (isDrawing) {
            tempEndPoint = [glX, glY];
        }

        render();
    }

    function handleMouseUp() {
        if (isDrawingCircle && circleCenter && tempCircleEndPoint) {
            circleLines = [];
            for(var i = 0; i < 100; i++) {
                let theta = (2 * Math.PI) / 100;
                circleLines.push([
                    circleCenter[0] + (radius * Math.cos(theta * i)), 
                    circleCenter[1] + (radius * Math.sin(theta * i)),
                    circleCenter[0] + (radius * Math.cos(theta * (i + 1))), 
                    circleCenter[1] + (radius * Math.sin(theta * (i + 1)))
                ])
            }
            
            textOverlay = setupText(canvas, "Circle: center (" + circleCenter[0].toFixed(2) + ", " 
                        + circleCenter[1].toFixed(2) + ") radius = " + radius.toFixed(2), 1);
            
            tempCircleLines = [];
            isDrawingCircle = false;
            currentMode = "line"
        }

        if (isDrawing && startPoint && tempEndPoint) {

            lines.push([...startPoint, ...tempEndPoint]); 

            textOverlay2 = setupText(canvas, "Line segment: (" + lines[0][0].toFixed(2) + ", " 
                + lines[0][1].toFixed(2) + ") ~ (" 
                + lines[0][2].toFixed(2) + ", " + lines[0][3].toFixed(2) + ")", 2);

            const intersections = computeIntersectionPoints();
            intersectionPoints = intersections;
            let thirdLineText;

            if (intersections.length === 0) {
                thirdLineText = "No intersection";
            } else if (intersections.length === 1) {
                const [x, y] = intersections[0];
                thirdLineText = `Intersection Points: 1 Point 1: (${x.toFixed(2)}, ${y.toFixed(2)})`;
            } else {
            const [x1, y1] = intersections[0];
            const [x2, y2] = intersections[1];
            thirdLineText = `Intersection Points: 2 Point 1: (${x1.toFixed(2)}, ${y1.toFixed(2)}) Point 2: (${x2.toFixed(2)}, ${y2.toFixed(2)})`;
            }

            setupText(canvas, thirdLineText, 3); // 3번째 줄에 출력

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            currentMode = "done";
        }

        render();
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();

    // 저장된 원 그리기
    for (let line of circleLines) {
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 임시 원 그리기
    if (isDrawingCircle && circleCenter && tempCircleEndPoint) {
        for (let line of tempCircleLines) {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }
    
    // 저장된 선들 그리기
    for (let line of lines) {
        shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]);        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                      gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 교차점 그리기
    for (let pt of intersectionPoints) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pt), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, 1);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
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
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
