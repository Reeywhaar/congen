import { pipe, gmap, randomInt, range, sleep } from "./tools.js";
import Gen from "../node_modules/@reeywhaar/iterator/iterator.es6.js";
import Texture from "./texture.js";
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

	/**
	 *
	 * @return {WebGLShader}
	 */
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

	/**
	 *
	 * @return {WebGLProgram}
	 */
	getProgram(vertextShaderSource, fragmentShaderSource) {
		const vertexShader = this.getShader(
			this.ctx.VERTEX_SHADER,
			vertextShaderSource
		);
		const fragmentShader = this.getShader(
			this.ctx.FRAGMENT_SHADER,
			fragmentShaderSource
		);

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
		if (this.programSource === programSource) return;
		this.programSource = programSource;
		const program = this.getProgram(...this.programSource.split("//SPLIT"));

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

		const fillAttribPointer = loc =>
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

		return new Texture(texture, null, null);
	}

	/**
	 * @param {HTMLImageElement} image
	 * @return [WebGLFramebuffer, Texture]
	 */
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
		return [fb, new Texture(fbtext.texture, width, height)];
	}

	clear(width = this.ctx.canvas.width, height = this.ctx.canvas.height) {
		this.ctx.viewport(0, 0, width, height);
		this.ctx.clearColor(0, 0, 0, 0);
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
	}

	/**
	 * @param {WebGLFramebuffer} framebuffer
	 */
	setFramebuffer(
		framebuffer,
		width = this.ctx.canvas.width,
		height = this.ctx.canvas.height
	) {
		this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, framebuffer);
		this.ctx.viewport(0, 0, width, height);
	}

	/**
	 * @param {Texture} texture
	 * @param {array} effects
	 * @returns Texture
	 */
	applyEffects(texture, effects = []) {
		if (effects.length < 1) return texture;

		this.setProgram(programs.effects);

		const getKernelWeight = kernel => {
			const weight = kernel.reduce((c, x) => c + x);
			return weight <= 0 ? 1 : weight;
		};

		const guf = pointer => {
			const loc = this.ctx.getUniformLocation(this.program, pointer);
			if (loc === null) throw new Error(`unable to set Location "${pointer}"`);
			return loc;
		};

		const matrixLocation = guf("u_matrix");
		const textureLocation = guf("u_texture");
		const textureSizeLocation = guf("u_textureSize");
		const textureMatrixLocation = guf("u_textureMatrix");
		const kernelLocation = guf("u_kernel[0]");
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

		for (let [index, effect] of Gen.fromArray(effects).enumerate()) {
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
	}

	/**
	 * @param {Texture} texture
	 */
	drawTexture(
		texture,
		{
			srcX: srcX = 0,
			srcY: srcY = 0,
			srcWidth: srcWidth = texture.width,
			srcHeight: srcHeight = texture.height,
			dstX: dstX = 0,
			dstY: dstY = 0,
			dstWidth: dstWidth = this.ctx.canvas.width,
			dstHeight: dstHeight = this.ctx.canvas.height,
			scale: scale = 1,
			flipY: flipY = false,
			flipX: flipX = false,
		} = {}
	) {
		if (!texture.width) throw new Error("textureWidth required");
		if (!texture.height) throw new Error("textureHeight required");
		if (!srcWidth) srcWidth = texture.width;
		if (!srcHeight) srcHeight = texture.height;

		this.setProgram(programs.draw);

		const guf = pointer => {
			const loc = this.ctx.getUniformLocation(this.program, pointer);
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
			flipX: flipX = false,
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
		texture,
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

		for (let row of Gen.range(rows).map(x => x * srcHeight * scale)) {
			for (let col of Gen.range(columns).map(x => x * srcWidth * scale)) {
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
	 * @param {Number} width
	 * @param {Number} height
	 *
	 * @returns Texture
	 */
	diffuse(texture, distribution = 120) {
		this.setProgram(programs.diffuse);

		const guf = pointer => {
			const loc = this.ctx.getUniformLocation(this.program, pointer);
			if (loc === null) throw new Error(`unable to set Location ${pointer}`);
			return loc;
		};

		const matrixLocation = guf("u_matrix");
		const textureLocation = guf("u_texture");
		const textureMatrixLocation = guf("u_textureMatrix");
		const textureSizeLocation = guf("u_textureSize");
		const distributionSizeLocation = guf("u_distributionSize");
		const distributionLocation = guf("u_distribution");

		this.ctx.uniform1f(distributionSizeLocation, distribution);
		this.ctx.uniform1fv(
			distributionLocation,
			Gen.range(8)
				.subSplit(function*(i) {
					yield randomInt(0, distribution / 2);
					yield randomInt(0, distribution / 2);
					yield randomInt(10, distribution);
					yield randomInt(10, distribution);
				})
				.toArray()
		);

		this.ctx.uniform2f(textureSizeLocation, texture.width, texture.height);

		this.ctx.uniform1i(textureLocation, 0);

		let matrix = pipe(
			twgl.m4.ortho(0, texture.width, 0, texture.height, -1, 1),
			matrix => twgl.m4.scale(matrix, [texture.width, texture.height, 1])
		);
		this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

		const texMatrix = twgl.m4.translation([0, 0, 0]);
		this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

		const [fr, fbtext] = this.createFramebufferAndTexture(
			texture.width,
			texture.height
		);

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture.texture);

		this.setFramebuffer(fr, texture.width, texture.height);

		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);

		return fbtext;
	}
	/**
	 * @param {Texture} texture
	 * @param {Number} saturation
	 * @param {Number} brightness
	 * @param {Number} contrast
	 *
	 * @returns Texture
	 */
	adjust(texture, saturation = 0, contrast = 0, brightness = 0) {
		this.setProgram(programs.adjust);

		const guf = pointer => {
			const loc = this.ctx.getUniformLocation(this.program, pointer);
			if (loc === null) throw new Error(`unable to set Location ${pointer}`);
			return loc;
		};

		const textureLocation = guf("u_texture");
		const matrixLocation = guf("u_matrix");
		const textureMatrixLocation = guf("u_textureMatrix");
		const saturationLocation = guf("u_saturation");
		const contrastLocation = guf("u_contrast");
		const brightnessLocation = guf("u_brightness");

		this.ctx.uniform1f(saturationLocation, saturation);
		this.ctx.uniform1f(contrastLocation, contrast);
		this.ctx.uniform1f(brightnessLocation, brightness);

		let matrix = pipe(
			twgl.m4.ortho(0, texture.width, 0, texture.height, -1, 1),
			matrix => twgl.m4.scale(matrix, [texture.width, texture.height, 1])
		);
		this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

		const texMatrix = twgl.m4.translation([0, 0, 0]);
		this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

		const [fr, fbtext] = this.createFramebufferAndTexture(
			texture.width,
			texture.height
		);

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture.texture);

		this.setFramebuffer(fr, texture.width, texture.height);

		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);

		return fbtext;
	}

	render(texture, flipY = false) {
		this.setFramebuffer(null);
		this.drawTexture(texture, {
			dstWidth: this.ctx.canvas.width,
			dstHeight: this.ctx.canvas.height,
			srcWidth: texture.width,
			srcHeight: texture.height,
			flipY: true,
		});
	}
}
