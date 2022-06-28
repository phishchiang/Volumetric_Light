float PI = 3.141592653589793238;

attribute vec3 color;

uniform float time;
uniform vec2 pixels;
uniform float progress;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 v_color;
varying float v_debug;
varying vec4 v_debug_4;
varying vec3 v_debug_3;

void main() {
  vUv = uv;
  v_color = color;

  vec3 new_position = position;
  vec4 translate = modelMatrix * vec4(0, 0, 0, 1.0); // get it's translate value
  vec4 rotate_axis = modelMatrix * vec4(0, 1.0, 0.0, 0.0); // get it's rotate Y axis + translate value
  vec3 direction = normalize(rotate_axis - translate).xyz; // get the pure direction by subtracting translate value

  float alignment = dot(cameraPosition, direction); // the angle between camera and the rays

  alignment = max(0.3, pow(alignment, 6.0));

  v_debug = alignment;
  v_debug_4 = rotate_axis;
  v_debug_3 = direction;

  new_position = new_position * mix( smoothstep(0.0, 0.8, alignment), 0.5, v_color.r);
  new_position.xz = new_position.xz * mix(alignment, 1.0, v_color.r);

  gl_Position = projectionMatrix * modelViewMatrix * vec4( new_position, 1.0 );
}