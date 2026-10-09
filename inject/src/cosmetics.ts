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

import { BRAND_LOGO } from "./brand";

export type CosConfig = {
	cosEnabled: boolean;
	myScale: number;
	ballScale: number;
	ballColor: string; // "" = el original
	ballTrail: boolean;
	wmEnabled: boolean; // marca de agua en el centro de la cancha
	wmOpacity: number;
	wmSize: number; // en unidades del mapa
	wmLogo: string; // data URL ("" = escudo por defecto)
	lowPerformance: boolean;
	trajectoryEnabled: boolean;
	trajectoryLength: number;
	trajectoryColor: string;
	trajectoryWidth: number;
	assistShotAngles: boolean;
	assistPassLines: boolean;
	assistBallDistance: boolean;
	assistBlockedShot: boolean;
	assistTeamMode: "auto" | "red" | "blue";
	assistAttackDirection: "auto" | "left" | "right";
};

export const COS_DEFAULTS: CosConfig = {
	cosEnabled: true,
	myScale: 1,
	ballScale: 1,
	ballColor: "",
	ballTrail: false,
	wmEnabled: false,
	wmOpacity: 0.12,
	wmSize: 160,
	wmLogo: "",
	lowPerformance: false,
	trajectoryEnabled: false,
	trajectoryLength: 600,
	trajectoryColor: "#d0b878",
	trajectoryWidth: 2,
	assistShotAngles: false,
	assistPassLines: false,
	assistBallDistance: false,
	assistBlockedShot: false,
	assistTeamMode: "auto",
	assistAttackDirection: "auto",
};

const FULL = Math.PI * 2 - 0.01;
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export const predictReflectedPath = (
	x: number,
	y: number,
	vx: number,
	vy: number,
	distance: number,
	bounds: Bounds,
	radius: number
): [number, number][] => {
	const speed = Math.hypot(vx, vy);
	if (!Number.isFinite(speed) || speed < 0.01 || !Number.isFinite(distance) || distance <= 0) return [];
	const minX = bounds.minX + radius;
	const maxX = bounds.maxX - radius;
	const minY = bounds.minY + radius;
	const maxY = bounds.maxY - radius;
	if (minX >= maxX || minY >= maxY || x < minX || x > maxX || y < minY || y > maxY) return [];

	let px = x;
	let py = y;
	let dx = vx / speed;
	let dy = vy / speed;
	let remaining = distance;
	const points: [number, number][] = [];

	for (let reflection = 0; remaining > 0.01 && reflection < 128; reflection++) {
		const tx = dx > 0 ? (maxX - px) / dx : dx < 0 ? (minX - px) / dx : Infinity;
		const ty = dy > 0 ? (maxY - py) / dy : dy < 0 ? (minY - py) / dy : Infinity;
		const hit = Math.min(tx >= 0 ? tx : Infinity, ty >= 0 ? ty : Infinity);
		if (!Number.isFinite(hit) || hit >= remaining) {
			points.push([px + dx * remaining, py + dy * remaining]);
			break;
		}
		px += dx * hit;
		py += dy * hit;
		remaining -= hit;
		points.push([px, py]);
		const epsilon = 0.01;
		if (Math.abs(tx - hit) < epsilon) dx *= -1;
		if (Math.abs(ty - hit) < epsilon) dy *= -1;
	}
	return points;
};

export const smoothAimAngle = (
	previous: number | null,
	next: number,
	elapsedMs: number
): number => {
	if (previous === null || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return next;
	const delta = Math.atan2(Math.sin(next - previous), Math.cos(next - previous));
	if (Math.abs(delta) > Math.PI / 4) return next;
	const alpha = 1 - Math.exp(-Math.min(elapsedMs, 100) / 24);
	return previous + delta * alpha;
};

export type PlayerDisc = { x: number; y: number; radius: number; teamColor: string; own: boolean };

export const distanceToSegment = (
	x: number,
	y: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number
): number => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const lengthSquared = dx * dx + dy * dy;
	const t = lengthSquared === 0
		? 0
		: Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
	return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
};

