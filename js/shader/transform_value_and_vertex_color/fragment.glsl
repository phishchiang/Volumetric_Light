float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 v_color;
varying float v_debug;
varying vec4 v_debug_4;
varying vec3 v_debug_3;


void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	gl_FragColor = vec4(vec3(v_color.r),1.);
	// gl_FragColor = vec4(vec3(v_debug_4.xyz),1.);
	
}