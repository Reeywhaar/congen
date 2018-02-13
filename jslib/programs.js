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

	void main() {
		vec2 onePixel = vec2(1, 1) / u_textureSize;
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
