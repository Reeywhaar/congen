import * as tools from "./jslib/tools.js";
import { C } from "./jslib/ctools.js";
import * as filters from "./jslib/filters.js";
import { effects } from "./jslib/programs.js";

function getImages() {
	return fetch("./api/list.php").then(req => req.json());
}

function readImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => {
			if (image.width === 0 || image.height === 0) {
				reject(new Error(`Unable to get image ${url}`));
				return;
			}
			resolve(image);
		});
		image.addEventListener("error", e => {
			reject(new Error(`Unable to get image ${url}`));
		});
		image.src = url;
		setTimeout(() => {
			reject(new Error(`Unable to get image ${url}`));
		}, 2000);
	});
}

async function main() {
	const canvas = document.querySelector("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const c = new C(
		canvas.getContext("webgl", {
			preserveDrawingBuffer:
				location.search.indexOf("nopreserve") > -1 ? false : true,
		})
	);
	const images = await getImages();

	const controlsEl = document.querySelector(".controls");
	const winput = document.querySelector(".winput");
	const hinput = document.querySelector(".hinput");
	const zinput = document.querySelector(".zinput");
	const txinput = document.querySelector(".txinput");
	const tyinput = document.querySelector(".tyinput");
	const sel = document.querySelector(".src");
	const appliedFilters = document.querySelector(".applied-filters");
	const filterStack = document.querySelector(".filter-stack");
	const distributionInput = document.querySelector(".distributioninput");
	const genb = document.querySelector(".genb");
	const difb = document.querySelector(".difb");
	const maskTileSizeInput = document.querySelector(".mask-tiles__value");
	const saturationInput = document.querySelector(".saturationInput");
	const contrastInput = document.querySelector(".contrastInput");
	const brightnessInput = document.querySelector(".brightnessInput");
	const downloadButton = document.querySelector(".downloadb");
	const droppedImageEl = document.querySelector(".dropped-image__container");
	const fire = tools.debounce(() => {
		genb.click();
	}, 200);

	controlsEl.addEventListener("mouseleave", e => {
		controlsEl.classList.add("hideable");
	});

	downloadButton.addEventListener("click", async () => {
		const blob = await new Promise((resolve, reject) => {
			try {
				canvas.toBlob(
					result => {
						if (!result) reject(new Error("No result"));
						resolve(result);
					},
					"image/jpeg",
					0.9
				);
			} catch (e) {
				reject(e);
			}
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.download = "congen-texture.jpg";
		a.style.display = "none";
		a.href = url;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	});

	[
		winput,
		hinput,
		zinput,
		txinput,
		tyinput,
		distributionInput,
		maskTileSizeInput,
	].forEach(e => {
		e.addEventListener("keydown", e => {
			if (e.which === 71) e.preventDefault();
			if (e.which === 13) {
				fire();
			}
		});
	});

	document.addEventListener("keydown", e => {
		// 71 is g
		if (e.which === 71) fire();
	});

	images.forEach(src => {
		const opt = document.createElement("option");
		opt.value = src;
		opt.innerText = src.substr(src.lastIndexOf("/") + 1);
		sel.appendChild(opt);
	});

	let droppedImage;
	let selectedImage = await readImage(
		sel.options[sel.selectedIndex].value
	).catch(e => {
		throw e;
	});

	sel.addEventListener("change", async () => {
		selectedImage = await readImage(sel.options[sel.selectedIndex].value).catch(
			e => {
				throw e;
			}
		);
	});

	document.body.addEventListener("dragover", e => {
		e.preventDefault();
	});

	document.body.addEventListener("drop", async e => {
		e.preventDefault();
		if (!e.dataTransfer.files[0]) return;
		const name = e.dataTransfer.files[0].name;
		const url = URL.createObjectURL(e.dataTransfer.files[0]);
		droppedImage = await readImage(url);

		const el = document.createElement("span");
		el.innerText = `Uploaded image: ${name}`;
		el.addEventListener("click", () => {
			droppedImageEl.removeChild(el);
			droppedImage = null;
		});
		droppedImageEl.innerHTML = "";
		droppedImageEl.appendChild(el);
	});

	Object.keys(filters).forEach(filter => {
		const opt = document.createElement("div");
		opt.classList.add("filter-item");
		opt.innerText = filter;
		opt.addEventListener("click", e => {
			const el = document.createElement("div");
			el.innerText = opt.innerText;
			el.classList.add("filter-item");
			el.addEventListener("click", e => {
				appliedFilters.removeChild(el);
			});
			appliedFilters.appendChild(el);
		});
		filterStack.appendChild(opt);
	});

	genb.addEventListener("click", async e => {
		const max = 20000;
		canvas.width = Math.min(
			parseInt(winput.value, 10) || window.innerWidth,
			max
		);
		canvas.height = Math.min(
			parseInt(hinput.value, 10) || window.innerHeight,
			max
		);
		const image = droppedImage || selectedImage;
		const tileX =
			Math.min(parseInt(txinput.value, 10), image.width) || canvas.width / 8;
		const tileY =
			Math.min(parseInt(tyinput.value, 10), image.width) || canvas.width / 8;
		const maskTileSize = parseInt(maskTileSizeInput.value, 10) || 0;
		const distribution = parseInt(distributionInput.value, 10);
		const scale = 1 / (parseFloat(zinput.value) || 1);
		const saturation = parseFloat(saturationInput.value) || 0;
		const contrast = parseFloat(contrastInput.value) || 0;
		const brightness = parseFloat(brightnessInput.value) || 0;
		const appliedEffects = Array.from(appliedFilters.childNodes)
			.map(x => x.innerText)
			.map(x => filters[x]);

		let texture = c.createTexture(image);
		texture = await c.tile(texture, {
			scale: scale,
			srcWidth: tileX,
			srcHeight: tileY,
			dstWidth: canvas.width + distribution * 2,
			dstHeight: canvas.height + distribution * 2,
		});
		if (maskTileSize > 0) {
			texture = c.maskTiles(
				texture,
				tileX * scale,
				tileY * scale,
				maskTileSize
			);
		}
		if (distribution > 0) {
			texture = c.diffuse(texture, distribution);
		}
		if (appliedEffects.length > 0) {
			texture = c.applyEffects(texture, appliedEffects);
		}
		if (saturation || brightness || contrast) {
			texture = c.adjust(texture, saturation, contrast, brightness);
		}
		c.render(texture, {
			srcX: distribution,
			srcY: -distribution,
		});
	});

	genb.click();
}

main().catch(e => console.error(e));
