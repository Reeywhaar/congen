export default class Texture {
	/**
	 * @param {WebGLTexture} texture
	 * @param {Number} width
	 * @param {Number} height
	 */
	constructor(texture, width, height) {
		this.texture = texture;
		this.width = width;
		this.height = height;
	}
}
