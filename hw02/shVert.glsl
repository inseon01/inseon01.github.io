#version 300 es

layout (location = 0) in vec3 aPos;

uniform float moveX;
uniform float moveY;

void main() {
    float newX = aPos[0] + moveX;
    float newY = aPos[1] + moveY;
    if (newX > -600 && newX < 600 && newY > -600 && newY < 600) {
        gl_Position = vec4(newX, newY, aPos[2], 1.0);
    }
} 