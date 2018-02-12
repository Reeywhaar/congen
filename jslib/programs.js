export const draw = [
	`
		attribute vec4 a_position;
		attribute vec2 a_texCoord;
		uniform mat4 u_matrix;
		varying vec2 v_texCoord;
		uniform mat4 u_textureMatrix;

		void main() {
			v_texCoord = (u_textureMatrix * vec4(a_texCoord, 0, 1)).xy;
			gl_Position = u_matrix * a_position;
		}
	`,
	`
		precision mediump float;
		uniform sampler2D u_image;
		varying vec2 v_texCoord;

		void main() {
			gl_FragColor = texture2D(u_image, v_texCoord);
		}
	`,
];
