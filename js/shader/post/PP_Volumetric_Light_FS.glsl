float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D u_map;
uniform vec4 resolution;
uniform sampler2D t_audio_data;

varying vec2 vUv;
varying vec3 vPosition;

// Photoshop Blending Mode
// https://github.com/jamieowen/glsl-blend
vec4 blendScreen(vec4 base, vec4 blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

// GLSL Simple Random
// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 co){
	return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	vec4 t_original = texture2D(u_map, vUv);
	// gl_FragColor = vec4(vUv, 0.0, 1.0);
	vec2 uv_to_center = vec2(0.5) - vUv;


	vec4 f = texture2D( t_audio_data, vec2(vUv));


	vec4 color_rays = vec4(0.0);
	float sample_times = 20.0;
	for(float i = 0.0; i < sample_times; i++){
		// float lerp = i / sample_times; // 0 - 1
		float lerp = (i + rand(vec2(vUv))) / sample_times; // 0 - 1
		float weight = cos(lerp * PI * 0.5); // Check the graph on https://www.desmos.com/

		vec4 t_sample = texture2D(u_map, vUv + uv_to_center * f.r * 0.5 * lerp);

		// t_sample.rgb = t_sample.rgb * t_sample.a;
		color_rays = color_rays + t_sample * weight;
	}
	color_rays.rgb = color_rays.rgb / 10.0;

	vec4 color_final = blendScreen(color_rays, t_original);
	gl_FragColor = vec4(vec3(color_final.rgb), 1.0);
	// gl_FragColor = vec4(vec3(f.rgb), 1.0);
}