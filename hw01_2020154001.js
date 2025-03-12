// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 500x500
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);

// Start rendering
render();

// Render loop
function render() {
    const halfWidth = canvas.width/2;
    const halfHeight = canvas.height/2;

    gl.enable(gl.SCISSOR_TEST);

    //red
    gl.scissor(0, halfHeight, halfWidth, halfHeight);
    gl.clearColor(1, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //green
    gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.clearColor(0, 1, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //blue
    gl.scissor(0, 0, halfWidth, halfHeight);
    gl.clearColor(0, 0, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //yellow
    gl.scissor(halfWidth, 0, halfWidth, halfHeight);
    gl.clearColor(1, 1, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.disable(gl.SCISSOR_TEST);
    
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    
    let newSize = Math.min(window.innerWidth, window.innerHeight);

    // Update canvas size
    canvas.width = newSize;
    canvas.height = newSize;
    gl.viewport(0,0, canvas.width, canvas.height);
    render();
});

