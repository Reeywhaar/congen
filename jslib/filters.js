export const normal = [0, 0, 0, 0, 1, 0, 0, 0, 0];
export const gaussianBlur = [
	0.045,
	0.122,
	0.045,
	0.122,
	0.332,
	0.122,
	0.045,
	0.122,
	0.045,
];
export const gaussianBlur2 = [1, 2, 1, 2, 4, 2, 1, 2, 1];
export const gaussianBlur3 = [0, 1, 0, 1, 1, 1, 0, 1, 0];
export const unsharpen = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
export const sharpness = [0, -1, 0, -1, 5, -1, 0, -1, 0];
export const sharpen = [-1, -1, -1, -1, 16, -1, -1, -1, -1];
export const edgeDetect = [
	-0.125,
	-0.125,
	-0.125,
	-0.125,
	1,
	-0.125,
	-0.125,
	-0.125,
	-0.125,
];
export const edgeDetect2 = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
export const edgeDetect3 = [-5, 0, 0, 0, 0, 0, 0, 0, 5];
export const edgeDetect4 = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
export const edgeDetect5 = [-1, -1, -1, 2, 2, 2, -1, -1, -1];
export const edgeDetect6 = [-5, -5, -5, -5, 39, -5, -5, -5, -5];
export const sobelHorizontal = [1, 2, 1, 0, 0, 0, -1, -2, -1];
export const sobelVertical = [1, 0, -1, 2, 0, -2, 1, 0, -1];
export const previtHorizontal = [1, 1, 1, 0, 0, 0, -1, -1, -1];
export const previtVertical = [1, 0, -1, 1, 0, -1, 1, 0, -1];
export const boxBlur = [
	0.111,
	0.111,
	0.111,
	0.111,
	0.111,
	0.111,
	0.111,
	0.111,
	0.111,
];
export const triangleBlur = [
	0.0625,
	0.125,
	0.0625,
	0.125,
	0.25,
	0.125,
	0.0625,
	0.125,
	0.0625,
];
export const emboss = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
