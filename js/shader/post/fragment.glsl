float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D u_map;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;
void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	vec4 t_original = texture2D(u_map, vUv);
	// gl_FragColor = vec4(vUv, 0.0, 1.0);
	vec2 uv_to_center = vec2(0.5) - vUv;


	vec4 color = vec4(0.0);
	float total = 0.0;
	for(float i = 0.0; i < 40.0; i++){
		float lerp = i/40.0; // 0 - 1
		// float weight = 1.0;
		float weight = sin(lerp * PI);

		vec4 t_sample = texture2D(u_map, vUv + uv_to_center * 0.2 * lerp);

		t_sample.rgb = t_sample.rgb * t_sample.a;
		color += t_sample * weight;
		total = total + weight;
	}
	color.rgb = color.rgb / 20.0;
	gl_FragColor = vec4(vec3(color.rgb), 1.0);
}