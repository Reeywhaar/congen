export const draw = `
	attribute vec4 a_position;
	attribute vec2 a_texCoord;

	varying vec2 v_texCoord;

	uniform mat4 u_matrix;
	uniform mat4 u_textureMatrix;

	void main() {
		v_texCoord = (u_textureMatrix * vec4(a_texCoord, 0, 1)).xy;
		gl_Position = u_matrix * a_position;
	}

	//SPLIT

	precision mediump float;

	varying vec2 v_texCoord;

	uniform sampler2D u_texture;

	void main() {
		gl_FragColor = texture2D(u_texture, v_texCoord);
	}
`;

export const effects = `
	attribute vec4 a_position;
	attribute vec2 a_texCoord;

	varying vec2 v_texCoord;

	uniform mat4 u_matrix;
	uniform mat4 u_textureMatrix;

	void main() {
		v_texCoord = (u_textureMatrix * vec4(a_texCoord, 0, 1)).xy;
		gl_Position = u_matrix * a_position;
	}

	//SPLIT

	precision mediump float;

	varying vec2 v_texCoord;

	uniform sampler2D u_texture;
	uniform vec2      u_textureSize;
	uniform float     u_kernel[9];
	uniform float     u_kernelWeight;

	vec2 onePixel = vec2(1, 1) / u_textureSize;

	void main() {
		vec4 colorSum =
			texture2D(u_texture, v_texCoord + vec2(-1, -1) * onePixel) * u_kernel[0] +
			texture2D(u_texture, v_texCoord + vec2( 0, -1) * onePixel) * u_kernel[1] +
			texture2D(u_texture, v_texCoord + vec2( 1, -1) * onePixel) * u_kernel[2] +
			texture2D(u_texture, v_texCoord + vec2(-1,  0) * onePixel) * u_kernel[3] +
			texture2D(u_texture, v_texCoord + vec2( 0,  0) * onePixel) * u_kernel[4] +
			texture2D(u_texture, v_texCoord + vec2( 1,  0) * onePixel) * u_kernel[5] +
			texture2D(u_texture, v_texCoord + vec2(-1,  1) * onePixel) * u_kernel[6] +
			texture2D(u_texture, v_texCoord + vec2( 0,  1) * onePixel) * u_kernel[7] +
			texture2D(u_texture, v_texCoord + vec2( 1,  1) * onePixel) * u_kernel[8] ;
		gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1);
	}
`;

export const diffuse = `
	attribute vec4 a_position;
	attribute vec2 a_texCoord;

	varying vec2 v_texCoord;

	uniform mat4 u_matrix;
	uniform mat4 u_textureMatrix;

	void main() {
		v_texCoord = (u_textureMatrix * vec4(a_texCoord, 0, 1)).xy;
		gl_Position = u_matrix * a_position;
	}

	//SPLIT

	precision mediump float;

	varying vec2 v_texCoord;

	uniform sampler2D u_texture;
	uniform vec2      u_textureSize;
	uniform float     u_distributionSize;
	uniform float     u_distribution[16];

	vec2 onePixel = vec2(1, 1) / u_textureSize;

	void main() {
		vec2 point = v_texCoord * u_textureSize;
		vec4 color = texture2D(u_texture, v_texCoord);

		float mul = 2.0;
		color += color;
		if(point.x <= u_textureSize.x - u_distributionSize && point.y >= u_distributionSize){
			mul += 2.0;
			color +=
				texture2D(u_texture, v_texCoord + vec2( u_distribution[0],  u_distribution[1]) * onePixel) +
				texture2D(u_texture, v_texCoord + vec2( u_distribution[2],  u_distribution[3]) * onePixel);
		}
		if(point.x <= u_textureSize.x - u_distributionSize && point.y <= u_textureSize.y - u_distributionSize){
			mul += 2.0;
			color +=
				texture2D(u_texture, v_texCoord + vec2( u_distribution[4],  -u_distribution[5]) * onePixel) +
				texture2D(u_texture, v_texCoord + vec2( u_distribution[6],  -u_distribution[7]) * onePixel);
		}
		if(point.x >= u_distributionSize && point.y >= u_distributionSize){
			mul += 2.0;
			color +=
				texture2D(u_texture, v_texCoord + vec2( -u_distribution[8],  -u_distribution[9]) * onePixel) +
				texture2D(u_texture, v_texCoord + vec2( -u_distribution[10],  -u_distribution[11]) * onePixel);
		}
		if(point.x >= u_distributionSize && point.y <= u_textureSize.y - u_distributionSize){
			mul += 2.0;
			color +=
				texture2D(u_texture, v_texCoord + vec2( -u_distribution[12], u_distribution[13]) * onePixel) +
				texture2D(u_texture, v_texCoord + vec2( -u_distribution[14], u_distribution[15]) * onePixel);
		}
		color = color / mul;

		gl_FragColor = color;
	}
`;
