precision lowp float;

attribute vec2 coord;
attribute vec2 scale;
varying vec3 pos;

void main() {
    gl_Position = vec4(
        coord.x * scale.x,
        coord.y * scale.y,
        0,
        1
    );
    gl_PointSize = 3.0;
    pos = normalize(gl_Position.xyz + 1.);
}
