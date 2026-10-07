// cosmetics.ts
// Extras VISUALES del canvas del juego: tamaño dibujado de TU ficha y de la pelota, color de la
// pelota y estela. No tocan la fisica ni la red: los choques los decide la sala con los tamaños
// reales, asi que lo que ves es solo una "piel". Cada llamada hace una comprobacion barata y,
// con todo en valores neutros o apagado, delega directo al metodo original.
//
// Como se reconoce lo dibujado (mismo orden que usa el renderer de HaxBall):
//   * Tu ficha: el juego dibuja un aro blanco (lineWidth 3) justo antes de los discos, en tu
//     misma posicion; el disco de jugador relleno con patron que cae en ese punto es el tuyo.
//   * Pelota: primer disco con relleno de color (no patron) y lineWidth 2 de cada cuadro.

export type CosConfig = {
	cosEnabled: boolean;
	myScale: number;
	ballScale: number;
	ballColor: string; // "" = el original
	ballTrail: boolean;
};

export const COS_DEFAULTS: CosConfig = {
	cosEnabled: true,
	myScale: 1,
	ballScale: 1,
	ballColor: "",
	ballTrail: false,
};

const FULL = Math.PI * 2 - 0.01;
const isWhite = (s: any): boolean =>
	typeof s === "string" && ["#ffffff", "#fff", "white", "rgb(255, 255, 255)"].includes(s.toLowerCase());

export const installCosmetics = (win: any, getCfg: () => CosConfig | undefined): void => {
	const proto = win.CanvasRenderingContext2D?.prototype;
	if (!proto || typeof proto.arc !== "function") return;

	const baseArc = proto.arc;
	const baseStroke = proto.stroke;
	const baseFill = proto.fill;

	let halo: [number, number] | null = null;
	let haloFresh = false;
	let ballDone = false;
	let pendingK = 0; // escala extra para el relleno (patron) de mi ficha
	let trail: [number, number][] = [];

	proto.stroke = function (this: any, ...args: any[]) {
		const cfg = getCfg();
		if (cfg?.cosEnabled && this.lineWidth === 3) {
			// el trazo del aro no reinicia el cuadro; los de la cancha si
			if (haloFresh) haloFresh = false;
			else { halo = null; ballDone = false; }
		}
		return baseStroke.apply(this, args);
	};

	proto.arc = function (this: any, x: number, y: number, r: number, s: number, e: number, ccw?: boolean) {
		const cfg = getCfg();
		if (!cfg?.cosEnabled || Math.abs(e - s) < FULL) return baseArc.call(this, x, y, r, s, e, ccw);
		pendingK = 0;

		const lw = this.lineWidth;
		if (lw === 3 && r >= 15 && r <= 40 && isWhite(this.strokeStyle)) {
			halo = [x, y];
			haloFresh = true;
			return baseArc.call(this, x, y, r, s, e, ccw);
		}
		if (lw !== 2) return baseArc.call(this, x, y, r, s, e, ccw);

		const fill = this.fillStyle;
		if (typeof fill === "object") {
			// disco de jugador (patron): ¿es el mio?
			if (halo && cfg.myScale !== 1 && Math.abs(x - halo[0]) < 0.6 && Math.abs(y - halo[1]) < 0.6) {
				pendingK = cfg.myScale;
				return baseArc.call(this, x, y, r * cfg.myScale, s, e, ccw);
			}
		} else if (!ballDone && typeof fill === "string") {
			ballDone = true;
			const color = cfg.ballColor || fill;
			if (cfg.ballTrail) {
				const last = trail[trail.length - 1];
				if (last && Math.hypot(last[0] - x, last[1] - y) > 250) trail = []; // salto (gol / reinicio)
				if (!last || Math.hypot(last[0] - x, last[1] - y) > 0.5) trail.push([x, y]);
				if (trail.length > 18) trail.shift();
				const n = trail.length - 1;
				this.save();
				this.fillStyle = color;
				for (let i = 0; i < n; i++) {
					const t = (i + 1) / (n + 1);
					this.globalAlpha = t * 0.4;
					this.beginPath();
					baseArc.call(this, trail[i][0], trail[i][1], r * cfg.ballScale * (0.35 + 0.65 * t), 0, Math.PI * 2, false);
					this.fill();
				}
				this.restore();
				this.beginPath();
			} else if (trail.length) {
				trail = [];
			}
			if (cfg.ballColor) this.fillStyle = cfg.ballColor;
			return baseArc.call(this, x, y, r * cfg.ballScale, s, e, ccw);
		}
		return baseArc.call(this, x, y, r, s, e, ccw);
	};

	// El avatar de mi ficha se rellena con un patron de 64x64 escalado por radio/32; si agrando
	// el circulo, agrando tambien el patron (M' = M · T(32,32) · S(k) · T(-32,-32)).
	proto.fill = function (this: any, ...args: any[]) {
		if (pendingK && pendingK !== 1) {
			const k = pendingK;
			pendingK = 0;
			this.translate(32, 32);
			this.scale(k, k);
			this.translate(-32, -32);
		}
		return baseFill.apply(this, args);
	};
};