export const teamColorMatches = (color: string, team: "red" | "blue"): boolean => {
	const value = color.trim().toLowerCase();
	let r = 0, g = 0, b = 0;
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	const rgb = value.match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
	if (hex) {
		r = parseInt(hex[1].slice(0, 2), 16);
		g = parseInt(hex[1].slice(2, 4), 16);
		b = parseInt(hex[1].slice(4, 6), 16);
	} else if (rgb) {
		r = Number(rgb[1]); g = Number(rgb[2]); b = Number(rgb[3]);
	} else {
		return team === "red" ? value === "red" : value === "blue";
	}
	return team === "red" ? r > b * 1.25 && r > g * 1.2 : b > r * 1.25 && b > g * 1.2;
};

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
	let wmDone = false;
	let wmImg: any = null;
	let wmSrc = "";
	let ballSample: { x: number; y: number; time: number } | null = null;
	let aimAngle: number | null = null;
	let aimUpdatedAt = 0;
	let fieldBounds: Bounds | null = null;
	let currentFramePlayers: PlayerDisc[] = [];
	let previousFramePlayers: PlayerDisc[] = [];
	let frameBallCaptured = false;
	const pathBounds = new WeakMap<object, Bounds>();
	const hasVisualAnalysis = (cfg: CosConfig | undefined): boolean =>
		!!cfg && !cfg.lowPerformance && (
			cfg.trajectoryEnabled || cfg.assistShotAngles || cfg.assistPassLines ||
			cfg.assistBallDistance || cfg.assistBlockedShot
		);
	const includePoint = (ctx: object, x: number, y: number): void => {
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;
		const current = pathBounds.get(ctx);
		if (current) {
			current.minX = Math.min(current.minX, x);
			current.minY = Math.min(current.minY, y);
			current.maxX = Math.max(current.maxX, x);
			current.maxY = Math.max(current.maxY, y);
		} else {
			pathBounds.set(ctx, { minX: x, minY: y, maxX: x, maxY: y });
		}
	};
	const drawAssistOverlay = (
		ctx: any,
		x: number,
		y: number,
		ballRadius: number,
		players: PlayerDisc[],
		cfg: CosConfig
	): void => {
		if (!fieldBounds || !hasVisualAnalysis(cfg) || cfg.lowPerformance) return;
		const own = players.find((player) => player.own);
		const teamIsKnown = !!own && (
			cfg.assistTeamMode !== "auto" ||
			teamColorMatches(own.teamColor, "red") ||
			teamColorMatches(own.teamColor, "blue")
		);
		const allies = own
			? players.filter((player) => player !== own && teamIsKnown && (
				cfg.assistTeamMode === "auto"
					? !!own.teamColor && player.teamColor.toLowerCase() === own.teamColor.toLowerCase()
					: teamColorMatches(player.teamColor, cfg.assistTeamMode)
			))
			: [];
		const opponents = own && teamIsKnown
			? players.filter((player) => player !== own && !allies.includes(player) && (
				cfg.assistTeamMode === "auto"
					? player.teamColor.toLowerCase() !== own.teamColor.toLowerCase()
					: teamColorMatches(player.teamColor, cfg.assistTeamMode === "red" ? "blue" : "red")
			))
			: [];
		const direction = cfg.assistAttackDirection === "left"
			? "left"
			: cfg.assistAttackDirection === "right"
				? "right"
				: own && (
					(cfg.assistTeamMode === "red" || (cfg.assistTeamMode === "auto" && teamColorMatches(own.teamColor, "red")))
						? "right"
						: ((cfg.assistTeamMode === "blue" || (cfg.assistTeamMode === "auto" && teamColorMatches(own.teamColor, "blue")))
							? "left"
							: null)
				);

		const blocked = (targetX: number, targetY: number): boolean =>
			opponents.some((player) =>
				distanceToSegment(player.x, player.y, x, y, targetX, targetY) < player.radius + ballRadius + 1
			);

		ctx.save();
		ctx.beginPath();
		(ctx as any).__hxVisualAssistDrawing = true;
		try {
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			if (cfg.assistBallDistance && own) {
				const distance = Math.round(Math.hypot(own.x - x, own.y - y));
				ctx.font = "bold 10px sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "bottom";
				ctx.fillStyle = "#ffffff";
				ctx.globalAlpha = 0.95;
				ctx.fillText(`${distance} u`, own.x, own.y - own.radius - 3);
			}

			if (direction && (cfg.assistShotAngles || cfg.assistBlockedShot)) {
				const goalX = direction === "right" ? fieldBounds.maxX : fieldBounds.minX;
				const centerY = (fieldBounds.minY + fieldBounds.maxY) / 2;
				const goalHalfHeight = Math.min(50, (fieldBounds.maxY - fieldBounds.minY) * 0.22);
				const top: [number, number] = [goalX, centerY - goalHalfHeight];
				const bottom: [number, number] = [goalX, centerY + goalHalfHeight];
				if (cfg.assistShotAngles) {
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(top[0], top[1]);
					ctx.moveTo(x, y);
					ctx.lineTo(bottom[0], bottom[1]);
					ctx.strokeStyle = "#42d4f4";
					ctx.lineWidth = 1.5;
					ctx.globalAlpha = 0.48;
					ctx.setLineDash([5, 5]);
					ctx.stroke();
					ctx.setLineDash([]);
				}
				if (cfg.assistBlockedShot && own) {
					const targetY = Math.max(centerY - goalHalfHeight + ballRadius, Math.min(centerY + goalHalfHeight - ballRadius, y));
					const isBlocked = blocked(goalX, targetY);
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(goalX, targetY);
					ctx.strokeStyle = isBlocked ? "#ff5268" : "#6ee7a8";
					ctx.lineWidth = 2;
					ctx.globalAlpha = 0.78;
					ctx.setLineDash([7, 5]);
					ctx.stroke();
					ctx.setLineDash([]);
				}
			}

			if (cfg.assistPassLines && own && allies.length) {
				const targets = allies
					.filter((player) => !opponents.some((opponent) =>
						distanceToSegment(opponent.x, opponent.y, x, y, player.x, player.y) < opponent.radius + ballRadius
					))
					.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
					.slice(0, 2);
				for (const target of targets) {
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(target.x, target.y);
					ctx.strokeStyle = "#d0b878";
					ctx.lineWidth = 1.6;
					ctx.globalAlpha = 0.72;
					ctx.setLineDash([4, 4]);
					ctx.stroke();
				}
				ctx.setLineDash([]);
			}

		} finally {
			(ctx as any).__hxVisualAssistDrawing = false;
			ctx.restore();
			ctx.beginPath();
		}
	};

	if (typeof proto.beginPath === "function") {
		const baseBeginPath = proto.beginPath;
		proto.beginPath = function (this: any, ...args: any[]) {
			if (hasVisualAnalysis(getCfg()) && !(this as any).__hxVisualAssistDrawing) pathBounds.delete(this);
			return baseBeginPath.apply(this, args);
		};
	}
	for (const method of ["moveTo", "lineTo"] as const) {
		const base = proto[method];
		if (typeof base !== "function") continue;
		proto[method] = function (this: any, x: number, y: number, ...args: any[]) {
			if (hasVisualAnalysis(getCfg()) && !(this as any).__hxVisualAssistDrawing) includePoint(this, x, y);
			return base.call(this, x, y, ...args);
		};
	}
	for (const method of ["quadraticCurveTo", "bezierCurveTo"] as const) {
		const base = proto[method];
		if (typeof base !== "function") continue;
		proto[method] = function (this: any, ...args: number[]) {
			if (hasVisualAnalysis(getCfg()) && !(this as any).__hxVisualAssistDrawing) {
				for (let i = 0; i + 1 < args.length; i += 2) includePoint(this, args[i], args[i + 1]);
			}
			return base.apply(this, args);
		};
	}

	const maybeUpdateFieldBounds = (ctx: any): void => {
		const cfg = getCfg();
		if (!hasVisualAnalysis(cfg) || ctx.lineWidth !== 3 || !ctx.canvas) return;
		const candidate = pathBounds.get(ctx);
		if (!candidate || typeof ctx.getTransform !== "function") return;
		const transform = ctx.getTransform();
		const corners = [
			[candidate.minX, candidate.minY], [candidate.minX, candidate.maxY],
			[candidate.maxX, candidate.minY], [candidate.maxX, candidate.maxY],
		].map(([x, y]) => [transform.a * x! + transform.c * y! + transform.e, transform.b * x! + transform.d * y! + transform.f]);
		const xs = corners.map(([x]) => x!);
		const ys = corners.map(([, y]) => y!);
		const width = Math.max(...xs) - Math.min(...xs);
		const height = Math.max(...ys) - Math.min(...ys);
		if (width < ctx.canvas.width * 0.5 || height < ctx.canvas.height * 0.42) return;
		fieldBounds = candidate;
	};

	proto.stroke = function (this: any, ...args: any[]) {
		const cfg = getCfg();
		if ((this as any).__hxTrajectoryDrawing || (this as any).__hxVisualAssistDrawing) return baseStroke.apply(this, args);
		if (hasVisualAnalysis(cfg)) maybeUpdateFieldBounds(this);
		if ((cfg?.cosEnabled || hasVisualAnalysis(cfg)) && !cfg.lowPerformance && this.lineWidth === 3) {
			// el trazo del aro no reinicia el cuadro; los de la cancha si
			if (haloFresh) haloFresh = false;
			else {
				halo = null;
				ballDone = false;
				wmDone = false;
				frameBallCaptured = false;
			}
		}
		return baseStroke.apply(this, args);
	};

	proto.arc = function (this: any, x: number, y: number, r: number, s: number, e: number, ccw?: boolean) {
		const cfg = getCfg();
		if ((this as any).__hxVisualAssistDrawing) return baseArc.call(this, x, y, r, s, e, ccw);
		const analysis = hasVisualAnalysis(cfg) && !cfg?.lowPerformance;
		if (analysis) {
			includePoint(this, x - r, y - r);
			includePoint(this, x + r, y + r);
		}
		if (Math.abs(e - s) < FULL) return baseArc.call(this, x, y, r, s, e, ccw);
		const lw = this.lineWidth;
		if (lw === 3 && r >= 15 && r <= 40 && isWhite(this.strokeStyle)) {
			halo = [x, y];
			haloFresh = true;
			return baseArc.call(this, x, y, r, s, e, ccw);
		}
		const fill = this.fillStyle;
		if (analysis && lw === 2 && typeof fill === "object" && r >= 10 && r <= 20 && currentFramePlayers.length < 32) {
			const own = halo && Math.abs(x - halo[0]) < 0.6 && Math.abs(y - halo[1]) < 0.6;
			currentFramePlayers.push({
				x,
				y,
				radius: r,
				teamColor: typeof this.strokeStyle === "string" ? this.strokeStyle : "",
				own: !!own,
			});
		}
		if (analysis && !frameBallCaptured && this.lineWidth === 2 && typeof this.fillStyle === "string") {
			frameBallCaptured = true;
			previousFramePlayers = currentFramePlayers;
			currentFramePlayers = [];
			let vx = 0, vy = 0;
			const now = win.performance.now();
			if (ballSample) {
				const elapsed = (now - ballSample.time) / 1000;
				const distance = Math.hypot(x - ballSample.x, y - ballSample.y);
				if (elapsed >= 0.005 && elapsed <= 0.2 && distance >= 0.05 && distance <= 180) {
					vx = (x - ballSample.x) / elapsed;
					vy = (y - ballSample.y) / elapsed;
				}
			}
			const own = previousFramePlayers.find((player) => player.own);
			const touchDx = own ? x - own.x : 0;
			const touchDy = own ? y - own.y : 0;
			const touchDistance = Math.hypot(touchDx, touchDy);
			const touchingBall = !!own && touchDistance <= own.radius + r + 4;
			const kickDx = touchDistance > 0.1 ? touchDx : vx;
			const kickDy = touchDistance > 0.1 ? touchDy : vy;
			if (cfg?.trajectoryEnabled && !cfg.lowPerformance && touchingBall && Math.hypot(kickDx, kickDy) > 0) {
				aimAngle = smoothAimAngle(aimAngle, Math.atan2(kickDy, kickDx), aimUpdatedAt ? now - aimUpdatedAt : 0);
				aimUpdatedAt = now;
			} else {
				aimAngle = null;
				aimUpdatedAt = 0;
			}
			if (aimAngle !== null && fieldBounds && cfg?.trajectoryEnabled && !cfg.lowPerformance) {
				const points = predictReflectedPath(
					x, y, Math.cos(aimAngle), Math.sin(aimAngle), cfg.trajectoryLength, fieldBounds, r
				);
				if (points.length) {
					this.save();
					this.beginPath();
					this.moveTo(x, y);
					for (const [px, py] of points) this.lineTo(px, py);
					this.strokeStyle = cfg.trajectoryColor;
					this.lineWidth = cfg.trajectoryWidth;
					this.globalAlpha = 0.88;
					this.lineCap = "round";
					this.lineJoin = "round";
					this.setLineDash([]);
					(this as any).__hxTrajectoryDrawing = true;
					try {
						this.stroke();
					} finally {
						(this as any).__hxTrajectoryDrawing = false;
						this.restore();
					}
					this.beginPath();
				}
			}
			drawAssistOverlay(this, x, y, r, previousFramePlayers, cfg!);
			ballSample = { x, y, time: now };
		} else if (!analysis) {
			ballSample = null;
			aimAngle = null;
			aimUpdatedAt = 0;
			currentFramePlayers = [];
			previousFramePlayers = [];
		}
		if (!cfg?.cosEnabled || cfg.lowPerformance || Math.abs(e - s) < FULL) return baseArc.call(this, x, y, r, s, e, ccw);
		pendingK = 0;

		if (lw !== 2) return baseArc.call(this, x, y, r, s, e, ccw);

		// marca de agua: una vez por cuadro, antes de los discos, en el centro del mapa (0,0)
		if (!wmDone) {
			wmDone = true;
			if (cfg.wmEnabled) {
				const src = cfg.wmLogo || BRAND_LOGO;
				if (!wmImg || wmSrc !== src) {
					wmSrc = src;
					wmImg = new win.Image();
					wmImg.src = src;
				}
				if (wmImg.complete && wmImg.naturalWidth) {
					this.save();
					this.globalAlpha = cfg.wmOpacity;
					this.drawImage(wmImg, -cfg.wmSize / 2, -cfg.wmSize / 2, cfg.wmSize, cfg.wmSize);
					this.restore();
				}
			}
		}

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
		if ((this as any).__hxVisualAssistDrawing) return baseFill.apply(this, args);
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
