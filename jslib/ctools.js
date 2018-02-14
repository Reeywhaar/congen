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
		}

		return texture;
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
			fbtext,
			0
		);
		if (
			this.ctx.checkFramebufferStatus(this.ctx.FRAMEBUFFER) !==
			this.ctx.FRAMEBUFFER_COMPLETE
		) {
			throw new Error("Output framebuffer not complete");
		}
		return [fb, fbtext];
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
	 * @param {WebGLTexture} texture
	 * @param {Number} width
	 * @param {Number} height
	 * @param {array} effects
	 */
	applyEffects(texture, width, height, effects = []) {
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
		this.ctx.uniform2f(textureSizeLocation, width, height);

		let matrix = pipe(twgl.m4.ortho(0, width, 0, height, -1, 1), matrix =>
			twgl.m4.scale(matrix, [width, height, 1])
		);

		this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

		const texMatrix = twgl.m4.translation([0, 0, 0]);

		this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

		const fb = [
			this.createFramebufferAndTexture(width, height),
			this.createFramebufferAndTexture(width, height),
		];

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

		for (let [index, effect] of Gen.fromArray(effects).enumerate()) {
			this.setFramebuffer(fb[index % 2][0], width, height);

			this.ctx.uniform1fv(kernelLocation, effect);
			this.ctx.uniform1f(kernelWeightLocation, getKernelWeight(effect));
			this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);
			this.ctx.bindTexture(this.ctx.TEXTURE_2D, fb[index % 2][1]);
			if (index === effects.length - 1) return fb[index % 2][1];
		}
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
			srcWidth: srcWidth = textureWidth,
			srcHeight: srcHeight = textureHeight,
			dstX: dstX = 0,
			dstY: dstY = 0,
			dstWidth: dstWidth = this.ctx.canvas.width,
			dstHeight: dstHeight = this.ctx.canvas.height,
			scale: scale = 1,
			flipY: flipY = false,
			flipX: flipX = false,
		} = {}
	) {
		if (!textureWidth) throw new Error("textureWidth required");
		if (!textureHeight) throw new Error("textureHeight required");
		if (!srcWidth) srcWidth = textureWidth;
		if (!srcHeight) srcHeight = textureHeight;

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

		this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);
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
			srcWidth: srcWidth = image.width,
			srcHeight: srcHeight = image.height,
			scale: scale = 1,
			dstHeight: dstHeight = this.ctx.canvas.height,
			dstWidth: dstWidth = this.ctx.canvas.width,
		} = {}
	) {
		if (!srcWidth) srcWidth = image.width;
		if (!srcHeight) srcHeight = image.height;

		const rows = Math.ceil(dstHeight / srcHeight / scale);
		const columns = Math.ceil(dstWidth / srcWidth / scale);

		const texture = this.createTexture(image);

		let [fb, fbtext] = this.createFramebufferAndTexture(dstWidth, dstHeight);

		for (let row of Gen.range(rows).map(x => x * srcHeight * scale)) {
			for (let col of Gen.range(columns).map(x => x * srcWidth * scale)) {
				this.drawTexture(texture, image.width, image.height, {
					srcX: randomInt(0, image.width - srcWidth),
					srcY: randomInt(0, image.height - srcHeight),
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
	 * @param {WebGLTexture} texture
	 * @param {Number} width
	 * @param {Number} height
	 *
	 * @returns WebGLTexture
	 */
	diffuse(texture, width, height, distribution = 120) {
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
					yield randomInt(distribution / 4, distribution / 2);
					yield randomInt(distribution * 0.5, distribution);
				})
				.toArray()
		);

		this.ctx.uniform2f(textureSizeLocation, width, height);

		this.ctx.uniform1i(textureLocation, 0);

		let matrix = pipe(twgl.m4.ortho(0, width, 0, height, -1, 1), matrix =>
			twgl.m4.scale(matrix, [width, height, 1])
		);
		this.ctx.uniformMatrix4fv(matrixLocation, false, matrix);

		const texMatrix = twgl.m4.translation([0, 0, 0]);
		this.ctx.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

		const [fr, fbtext] = this.createFramebufferAndTexture(width, height);

		this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

		this.setFramebuffer(fr, width, height);

		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, 6);

		return fbtext;
	}

	render(texture, width, height, flipY = false) {
		this.setFramebuffer(null);
		this.drawTexture(texture, this.ctx.canvas.width, this.ctx.canvas.height, {
			dstWidth: this.ctx.canvas.width,
			dstHeight: this.ctx.canvas.height,
			srcWidth: width,
			srcHeight: height,
			flipY: true,
		});
	}
}
