import { pipe, gmap, randomInt, range, sleep } from "./tools.js";
import Gen from "../node_modules/@reeywhaar/iterator/iterator.es6.js";
import * as filters from "./filters.js";
import * as programs from "./programs.js";

export class C {
	/**
	 * @constructor
	 * @param {WebGLRenderingContext} ctx
	 */
	constructor(ctx) {
		this.ctx = ctx;
	}

	getShader(type, source) {
		const shader = this.ctx.createShader(type);
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

	getProgram(vsSource, fsSource) {
		const vertexShader = this.getShader(this.ctx.VERTEX_SHADER, vsSource);
		const fragmentShader = this.getShader(this.ctx.FRAGMENT_SHADER, fsSource);

		const shaderProgram = this.ctx.createProgram();
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

	setProgram(programSource) {
		this.programSource = programSource;
		const program = this.getProgram(...this.programSource);

		this.program = program;

		this.ctx.useProgram(this.program);

		this.matrixLocation = this.ctx.getUniformLocation(this.program, "u_matrix");
		this.textureLocation = this.ctx.getUniformLocation(this.program, "u_image");
		this.textureMatrixLocation = this.ctx.getUniformLocation(
			this.program,
			"u_textureMatrix"
		);

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

		this.texCoordBuffer = this.ctx.createBuffer();
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texCoordBuffer);
		fillBuffer();

		this.positionBuffer = this.ctx.createBuffer();
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
		fillBuffer();

		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
		this.ctx.enableVertexAttribArray(this.positionLocation);
		this.ctx.vertexAttribPointer(
			this.positionLocation,
			2,
			this.ctx.FLOAT,
			false,
			0,
			0
		);

		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texCoordBuffer);
		this.ctx.enableVertexAttribArray(this.texCoordLocation);
		this.ctx.vertexAttribPointer(
			this.texCoordLocation,
			2,
			this.ctx.FLOAT,
			false,
			0,
			0
		);
	}

	/**
	 * @param {HTMLImageElement} image
	 */
	createTexture(image) {
		const texture = this.ctx.createTexture();
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
			// Upload the image into the texture.
			this.ctx.texImage2D(
				this.ctx.TEXTURE_2D,
				0,
				this.ctx.RGBA,
				this.ctx.RGBA,
				this.ctx.UNSIGNED_BYTE,
				image
			);
		} else {
			this.ctx.texImage2D(
				this.ctx.TEXTURE_2D,
				0,
				this.ctx.RGBA,
				this.ctx.canvas.width,
				this.ctx.canvas.height,
				0,
				this.ctx.RGBA,
				this.ctx.UNSIGNED_BYTE,
				null
			);
		}

		return texture;
	}

	clear() {
		this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.clearColor(0, 0, 0, 0);
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
	}

	/**
	 * @param {WebGLFramebuffer} framebuffer
	 */
	setFramebuffer(framebuffer) {
		this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, framebuffer);
		this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	}

	/**
	 * @param {WebGLTexture} texture
	 */
	drawTexture(
		texture,
		textureWidth,
		textureHeight,
		{
			srcX: srcX = 0,
			srcY: srcY = 0,
			srcWidth: srcWidth,
			srcHeight: srcHeight,
			dstX: dstX = 0,
			dstY: dstY = 0,
			dstWidth: dstWidth = this.ctx.canvas.width,
			dstHeight: dstHeight = this.ctx.canvas.height,
			scale: scale = 1,
			flipY: flipY = false,
		} = {}
	) {
		if (!textureWidth) throw new Error("textureWidth required");
		if (!textureHeight) throw new Error("textureHeight required");
		if (!srcWidth) srcWidth = textureWidth;
		if (!srcHeight) srcHeight = textureHeight;

		if (this.programSource !== programs.draw) {
			this.setProgram(programs.draw);
		}

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

		let matrix = pipe(
			twgl.m4.ortho(0, this.ctx.canvas.width, this.ctx.canvas.height, 0, -1, 1),
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

		this.ctx.uniformMatrix4fv(this.matrixLocation, false, matrix);
		this.ctx.uniform1i(this.textureLocation, 0);

		const texMatrix = pipe(
			twgl.m4.translation([srcX / textureWidth, srcY / textureHeight, 0]),
			matrix => {
				if (srcWidth === textureWidth && srcHeight === textureHeight)
					return matrix;
				return twgl.m4.scale(matrix, [
					srcWidth / textureWidth,
					srcHeight / textureHeight,
					1,
				]);
			}
		);

		this.ctx.uniformMatrix4fv(this.textureMatrixLocation, false, texMatrix);

		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);
	}

	/**
	 * @param {HTMLImageElement} image
	 */
	drawImage(
		image,
		{
			srcX: srcX = 0,
			srcY: srcY = 0,
			srcWidth: srcWidth = image.width,
			srcHeight: srcHeight = image.height,
			dstX: dstX = 0,
			dstY: dstY = 0,
			dstWidth: dstWidth = this.ctx.canvas.width,
			dstHeight: dstHeight = this.ctx.canvas.height,
			scale: scale = 1,
			flipY: flipY = false,
		} = {}
	) {
		if (!srcWidth) srcWidth = image.width;
		if (!srcHeight) srcHeight = image.height;
		const texture = this.createTexture(image);
		this.drawTexture(texture, image.width, image.height, {
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
		});
	}

	/**
	 * @param {HTMLImageElement} image
	 */
	async tile(
		image,
		{
			srcX: srcX = 0,
			srcY: srcY = 0,
			srcWidth: srcWidth = image.width,
			srcHeight: srcHeight = image.height,
			scale: scale = 1,
		} = {}
	) {
		if (!srcWidth) srcWidth = image.width;
		if (!srcHeight) srcHeight = image.height;
		const cwidth = this.ctx.canvas.width;
		const cheight = this.ctx.canvas.height;

		const rows = Math.ceil(cheight / srcHeight / scale);
		const columns = Math.ceil(cwidth / srcWidth / scale);

		const texture = this.createTexture(image);

		const fb = this.ctx.createFramebuffer();
		this.setFramebuffer(fb);
		const fbtext = this.createTexture();
		this.ctx.framebufferTexture2D(
			this.ctx.FRAMEBUFFER,
			this.ctx.COLOR_ATTACHMENT0,
			this.ctx.TEXTURE_2D,
			fbtext,
			0
		);

		if (
			this.ctx.checkFramebufferStatus(this.ctx.FRAMEBUFFER) !==
			this.ctx.FRAMEBUFFER_COMPLETE
		) {
			throw new Error("Output framebuffer not complete");
		}

		for (let row of Gen.range(rows).map(x => x * srcHeight * scale)) {
			for (let col of Gen.range(columns).map(x => x * srcWidth * scale)) {
				this.drawTexture(texture, image.width, image.height, {
					srcX: randomInt(0, image.width - srcWidth),
					srcY: randomInt(0, image.height - srcHeight),
					srcWidth: srcWidth,
					srcHeight: srcHeight,
					dstX: col,
					dstY: row,
					scale,
					flipY: randomInt(0, 1) ? true : false,
				});
			}
			await sleep(0);
		}

		this.setFramebuffer(null);
		this.drawTexture(fbtext, cwidth, cheight, {
			dstWidth: cwidth,
			dstHeight: cheight,
			flipY: true,
		});
	}
}
