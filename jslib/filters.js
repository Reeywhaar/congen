// prettier-ignore
// export const normal = new Float32Array([
// 	0, 0, 0,
// 	0, 1, 0,
// 	0, 0, 0
// ]);
// prettier-ignore
// export const gaussianBlur = new Float32Array([
// 	0.045, 0.122, 0.045,
// 	0.122, 0.332, 0.122,
// 	0.045, 0.122, 0.045,
// ]);
// prettier-ignore
export const gaussianBlur2 = new Float32Array([
	1, 2, 1,
	2, 4, 2,
	1, 2, 1
]);
// prettier-ignore
// export const gaussianBlur3 = new Float32Array([
// 	0, 1, 0,
// 	1, 1, 1,
// 	0, 1, 0
// ]);
// prettier-ignore
export const sharp1 = new Float32Array([
	-1, -1, -1,
	-1, 16, -1,
	-1, -1, -1
]);
// prettier-ignore
export const sharp2 = new Float32Array([
	 0, -1,  0,
	-1,  5, -1,
	 0, -1,  0
]);
// prettier-ignore
export const sharp3 = new Float32Array([
	-1, -1, -1,
	-1,  9, -1,
	-1, -1, -1
]);
// prettier-ignore
// export const edgeDetect = new Float32Array([
// 	-0.125, -0.125, -0.125,
// 	-0.125,      1, -0.125,
// 	-0.125, -0.125, -0.125,
// ]);
// // prettier-ignore
// export const edgeDetect2 = new Float32Array([
// 	-1, -1, -1,
// 	-1,  8, -1,
// 	-1, -1, -1,
// ]);
// prettier-ignore
// export const edgeDetect3 = new Float32Array([
// 	-5, 0, 0,
// 	 0, 0, 0,
// 	 0, 0, 5
// ]);
// prettier-ignore
// export const edgeDetect4 = new Float32Array([
// 	-1, -1, -1,
// 	 0,  0,  0,
// 	 1,  1,  1
// ]);
// prettier-ignore
// export const edgeDetect5 = new Float32Array([
// 	-1, -1, -1,
// 	 2,  2,  2,
// 	-1, -1, -1
// ]);
// prettier-ignore
// export const edgeDetect6 = new Float32Array([
// 	-5, -5, -5,
// 	-5, 39, -5,
// 	-5, -5, -5,
// ]);
// prettier-ignore
// export const sobelHorizontal = new Float32Array([
// 	 1,  2,  1,
// 	 0,  0,  0,
// 	-1, -2, -1
// ]);
// // prettier-ignore
// export const sobelVertical = new Float32Array([
// 	1, 0, -1,
// 	2, 0, -2,
// 	1, 0, -1
// ]);
// // prettier-ignore
// export const previtHorizontal = new Float32Array([
// 	 1,  1,  1,
// 	 0,  0,  0,
// 	-1, -1, -1,
// ]);
// // prettier-ignore
// export const previtVertical = new Float32Array([
// 	1, 0, -1,
// 	1, 0, -1,
// 	1, 0, -1
// ]);
// prettier-ignore
export const boxBlur = new Float32Array([
	0.111, 0.111, 0.111,
	0.111, 0.111, 0.111,
	0.111, 0.111, 0.111,
]);
// prettier-ignore
export const triangleBlur = new Float32Array([
	0.0625, 0.125, 0.0625,
	 0.125,  0.25,  0.125,
	0.0625, 0.125, 0.0625,
]);
// prettier-ignore
export const emboss = new Float32Array([
	-1, -1,  0,
	-1,  1,  1,
	 0,  1,  1
]);
// prettier-ignore
export const smoothify = new Float32Array([
	 4, -1,  0,
	-1,  1, -1,
	 0, -1,  4
]);
// prettier-ignore
export const straighten = new Float32Array([
	  9, -1, -1,
	 -1,  1,  0,
	 -1, -1, -1
]);
// prettier-ignore
export const straighten2 = new Float32Array([
	 18, -2, -2,
	 -2,  2,  0,
	 -2, -2, -2
]);
// prettier-ignore
export const sweaterify = new Float32Array([
	  -2, 4, -2,
	 4,  -2,  4,
	 -2, 4, -2
]);
