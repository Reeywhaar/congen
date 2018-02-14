import * as tools from "./jslib/tools.js";
import { C } from "./jslib/ctools.js";
import * as filters from "./jslib/filters.js";
import { effects } from "./jslib/programs.js";

function getImages() {
	return fetch("./api/list.php").then(req => req.json());
}

async function readImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => {
			resolve(image);
		});
		image.src = url;
	});
}

function getShaders() {
	return fetch("./api/shaders.php").then(req => req.json());
}

function getShader(name) {
	return fetch(`./shaders/${name}.glslx`).then(req => {
		if (req.status < 200 || req.status >= 400)
			throw new Error(`request failed with code ${req.status}`);
		return req.text();
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
	const downloadButton = document.querySelector(".downloadb");
	const fire = tools.debounce(() => {
		genb.click();
	}, 500);

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

	[winput, hinput, zinput, txinput, tyinput, distributionInput].forEach(e => {
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
		opt.innerText = src;
		sel.appendChild(opt);
	});

	document.body.addEventListener("dragover", e => {
		e.preventDefault();
	});

	document.body.addEventListener("drop", e => {
		e.preventDefault();
		if (!e.dataTransfer.files[0]) return;
		console.log(e.dataTransfer.files[0]);
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
		const image = await readImage(sel.options[sel.selectedIndex].text);
		const tileX =
			Math.min(parseInt(txinput.value, 10), image.width) || canvas.width / 8;
		const tileY =
			Math.min(parseInt(tyinput.value, 10), image.width) || canvas.width / 8;
		const distribution = parseInt(distributionInput.value, 10);
		const scale = 1 / (parseFloat(zinput.value, 10) || 1);
		const appliedEffects = Array.from(appliedFilters.childNodes)
			.map(x => x.innerText)
			.map(x => filters[x]);
		c.clear();
		let texture = c.createTexture(image);
		texture = await c.tile(texture, {
			scale: scale,
			srcWidth: tileX,
			srcHeight: tileY,
			dstWidth: canvas.width,
			dstHeight: canvas.height,
		});
		if (distribution > 0) {
			texture = c.diffuse(texture, distribution);
		}
		if (appliedEffects.length > 0) {
			texture = c.applyEffects(texture, appliedEffects);
		}
		c.render(texture);
	});
}

main().catch(e => console.error(e));
