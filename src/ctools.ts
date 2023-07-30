import * as twgl from "twgl.js";
import { gmap, pipe, randomInt, range, sleep } from "./tools";
import Gen from "@reeywhaar/iterator";
import Texture from "./texture";
import * as programs from "./programs";

export class C {
  ctx: WebGLRenderingContext
  programSource: string = ""
  program: WebGLProgram | null = null
  texCoordLocation: number | null = null
  positionLocation: number | null = null
  texCoordBuffer: WebGLBuffer | null = null
  positionBuffer: WebGLBuffer | null = null

  constructor(ctx: WebGLRenderingContext) {
    this.ctx = ctx;
  }

  /**
   *
   * @return {WebGLShader}
   */
  getShader(type: number, source: string) {
    const shader = this.ctx.createShader(type)!;
    this.ctx.shaderSource(shader, source);
    this.ctx.compileShader(shader);

    if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
      throw new Error(
        "An error occurred compiling the shaders: " +
        this.ctx.getShaderInfoLog(shader)
      );
    }

    return shader;
  }

  /**
   *
   * @return {WebGLProgram}
   */
  getProgram(vertextShaderSource: string, fragmentShaderSource: string) {
    const vertexShader = this.getShader(
      this.ctx.VERTEX_SHADER,
      vertextShaderSource
    );
    const fragmentShader = this.getShader(
      this.ctx.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    const shaderProgram = this.ctx.createProgram()!;
    this.ctx.attachShader(shaderProgram, vertexShader);
    this.ctx.attachShader(shaderProgram, fragmentShader);
    this.ctx.linkProgram(shaderProgram);

    if (!this.ctx.getProgramParameter(shaderProgram, this.ctx.LINK_STATUS)) {
      throw new Error(
        "Unable to initialize the shader program: " +
        this.ctx.getProgramInfoLog(shaderProgram)
      );
    }

    return shaderProgram;
  }

  setProgram(programSource: string) {
    if (this.programSource === programSource) return;
    this.programSource = programSource;
    const program = this.getProgram(...this.programSource.split("//SPLIT") as [string, string]);

    this.program = program;

    this.ctx.useProgram(this.program);

    this.texCoordLocation = this.ctx.getAttribLocation(program, "a_texCoord");
    this.positionLocation = this.ctx.getAttribLocation(program, "a_position");

    const fillBuffer = () =>
      this.ctx.bufferData(
        this.ctx.ARRAY_BUFFER,
        // prettier-ignore
        new Float32Array([
          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1,
        ]),
        this.ctx.STATIC_DRAW
      );

    const fillAttribPointer = (loc: number) =>
      this.ctx.vertexAttribPointer(loc, 2, this.ctx.FLOAT, false, 0, 0);

    this.texCoordBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texCoordBuffer);
    fillBuffer();

    this.ctx.enableVertexAttribArray(this.texCoordLocation);
    fillAttribPointer(this.texCoordLocation);

    this.positionBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
    fillBuffer();

    this.ctx.enableVertexAttribArray(this.positionLocation);
    fillAttribPointer(this.positionLocation);
  }

  /**
   * @param {HTMLImageElement} image
   * @return Texture
   */
  createTexture(image?: HTMLImageElement) {
    const texture = this.ctx.createTexture()!;
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

    this.ctx.texParameteri(
      this.ctx.TEXTURE_2D,
      this.ctx.TEXTURE_WRAP_S,
      this.ctx.CLAMP_TO_EDGE
    );
    this.ctx.texParameteri(
      this.ctx.TEXTURE_2D,
      this.ctx.TEXTURE_WRAP_T,
      this.ctx.CLAMP_TO_EDGE
    );
    this.ctx.texParameteri(
      this.ctx.TEXTURE_2D,
      this.ctx.TEXTURE_MIN_FILTER,
      this.ctx.NEAREST
    );
    this.ctx.texParameteri(
      this.ctx.TEXTURE_2D,
      this.ctx.TEXTURE_MAG_FILTER,
      this.ctx.NEAREST
    );

    if (image) {
      this.ctx.texImage2D(
        this.ctx.TEXTURE_2D,
        0,
        this.ctx.RGBA,
        this.ctx.RGBA,
        this.ctx.UNSIGNED_BYTE,
        image
      );

      return new Texture(texture, image.width, image.height);
    }

    return new Texture(texture, 0, 0);
  }

  createFramebufferAndTexture(
    width = this.ctx.canvas.width,
    height = this.ctx.canvas.height
  ) {
    const fbtext = this.createTexture();
    this.ctx.texImage2D(
      this.ctx.TEXTURE_2D,
      0,
      this.ctx.RGBA,
      width,
      height,
      0,
      this.ctx.RGBA,
      this.ctx.UNSIGNED_BYTE,
      null
    );
    const fb = this.ctx.createFramebuffer();
    this.setFramebuffer(fb);
    this.ctx.framebufferTexture2D(
      this.ctx.FRAMEBUFFER,
      this.ctx.COLOR_ATTACHMENT0,
      this.ctx.TEXTURE_2D,
      fbtext.texture,
      0
    );
    if (
      this.ctx.checkFramebufferStatus(this.ctx.FRAMEBUFFER) !==
      this.ctx.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("Output framebuffer not complete");
    }
    return [fb, new Texture(fbtext.texture, width, height)] as const;
  }

  clear(width = this.ctx.canvas.width, height = this.ctx.canvas.height) {
    this.ctx.viewport(0, 0, width, height);
    this.ctx.clearColor(0, 0, 0, 0);
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
  }

  setFramebuffer(
    framebuffer: WebGLFramebuffer,
    width = this.ctx.canvas.width,
    height = this.ctx.canvas.height
  ) {
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, framebuffer);
    this.ctx.viewport(0, 0, width, height);
  }

  /**
   * @param {string} key
   * @param {string} type
   * @param {Number|array} value
   */
  setUniform(key: string, type: string, value: any) {
    const loc = this.ctx.getUniformLocation(this.program!, `u_${key}`);
    if (loc === null) throw new Error(`unable to get Location "u_${key}"`);
    if (type.charAt(type.length - 1) === "v") {
      if (type.indexOf("Matrix") === 0) {
        (this.ctx as any)[`uniform${type}`](loc, false, value);
        return;
      }

      (this.ctx as any)[`uniform${type}`](loc, value);
      return;
    }
    if (!Array.isArray(value)) {
      (this.ctx as any)[`uniform${type}`](loc, value);
      return;
    }
    (this.ctx as any)[`uniform${type}`](loc, ...value);
  }

  applyProgram(texture: { width: number, height: number, texture: WebGLTexture }, program: string, uniforms: { key: string, type: string, value: any }[] = []) {
    this.setProgram(program);

    const defaultUniforms = [
      {
        key: "texture",
        type: "1i",
        value: 0,
      },
      {
        key: "matrix",
        type: "Matrix4fv",
        value: pipe(
          twgl.m4.ortho(0, texture.width, 0, texture.height, -1, 1),
          matrix => twgl.m4.scale(matrix, [texture.width, texture.height, 1])
        ),
      },
      {
        key: "textureMatrix",
        type: "Matrix4fv",
        value: twgl.m4.translation([0, 0, 0]),
      },
      {
        key: "textureSize",
        type: "2f",
        value: [texture.width, texture.height],
      },
    ];

    for (let uniform of [...defaultUniforms, ...uniforms]) {
      this.setUniform(uniform.key, uniform.type, uniform.value);
    }

    const [fr, fbtext] = this.createFramebufferAndTexture(
      texture.width,
      texture.height
    );

    this.setFramebuffer(fr, texture.width, texture.height);
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture.texture);
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);
    return fbtext;
  }

  drawTexture(
    texture: Texture,
    {
      srcX = 0,
      srcY = 0,
      srcWidth = texture.width,
      srcHeight = texture.height,
      dstX = 0,
      dstY = 0,
      dstWidth = this.ctx.canvas.width,
      dstHeight = this.ctx.canvas.height,
      scale = 1,
      flipY = false,
      flipX = false,
    } = {}
  ) {
    if (!texture.width) throw new Error("textureWidth required");
    if (!texture.height) throw new Error("textureHeight required");
    if (!srcWidth) srcWidth = texture.width;
    if (!srcHeight) srcHeight = texture.height;

    this.setProgram(programs.draw);

    const guf = (pointer: string) => {
      const loc = this.ctx.getUniformLocation(this.program!, pointer);
      if (loc === null) throw new Error("unable to set Location");
      return loc;
    };

    const matrixLocation = guf("u_matrix");
    const textureLocation = guf("u_texture");
    const textureMatrixLocation = guf("u_textureMatrix");

    this.ctx.uniform1i(textureLocation, 0);

    let matrix = pipe(
      twgl.m4.ortho(0, dstWidth, dstHeight, 0, -1, 1),
      matrix => twgl.m4.translate(matrix, [dstX, dstY, 0]),
      matrix => twgl.m4.scale(matrix, [srcWidth * scale, srcHeight * scale, 1])
    );

    if (flipY) {
      matrix = pipe(
        matrix,
        matrix => twgl.m4.scale(matrix, [1, -1, 1]),
        matrix => twgl.m4.translate(matrix, [0, -1, 0])
      );
    }

    if (flipX) {
      matrix = pipe(
        matrix,
        matrix => twgl.m4.scale(matrix, [-1, 1, 1]),
        matrix => twgl.m4.translate(matrix, [-1, 0, 0])
      );
    }

    this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

    const texMatrix = pipe(
      twgl.m4.translation([srcX / texture.width, srcY / texture.height, 0]),
      matrix => {
        if (srcWidth === texture.width && srcHeight === texture.height)
          return matrix;
        return twgl.m4.scale(matrix, [
          srcWidth / texture.width,
          srcHeight / texture.height,
          1,
        ]);
      }
    );

    this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture.texture);
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);
  }

  drawImage(
    image: HTMLImageElement,
    {
      srcX = 0,
      srcY = 0,
      srcWidth = image.width,
      srcHeight = image.height,
      dstX = 0,
      dstY = 0,
      dstWidth = this.ctx.canvas.width,
      dstHeight = this.ctx.canvas.height,
      scale = 1,
      flipY = false,
      flipX = false,
    } = {}
  ) {
    if (!srcWidth) srcWidth = image.width;
    if (!srcHeight) srcHeight = image.height;
    const texture = this.createTexture(image);
    this.drawTexture(texture, {
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      dstX,
      dstY,
      dstHeight,
      dstWidth,
      scale,
      flipY,
      flipX,
    });
  }

  /**
   * @param {HTMLImageElement} image
   * @returns Texture
   */
  async tile(
    texture: Texture,
    {
      srcWidth: srcWidth = texture.width,
      srcHeight: srcHeight = texture.height,
      scale: scale = 1,
      dstHeight: dstHeight = this.ctx.canvas.height,
      dstWidth: dstWidth = this.ctx.canvas.width,
    } = {}
  ) {
    if (!srcWidth) srcWidth = texture.width;
    if (!srcHeight) srcHeight = texture.height;

    const rows = Math.ceil(dstHeight / srcHeight / scale);
    const columns = Math.ceil(dstWidth / srcWidth / scale);

    let [fb, fbtext] = this.createFramebufferAndTexture(dstWidth, dstHeight);
    this.setFramebuffer(fb, dstWidth, dstHeight);

    for (let row of gmap(range(rows), x => x * srcHeight * scale)) {
      for (let col of gmap(range(columns), x => x * srcWidth * scale)) {
        this.drawTexture(texture, {
          srcX: randomInt(0, texture.width - srcWidth),
          srcY: randomInt(0, texture.height - srcHeight),
          srcWidth: srcWidth,
          srcHeight: srcHeight,
          dstX: col,
          dstY: row,
          dstWidth,
          dstHeight,
          scale,
          flipY: randomInt(0, 1) ? true : false,
          flipX: randomInt(0, 1) ? true : false,
        });
      }
      await sleep(0);
    }

    return fbtext;
  }

  /**
   * @param {Texture} texture
   * @param {array} effects
   * @returns Texture
   */
  applyEffects(texture: Texture, effects: Float32Array[] = []) {
    if (effects.length < 1) return texture;

    this.setProgram(programs.effects);

    const getKernelWeight = (kernel: Float32Array) => {
      const weight = kernel.reduce((c, x) => c + x);
      return weight <= 0 ? 1 : weight;
    };

    const guf = (pointer: string) => {
      const loc = this.ctx.getUniformLocation(this.program!, pointer);
      if (loc === null) throw new Error(`unable to set Location "${pointer}"`);
      return loc;
    };

    const matrixLocation = guf("u_matrix");
    const textureLocation = guf("u_texture");
    const textureSizeLocation = guf("u_textureSize");
    const textureMatrixLocation = guf("u_textureMatrix");
    const kernelLocation = guf("u_kernel");
    const kernelWeightLocation = guf("u_kernelWeight");

    this.ctx.uniform1i(textureLocation, 0);
    this.ctx.uniform2f(textureSizeLocation, texture.width, texture.height);

    let matrix = pipe(
      twgl.m4.ortho(0, texture.width, 0, texture.height, -1, 1),
      matrix => twgl.m4.scale(matrix, [texture.width, texture.height, 1])
    );

    this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

    const texMatrix = twgl.m4.translation([0, 0, 0]);

    this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

    const fb = [
      this.createFramebufferAndTexture(texture.width, texture.height),
      this.createFramebufferAndTexture(texture.width, texture.height),
    ];

    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture.texture);

    for (let [index, effect] of effects.entries()) {
      this.setFramebuffer(fb[index % 2][0], texture.width, texture.height);

      this.ctx.uniform1fv(kernelLocation, effect);
      this.ctx.uniform1f(kernelWeightLocation, getKernelWeight(effect));
      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);
      this.ctx.bindTexture(this.ctx.TEXTURE_2D, fb[index % 2][1].texture);
      if (index === effects.length - 1)
        return new Texture(
          fb[index % 2][1].texture,
          texture.width,
          texture.height
        );
    }

    throw new Error("Unexpected return");
  }

  /**
   * @param {Texture} texture
   * @param {Number} width
   * @param {Number} height
   *
   * @returns Texture
   */
  diffuse(texture: Texture, distribution = 120) {
    return this.applyProgram(texture, programs.diffuse, [
      {
        key: "distributionSize",
        type: "1f",
        value: distribution,
      },
      {
        key: "distribution",
        type: "1fv",
        value: Gen.range(8)
          .subSplit(function* (_i) {
            yield randomInt(0, distribution / 2);
            yield randomInt(0, distribution / 2);
            yield randomInt(10, distribution);
            yield randomInt(10, distribution);
          })
          .toArray(),
      },
    ]);
  }

  adjust(texture: Texture, saturation = 0, contrast = 0, brightness = 0) {
    return this.applyProgram(texture, programs.adjust, [
      {
        key: "saturation",
        type: "1f",
        value: saturation,
      },
      {
        key: "brightness",
        type: "1f",
        value: brightness,
      },
      {
        key: "contrast",
        type: "1f",
        value: contrast,
      },
    ]);
  }

  maskTiles(texture: Texture, x: number, y: number, size = 20) {
    return pipe(
      this.applyProgram(texture, programs.antitile, [
        {
          key: "tile",
          type: "3f",
          value: [x, y, size],
        },
        {
          key: "direction",
          type: "1i",
          value: 0,
        },
      ]),
      texture =>
        this.applyProgram(texture, programs.antitile, [
          {
            key: "tile",
            type: "3f",
            value: [x, y, size],
          },
          {
            key: "direction",
            type: "1i",
            value: 1,
          },
        ])
    );
  }

  render(
    texture: Texture,
    {
      srcX = 0,
      srcY = 0,
      srcWidth = texture.width,
      srcHeight = texture.height,
    } = {}
  ) {
    this.setFramebuffer(null, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawTexture(texture, {
      dstWidth: this.ctx.canvas.width,
      dstHeight: this.ctx.canvas.height,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      flipY: true,
    });
  }
}
