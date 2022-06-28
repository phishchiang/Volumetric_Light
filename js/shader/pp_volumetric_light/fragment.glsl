float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D u_map;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;
void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	vec4 color = texture2D(u_map, vUv * 10.0);
	gl_FragColor = vec4(color);
}