export default class Texture {
  texture: WebGLTexture
  width: number
  height: number

  constructor(texture: WebGLTexture, width: number, height: number) {
    this.texture = texture;
    this.width = width;
    this.height = height;
  }
}
