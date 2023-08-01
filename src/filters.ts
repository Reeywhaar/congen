// prettier-ignore
// export const normal = new Float32Array([
// 	0, 0, 0,
// 	0, 1, 0,
// 	0, 0, 0
// ]);
// prettier-ignore
// export const gaussian_blur = new Float32Array([
// 	0.045, 0.122, 0.045,
// 	0.122, 0.332, 0.122,
// 	0.045, 0.122, 0.045,
// ]);
// prettier-ignore
export const gaussian_blur_2 = new Float32Array([
  1, 2, 1,
  2, 4, 2,
  1, 2, 1
]);
// prettier-ignore
// export const gaussian_blur_3 = new Float32Array([
// 	0, 1, 0,
// 	1, 1, 1,
// 	0, 1, 0
// ]);
// prettier-ignore
export const sharp_1 = new Float32Array([
  -1, -1, -1,
  -1, 16, -1,
  -1, -1, -1
]);
// prettier-ignore
export const sharp_2 = new Float32Array([
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
]);
// prettier-ignore
export const sharp_3 = new Float32Array([
  -1, -1, -1,
  -1, 9, -1,
  -1, -1, -1
]);
// prettier-ignore
// export const edge_detect = new Float32Array([
//   -0.125, -0.125, -0.125,
//   -0.125, 1, -0.125,
//   -0.125, -0.125, -0.125,
// ]);
// // prettier-ignore
// export const edge_detect_2 = new Float32Array([
// 	-1, -1, -1,
// 	-1,  8, -1,
// 	-1, -1, -1,
// ]);
// prettier-ignore
// export const edge_detect_3 = new Float32Array([
// 	-5, 0, 0,
// 	 0, 0, 0,
// 	 0, 0, 5
// ]);
// prettier-ignore
// export const edge_detect_4 = new Float32Array([
// 	-1, -1, -1,
// 	 0,  0,  0,
// 	 1,  1,  1
// ]);
// prettier-ignore
// export const edge_detect_5 = new Float32Array([
// 	-1, -1, -1,
// 	 2,  2,  2,
// 	-1, -1, -1
// ]);
// prettier-ignore
// export const edge_detect_6 = new Float32Array([
// 	-5, -5, -5,
// 	-5, 39, -5,
// 	-5, -5, -5,
// ]);
// prettier-ignore
// export const sobel_horizontal = new Float32Array([
// 	 1,  2,  1,
// 	 0,  0,  0,
// 	-1, -2, -1
// ]);
// // prettier-ignore
// export const sobel_vertical = new Float32Array([
// 	1, 0, -1,
// 	2, 0, -2,
// 	1, 0, -1
// ]);
// // prettier-ignore
// export const previt_horizontal = new Float32Array([
// 	 1,  1,  1,
// 	 0,  0,  0,
// 	-1, -1, -1,
// ]);
// // prettier-ignore
// export const previt_vertical = new Float32Array([
// 	1, 0, -1,
// 	1, 0, -1,
// 	1, 0, -1
// ]);
// prettier-ignore
export const box_blur = new Float32Array([
  0.111, 0.111, 0.111,
  0.111, 0.111, 0.111,
  0.111, 0.111, 0.111,
]);
// prettier-ignore
export const triangle_blur = new Float32Array([
  0.0625, 0.125, 0.0625,
  0.125, 0.25, 0.125,
  0.0625, 0.125, 0.0625,
]);
// prettier-ignore
export const emboss = new Float32Array([
  -1, -1, 0,
  -1, 1, 1,
  0, 1, 1
]);
// prettier-ignore
export const smoothify = new Float32Array([
  4, -1, 0,
  -1, 1, -1,
  0, -1, 4
]);
// prettier-ignore
export const straighten = new Float32Array([
  9, -1, -1,
  -1, 1, 0,
  -1, -1, -1
]);
// prettier-ignore
export const straighten_2 = new Float32Array([
  18, -2, -2,
  -2, 2, 0,
  -2, -2, -2
]);
// prettier-ignore
export const sweaterify = new Float32Array([
  -2, 4, -2,
  4, -2, 4,
  -2, 4, -2
]);
