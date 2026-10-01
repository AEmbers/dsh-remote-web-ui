window.__ModuleLoader__.load({
	id: "@linxin666/dsh-remote-web-ui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp$1 = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp$1.call(to, key) && key !== except) __defProp$1(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp$1(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_dom_client = require("react-dom/client");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region ../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/qrcode.react@4.2.0_react@18.3.1/node_modules/qrcode.react/lib/esm/index.js
		var __defProp = Object.defineProperty;
		var __getOwnPropSymbols = Object.getOwnPropertySymbols;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __propIsEnum = Object.prototype.propertyIsEnumerable;
		var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
			enumerable: true,
			configurable: true,
			writable: true,
			value
		}) : obj[key] = value;
		var __spreadValues = (a, b) => {
			for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
			if (__getOwnPropSymbols) {
				for (var prop of __getOwnPropSymbols(b)) if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
			}
			return a;
		};
		var __objRest = (source, exclude) => {
			var target = {};
			for (var prop in source) if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
			if (source != null && __getOwnPropSymbols) {
				for (var prop of __getOwnPropSymbols(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop)) target[prop] = source[prop];
			}
			return target;
		};
		/**
		* @license QR Code generator library (TypeScript)
		* Copyright (c) Project Nayuki.
		* SPDX-License-Identifier: MIT
		*/
		var qrcodegen;
		((qrcodegen2) => {
			const _QrCode = class _QrCode {
				constructor(version, errorCorrectionLevel, dataCodewords, msk) {
					this.version = version;
					this.errorCorrectionLevel = errorCorrectionLevel;
					this.modules = [];
					this.isFunction = [];
					if (version < _QrCode.MIN_VERSION || version > _QrCode.MAX_VERSION) throw new RangeError("Version value out of range");
					if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range");
					this.size = version * 4 + 17;
					let row = [];
					for (let i = 0; i < this.size; i++) row.push(false);
					for (let i = 0; i < this.size; i++) {
						this.modules.push(row.slice());
						this.isFunction.push(row.slice());
					}
					this.drawFunctionPatterns();
					const allCodewords = this.addEccAndInterleave(dataCodewords);
					this.drawCodewords(allCodewords);
					if (msk == -1) {
						let minPenalty = 1e9;
						for (let i = 0; i < 8; i++) {
							this.applyMask(i);
							this.drawFormatBits(i);
							const penalty = this.getPenaltyScore();
							if (penalty < minPenalty) {
								msk = i;
								minPenalty = penalty;
							}
							this.applyMask(i);
						}
					}
					assert(0 <= msk && msk <= 7);
					this.mask = msk;
					this.applyMask(msk);
					this.drawFormatBits(msk);
					this.isFunction = [];
				}
				static encodeText(text, ecl) {
					const segs = qrcodegen2.QrSegment.makeSegments(text);
					return _QrCode.encodeSegments(segs, ecl);
				}
				static encodeBinary(data, ecl) {
					const seg = qrcodegen2.QrSegment.makeBytes(data);
					return _QrCode.encodeSegments([seg], ecl);
				}
				static encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
					if (!(_QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= _QrCode.MAX_VERSION) || mask < -1 || mask > 7) throw new RangeError("Invalid value");
					let version;
					let dataUsedBits;
					for (version = minVersion;; version++) {
						const dataCapacityBits2 = _QrCode.getNumDataCodewords(version, ecl) * 8;
						const usedBits = QrSegment.getTotalBits(segs, version);
						if (usedBits <= dataCapacityBits2) {
							dataUsedBits = usedBits;
							break;
						}
						if (version >= maxVersion) throw new RangeError("Data too long");
					}
					for (const newEcl of [
						_QrCode.Ecc.MEDIUM,
						_QrCode.Ecc.QUARTILE,
						_QrCode.Ecc.HIGH
					]) if (boostEcl && dataUsedBits <= _QrCode.getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
					let bb = [];
					for (const seg of segs) {
						appendBits(seg.mode.modeBits, 4, bb);
						appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
						for (const b of seg.getData()) bb.push(b);
					}
					assert(bb.length == dataUsedBits);
					const dataCapacityBits = _QrCode.getNumDataCodewords(version, ecl) * 8;
					assert(bb.length <= dataCapacityBits);
					appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
					appendBits(0, (8 - bb.length % 8) % 8, bb);
					assert(bb.length % 8 == 0);
					for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 253) appendBits(padByte, 8, bb);
					let dataCodewords = [];
					while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0);
					bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
					return new _QrCode(version, ecl, dataCodewords, mask);
				}
				getModule(x, y) {
					return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
				}
				getModules() {
					return this.modules;
				}
				drawFunctionPatterns() {
					for (let i = 0; i < this.size; i++) {
						this.setFunctionModule(6, i, i % 2 == 0);
						this.setFunctionModule(i, 6, i % 2 == 0);
					}
					this.drawFinderPattern(3, 3);
					this.drawFinderPattern(this.size - 4, 3);
					this.drawFinderPattern(3, this.size - 4);
					const alignPatPos = this.getAlignmentPatternPositions();
					const numAlign = alignPatPos.length;
					for (let i = 0; i < numAlign; i++) for (let j = 0; j < numAlign; j++) if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)) this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
					this.drawFormatBits(0);
					this.drawVersion();
				}
				drawFormatBits(mask) {
					const data = this.errorCorrectionLevel.formatBits << 3 | mask;
					let rem = data;
					for (let i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 1335;
					const bits = (data << 10 | rem) ^ 21522;
					assert(bits >>> 15 == 0);
					for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
					this.setFunctionModule(8, 7, getBit(bits, 6));
					this.setFunctionModule(8, 8, getBit(bits, 7));
					this.setFunctionModule(7, 8, getBit(bits, 8));
					for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
					for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
					for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
					this.setFunctionModule(8, this.size - 8, true);
				}
				drawVersion() {
					if (this.version < 7) return;
					let rem = this.version;
					for (let i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 7973;
					const bits = this.version << 12 | rem;
					assert(bits >>> 18 == 0);
					for (let i = 0; i < 18; i++) {
						const color = getBit(bits, i);
						const a = this.size - 11 + i % 3;
						const b = Math.floor(i / 3);
						this.setFunctionModule(a, b, color);
						this.setFunctionModule(b, a, color);
					}
				}
				drawFinderPattern(x, y) {
					for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
						const dist = Math.max(Math.abs(dx), Math.abs(dy));
						const xx = x + dx;
						const yy = y + dy;
						if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size) this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
					}
				}
				drawAlignmentPattern(x, y) {
					for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
				}
				setFunctionModule(x, y, isDark) {
					this.modules[y][x] = isDark;
					this.isFunction[y][x] = true;
				}
				addEccAndInterleave(data) {
					const ver = this.version;
					const ecl = this.errorCorrectionLevel;
					if (data.length != _QrCode.getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid argument");
					const numBlocks = _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
					const blockEccLen = _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
					const rawCodewords = Math.floor(_QrCode.getNumRawDataModules(ver) / 8);
					const numShortBlocks = numBlocks - rawCodewords % numBlocks;
					const shortBlockLen = Math.floor(rawCodewords / numBlocks);
					let blocks = [];
					const rsDiv = _QrCode.reedSolomonComputeDivisor(blockEccLen);
					for (let i = 0, k = 0; i < numBlocks; i++) {
						let dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
						k += dat.length;
						const ecc = _QrCode.reedSolomonComputeRemainder(dat, rsDiv);
						if (i < numShortBlocks) dat.push(0);
						blocks.push(dat.concat(ecc));
					}
					let result = [];
					for (let i = 0; i < blocks[0].length; i++) blocks.forEach((block, j) => {
						if (i != shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
					});
					assert(result.length == rawCodewords);
					return result;
				}
				drawCodewords(data) {
					if (data.length != Math.floor(_QrCode.getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument");
					let i = 0;
					for (let right = this.size - 1; right >= 1; right -= 2) {
						if (right == 6) right = 5;
						for (let vert = 0; vert < this.size; vert++) for (let j = 0; j < 2; j++) {
							const x = right - j;
							const y = (right + 1 & 2) == 0 ? this.size - 1 - vert : vert;
							if (!this.isFunction[y][x] && i < data.length * 8) {
								this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
								i++;
							}
						}
					}
					assert(i == data.length * 8);
				}
				applyMask(mask) {
					if (mask < 0 || mask > 7) throw new RangeError("Mask value out of range");
					for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
						let invert;
						switch (mask) {
							case 0:
								invert = (x + y) % 2 == 0;
								break;
							case 1:
								invert = y % 2 == 0;
								break;
							case 2:
								invert = x % 3 == 0;
								break;
							case 3:
								invert = (x + y) % 3 == 0;
								break;
							case 4:
								invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;
								break;
							case 5:
								invert = x * y % 2 + x * y % 3 == 0;
								break;
							case 6:
								invert = (x * y % 2 + x * y % 3) % 2 == 0;
								break;
							case 7:
								invert = ((x + y) % 2 + x * y % 3) % 2 == 0;
								break;
							default: throw new Error("Unreachable");
						}
						if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
					}
				}
				getPenaltyScore() {
					let result = 0;
					for (let y = 0; y < this.size; y++) {
						let runColor = false;
						let runX = 0;
						let runHistory = [
							0,
							0,
							0,
							0,
							0,
							0,
							0
						];
						for (let x = 0; x < this.size; x++) if (this.modules[y][x] == runColor) {
							runX++;
							if (runX == 5) result += _QrCode.PENALTY_N1;
							else if (runX > 5) result++;
						} else {
							this.finderPenaltyAddHistory(runX, runHistory);
							if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
							runColor = this.modules[y][x];
							runX = 1;
						}
						result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * _QrCode.PENALTY_N3;
					}
					for (let x = 0; x < this.size; x++) {
						let runColor = false;
						let runY = 0;
						let runHistory = [
							0,
							0,
							0,
							0,
							0,
							0,
							0
						];
						for (let y = 0; y < this.size; y++) if (this.modules[y][x] == runColor) {
							runY++;
							if (runY == 5) result += _QrCode.PENALTY_N1;
							else if (runY > 5) result++;
						} else {
							this.finderPenaltyAddHistory(runY, runHistory);
							if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
							runColor = this.modules[y][x];
							runY = 1;
						}
						result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * _QrCode.PENALTY_N3;
					}
					for (let y = 0; y < this.size - 1; y++) for (let x = 0; x < this.size - 1; x++) {
						const color = this.modules[y][x];
						if (color == this.modules[y][x + 1] && color == this.modules[y + 1][x] && color == this.modules[y + 1][x + 1]) result += _QrCode.PENALTY_N2;
					}
					let dark = 0;
					for (const row of this.modules) dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
					const total = this.size * this.size;
					const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
					assert(0 <= k && k <= 9);
					result += k * _QrCode.PENALTY_N4;
					assert(0 <= result && result <= 2568888);
					return result;
				}
				getAlignmentPatternPositions() {
					if (this.version == 1) return [];
					else {
						const numAlign = Math.floor(this.version / 7) + 2;
						const step = this.version == 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
						let result = [6];
						for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
						return result;
					}
				}
				static getNumRawDataModules(ver) {
					if (ver < _QrCode.MIN_VERSION || ver > _QrCode.MAX_VERSION) throw new RangeError("Version number out of range");
					let result = (16 * ver + 128) * ver + 64;
					if (ver >= 2) {
						const numAlign = Math.floor(ver / 7) + 2;
						result -= (25 * numAlign - 10) * numAlign - 55;
						if (ver >= 7) result -= 36;
					}
					assert(208 <= result && result <= 29648);
					return result;
				}
				static getNumDataCodewords(ver, ecl) {
					return Math.floor(_QrCode.getNumRawDataModules(ver) / 8) - _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
				}
				static reedSolomonComputeDivisor(degree) {
					if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
					let result = [];
					for (let i = 0; i < degree - 1; i++) result.push(0);
					result.push(1);
					let root = 1;
					for (let i = 0; i < degree; i++) {
						for (let j = 0; j < result.length; j++) {
							result[j] = _QrCode.reedSolomonMultiply(result[j], root);
							if (j + 1 < result.length) result[j] ^= result[j + 1];
						}
						root = _QrCode.reedSolomonMultiply(root, 2);
					}
					return result;
				}
				static reedSolomonComputeRemainder(data, divisor) {
					let result = divisor.map((_) => 0);
					for (const b of data) {
						const factor = b ^ result.shift();
						result.push(0);
						divisor.forEach((coef, i) => result[i] ^= _QrCode.reedSolomonMultiply(coef, factor));
					}
					return result;
				}
				static reedSolomonMultiply(x, y) {
					if (x >>> 8 != 0 || y >>> 8 != 0) throw new RangeError("Byte out of range");
					let z = 0;
					for (let i = 7; i >= 0; i--) {
						z = z << 1 ^ (z >>> 7) * 285;
						z ^= (y >>> i & 1) * x;
					}
					assert(z >>> 8 == 0);
					return z;
				}
				finderPenaltyCountPatterns(runHistory) {
					const n = runHistory[1];
					assert(n <= this.size * 3);
					const core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
					return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
				}
				finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
					if (currentRunColor) {
						this.finderPenaltyAddHistory(currentRunLength, runHistory);
						currentRunLength = 0;
					}
					currentRunLength += this.size;
					this.finderPenaltyAddHistory(currentRunLength, runHistory);
					return this.finderPenaltyCountPatterns(runHistory);
				}
				finderPenaltyAddHistory(currentRunLength, runHistory) {
					if (runHistory[0] == 0) currentRunLength += this.size;
					runHistory.pop();
					runHistory.unshift(currentRunLength);
				}
			};
			_QrCode.MIN_VERSION = 1;
			_QrCode.MAX_VERSION = 40;
			_QrCode.PENALTY_N1 = 3;
			_QrCode.PENALTY_N2 = 3;
			_QrCode.PENALTY_N3 = 40;
			_QrCode.PENALTY_N4 = 10;
			_QrCode.ECC_CODEWORDS_PER_BLOCK = [
				[
					-1,
					7,
					10,
					15,
					20,
					26,
					18,
					20,
					24,
					30,
					18,
					20,
					24,
					26,
					30,
					22,
					24,
					28,
					30,
					28,
					28,
					28,
					28,
					30,
					30,
					26,
					28,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30
				],
				[
					-1,
					10,
					16,
					26,
					18,
					24,
					16,
					18,
					22,
					22,
					26,
					30,
					22,
					22,
					24,
					24,
					28,
					28,
					26,
					26,
					26,
					26,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28,
					28
				],
				[
					-1,
					13,
					22,
					18,
					26,
					18,
					24,
					18,
					22,
					20,
					24,
					28,
					26,
					24,
					20,
					30,
					24,
					28,
					28,
					26,
					30,
					28,
					30,
					30,
					30,
					30,
					28,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30
				],
				[
					-1,
					17,
					28,
					22,
					16,
					22,
					28,
					26,
					26,
					24,
					28,
					24,
					28,
					22,
					24,
					24,
					30,
					28,
					28,
					26,
					28,
					30,
					24,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30,
					30
				]
			];
			_QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
				[
					-1,
					1,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					4,
					4,
					4,
					4,
					4,
					6,
					6,
					6,
					6,
					7,
					8,
					8,
					9,
					9,
					10,
					12,
					12,
					12,
					13,
					14,
					15,
					16,
					17,
					18,
					19,
					19,
					20,
					21,
					22,
					24,
					25
				],
				[
					-1,
					1,
					1,
					1,
					2,
					2,
					4,
					4,
					4,
					5,
					5,
					5,
					8,
					9,
					9,
					10,
					10,
					11,
					13,
					14,
					16,
					17,
					17,
					18,
					20,
					21,
					23,
					25,
					26,
					28,
					29,
					31,
					33,
					35,
					37,
					38,
					40,
					43,
					45,
					47,
					49
				],
				[
					-1,
					1,
					1,
					2,
					2,
					4,
					4,
					6,
					6,
					8,
					8,
					8,
					10,
					12,
					16,
					12,
					17,
					16,
					18,
					21,
					20,
					23,
					23,
					25,
					27,
					29,
					34,
					34,
					35,
					38,
					40,
					43,
					45,
					48,
					51,
					53,
					56,
					59,
					62,
					65,
					68
				],
				[
					-1,
					1,
					1,
					2,
					4,
					4,
					4,
					5,
					6,
					8,
					8,
					11,
					11,
					16,
					16,
					18,
					16,
					19,
					21,
					25,
					25,
					25,
					34,
					30,
					32,
					35,
					37,
					40,
					42,
					45,
					48,
					51,
					54,
					57,
					60,
					63,
					66,
					70,
					74,
					77,
					81
				]
			];
			qrcodegen2.QrCode = _QrCode;
			function appendBits(val, len, bb) {
				if (len < 0 || len > 31 || val >>> len != 0) throw new RangeError("Value out of range");
				for (let i = len - 1; i >= 0; i--) bb.push(val >>> i & 1);
			}
			function getBit(x, i) {
				return (x >>> i & 1) != 0;
			}
			function assert(cond) {
				if (!cond) throw new Error("Assertion error");
			}
			const _QrSegment = class _QrSegment {
				constructor(mode, numChars, bitData) {
					this.mode = mode;
					this.numChars = numChars;
					this.bitData = bitData;
					if (numChars < 0) throw new RangeError("Invalid argument");
					this.bitData = bitData.slice();
				}
				static makeBytes(data) {
					let bb = [];
					for (const b of data) appendBits(b, 8, bb);
					return new _QrSegment(_QrSegment.Mode.BYTE, data.length, bb);
				}
				static makeNumeric(digits) {
					if (!_QrSegment.isNumeric(digits)) throw new RangeError("String contains non-numeric characters");
					let bb = [];
					for (let i = 0; i < digits.length;) {
						const n = Math.min(digits.length - i, 3);
						appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
						i += n;
					}
					return new _QrSegment(_QrSegment.Mode.NUMERIC, digits.length, bb);
				}
				static makeAlphanumeric(text) {
					if (!_QrSegment.isAlphanumeric(text)) throw new RangeError("String contains unencodable characters in alphanumeric mode");
					let bb = [];
					let i;
					for (i = 0; i + 2 <= text.length; i += 2) {
						let temp = _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
						temp += _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
						appendBits(temp, 11, bb);
					}
					if (i < text.length) appendBits(_QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
					return new _QrSegment(_QrSegment.Mode.ALPHANUMERIC, text.length, bb);
				}
				static makeSegments(text) {
					if (text == "") return [];
					else if (_QrSegment.isNumeric(text)) return [_QrSegment.makeNumeric(text)];
					else if (_QrSegment.isAlphanumeric(text)) return [_QrSegment.makeAlphanumeric(text)];
					else return [_QrSegment.makeBytes(_QrSegment.toUtf8ByteArray(text))];
				}
				static makeEci(assignVal) {
					let bb = [];
					if (assignVal < 0) throw new RangeError("ECI assignment value out of range");
					else if (assignVal < 128) appendBits(assignVal, 8, bb);
					else if (assignVal < 16384) {
						appendBits(2, 2, bb);
						appendBits(assignVal, 14, bb);
					} else if (assignVal < 1e6) {
						appendBits(6, 3, bb);
						appendBits(assignVal, 21, bb);
					} else throw new RangeError("ECI assignment value out of range");
					return new _QrSegment(_QrSegment.Mode.ECI, 0, bb);
				}
				static isNumeric(text) {
					return _QrSegment.NUMERIC_REGEX.test(text);
				}
				static isAlphanumeric(text) {
					return _QrSegment.ALPHANUMERIC_REGEX.test(text);
				}
				getData() {
					return this.bitData.slice();
				}
				static getTotalBits(segs, version) {
					let result = 0;
					for (const seg of segs) {
						const ccbits = seg.mode.numCharCountBits(version);
						if (seg.numChars >= 1 << ccbits) return Infinity;
						result += 4 + ccbits + seg.bitData.length;
					}
					return result;
				}
				static toUtf8ByteArray(str) {
					str = encodeURI(str);
					let result = [];
					for (let i = 0; i < str.length; i++) if (str.charAt(i) != "%") result.push(str.charCodeAt(i));
					else {
						result.push(parseInt(str.substring(i + 1, i + 3), 16));
						i += 2;
					}
					return result;
				}
			};
			_QrSegment.NUMERIC_REGEX = /^[0-9]*$/;
			_QrSegment.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
			_QrSegment.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
			let QrSegment = _QrSegment;
			qrcodegen2.QrSegment = _QrSegment;
		})(qrcodegen || (qrcodegen = {}));
		((qrcodegen2) => {
			((QrCode2) => {
				const _Ecc = class _Ecc {
					constructor(ordinal, formatBits) {
						this.ordinal = ordinal;
						this.formatBits = formatBits;
					}
				};
				_Ecc.LOW = new _Ecc(0, 1);
				_Ecc.MEDIUM = new _Ecc(1, 0);
				_Ecc.QUARTILE = new _Ecc(2, 3);
				_Ecc.HIGH = new _Ecc(3, 2);
				QrCode2.Ecc = _Ecc;
			})(qrcodegen2.QrCode || (qrcodegen2.QrCode = {}));
		})(qrcodegen || (qrcodegen = {}));
		((qrcodegen2) => {
			((QrSegment2) => {
				const _Mode = class _Mode {
					constructor(modeBits, numBitsCharCount) {
						this.modeBits = modeBits;
						this.numBitsCharCount = numBitsCharCount;
					}
					numCharCountBits(ver) {
						return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
					}
				};
				_Mode.NUMERIC = new _Mode(1, [
					10,
					12,
					14
				]);
				_Mode.ALPHANUMERIC = new _Mode(2, [
					9,
					11,
					13
				]);
				_Mode.BYTE = new _Mode(4, [
					8,
					16,
					16
				]);
				_Mode.KANJI = new _Mode(8, [
					8,
					10,
					12
				]);
				_Mode.ECI = new _Mode(7, [
					0,
					0,
					0
				]);
				QrSegment2.Mode = _Mode;
			})(qrcodegen2.QrSegment || (qrcodegen2.QrSegment = {}));
		})(qrcodegen || (qrcodegen = {}));
		var qrcodegen_default = qrcodegen;
		/**
		* @license qrcode.react
		* Copyright (c) Paul O'Shannessy
		* SPDX-License-Identifier: ISC
		*/
		var ERROR_LEVEL_MAP = {
			L: qrcodegen_default.QrCode.Ecc.LOW,
			M: qrcodegen_default.QrCode.Ecc.MEDIUM,
			Q: qrcodegen_default.QrCode.Ecc.QUARTILE,
			H: qrcodegen_default.QrCode.Ecc.HIGH
		};
		var DEFAULT_SIZE = 128;
		var DEFAULT_LEVEL = "L";
		var DEFAULT_BGCOLOR = "#FFFFFF";
		var DEFAULT_FGCOLOR = "#000000";
		var DEFAULT_INCLUDEMARGIN = false;
		var DEFAULT_MINVERSION = 1;
		var SPEC_MARGIN_SIZE = 4;
		var DEFAULT_MARGIN_SIZE = 0;
		var DEFAULT_IMG_SCALE = .1;
		function generatePath(modules, margin = 0) {
			const ops = [];
			modules.forEach(function(row, y) {
				let start = null;
				row.forEach(function(cell, x) {
					if (!cell && start !== null) {
						ops.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`);
						start = null;
						return;
					}
					if (x === row.length - 1) {
						if (!cell) return;
						if (start === null) ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
						else ops.push(`M${start + margin},${y + margin} h${x + 1 - start}v1H${start + margin}z`);
						return;
					}
					if (cell && start === null) start = x;
				});
			});
			return ops.join("");
		}
		function excavateModules(modules, excavation) {
			return modules.slice().map((row, y) => {
				if (y < excavation.y || y >= excavation.y + excavation.h) return row;
				return row.map((cell, x) => {
					if (x < excavation.x || x >= excavation.x + excavation.w) return cell;
					return false;
				});
			});
		}
		function getImageSettings(cells, size, margin, imageSettings) {
			if (imageSettings == null) return null;
			const numCells = cells.length + margin * 2;
			const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
			const scale = numCells / size;
			const w = (imageSettings.width || defaultSize) * scale;
			const h = (imageSettings.height || defaultSize) * scale;
			const x = imageSettings.x == null ? cells.length / 2 - w / 2 : imageSettings.x * scale;
			const y = imageSettings.y == null ? cells.length / 2 - h / 2 : imageSettings.y * scale;
			const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;
			let excavation = null;
			if (imageSettings.excavate) {
				let floorX = Math.floor(x);
				let floorY = Math.floor(y);
				excavation = {
					x: floorX,
					y: floorY,
					w: Math.ceil(w + x - floorX),
					h: Math.ceil(h + y - floorY)
				};
			}
			const crossOrigin = imageSettings.crossOrigin;
			return {
				x,
				y,
				h,
				w,
				excavation,
				opacity,
				crossOrigin
			};
		}
		function getMarginSize(includeMargin, marginSize) {
			if (marginSize != null) return Math.max(Math.floor(marginSize), 0);
			return includeMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE;
		}
		function useQRCode({ value, level, minVersion, includeMargin, marginSize, imageSettings, size, boostLevel }) {
			let qrcode = react.default.useMemo(() => {
				const segments = (Array.isArray(value) ? value : [value]).reduce((accum, v) => {
					accum.push(...qrcodegen_default.QrSegment.makeSegments(v));
					return accum;
				}, []);
				return qrcodegen_default.QrCode.encodeSegments(segments, ERROR_LEVEL_MAP[level], minVersion, void 0, void 0, boostLevel);
			}, [
				value,
				level,
				minVersion,
				boostLevel
			]);
			const { cells, margin, numCells, calculatedImageSettings } = react.default.useMemo(() => {
				let cells2 = qrcode.getModules();
				const margin2 = getMarginSize(includeMargin, marginSize);
				return {
					cells: cells2,
					margin: margin2,
					numCells: cells2.length + margin2 * 2,
					calculatedImageSettings: getImageSettings(cells2, size, margin2, imageSettings)
				};
			}, [
				qrcode,
				size,
				imageSettings,
				includeMargin,
				marginSize
			]);
			return {
				qrcode,
				margin,
				cells,
				numCells,
				calculatedImageSettings
			};
		}
		var SUPPORTS_PATH2D = function() {
			try {
				new Path2D().addPath(new Path2D());
			} catch (e) {
				return false;
			}
			return true;
		}();
		var QRCodeCanvas = react.default.forwardRef(function QRCodeCanvas2(props, forwardedRef) {
			const _a = props, { value, size = DEFAULT_SIZE, level = DEFAULT_LEVEL, bgColor = DEFAULT_BGCOLOR, fgColor = DEFAULT_FGCOLOR, includeMargin = DEFAULT_INCLUDEMARGIN, minVersion = DEFAULT_MINVERSION, boostLevel, marginSize, imageSettings } = _a;
			const _b = __objRest(_a, [
				"value",
				"size",
				"level",
				"bgColor",
				"fgColor",
				"includeMargin",
				"minVersion",
				"boostLevel",
				"marginSize",
				"imageSettings"
			]), { style } = _b, otherProps = __objRest(_b, ["style"]);
			const imgSrc = imageSettings == null ? void 0 : imageSettings.src;
			const _canvas = react.default.useRef(null);
			const _image = react.default.useRef(null);
			const setCanvasRef = react.default.useCallback((node) => {
				_canvas.current = node;
				if (typeof forwardedRef === "function") forwardedRef(node);
				else if (forwardedRef) forwardedRef.current = node;
			}, [forwardedRef]);
			const [isImgLoaded, setIsImageLoaded] = react.default.useState(false);
			const { margin, cells, numCells, calculatedImageSettings } = useQRCode({
				value,
				level,
				minVersion,
				boostLevel,
				includeMargin,
				marginSize,
				imageSettings,
				size
			});
			react.default.useEffect(() => {
				if (_canvas.current != null) {
					const canvas = _canvas.current;
					const ctx = canvas.getContext("2d");
					if (!ctx) return;
					let cellsToDraw = cells;
					const image = _image.current;
					const haveImageToRender = calculatedImageSettings != null && image !== null && image.complete && image.naturalHeight !== 0 && image.naturalWidth !== 0;
					if (haveImageToRender) {
						if (calculatedImageSettings.excavation != null) cellsToDraw = excavateModules(cells, calculatedImageSettings.excavation);
					}
					const pixelRatio = window.devicePixelRatio || 1;
					canvas.height = canvas.width = size * pixelRatio;
					const scale = size / numCells * pixelRatio;
					ctx.scale(scale, scale);
					ctx.fillStyle = bgColor;
					ctx.fillRect(0, 0, numCells, numCells);
					ctx.fillStyle = fgColor;
					if (SUPPORTS_PATH2D) ctx.fill(new Path2D(generatePath(cellsToDraw, margin)));
					else cells.forEach(function(row, rdx) {
						row.forEach(function(cell, cdx) {
							if (cell) ctx.fillRect(cdx + margin, rdx + margin, 1, 1);
						});
					});
					if (calculatedImageSettings) ctx.globalAlpha = calculatedImageSettings.opacity;
					if (haveImageToRender) ctx.drawImage(image, calculatedImageSettings.x + margin, calculatedImageSettings.y + margin, calculatedImageSettings.w, calculatedImageSettings.h);
				}
			});
			react.default.useEffect(() => {
				setIsImageLoaded(false);
			}, [imgSrc]);
			const canvasStyle = __spreadValues({
				height: size,
				width: size
			}, style);
			let img = null;
			if (imgSrc != null) img = /* @__PURE__ */ react.default.createElement("img", {
				src: imgSrc,
				key: imgSrc,
				style: { display: "none" },
				onLoad: () => {
					setIsImageLoaded(true);
				},
				ref: _image,
				crossOrigin: calculatedImageSettings == null ? void 0 : calculatedImageSettings.crossOrigin
			});
			return /* @__PURE__ */ react.default.createElement(react.default.Fragment, null, /* @__PURE__ */ react.default.createElement("canvas", __spreadValues({
				style: canvasStyle,
				height: size,
				width: size,
				ref: setCanvasRef,
				role: "img"
			}, otherProps)), img);
		});
		QRCodeCanvas.displayName = "QRCodeCanvas";
		var QRCodeSVG = react.default.forwardRef(function QRCodeSVG2(props, forwardedRef) {
			const _a = props, { value, size = DEFAULT_SIZE, level = DEFAULT_LEVEL, bgColor = DEFAULT_BGCOLOR, fgColor = DEFAULT_FGCOLOR, includeMargin = DEFAULT_INCLUDEMARGIN, minVersion = DEFAULT_MINVERSION, boostLevel, title, marginSize, imageSettings } = _a, otherProps = __objRest(_a, [
				"value",
				"size",
				"level",
				"bgColor",
				"fgColor",
				"includeMargin",
				"minVersion",
				"boostLevel",
				"title",
				"marginSize",
				"imageSettings"
			]);
			const { margin, cells, numCells, calculatedImageSettings } = useQRCode({
				value,
				level,
				minVersion,
				boostLevel,
				includeMargin,
				marginSize,
				imageSettings,
				size
			});
			let cellsToDraw = cells;
			let image = null;
			if (imageSettings != null && calculatedImageSettings != null) {
				if (calculatedImageSettings.excavation != null) cellsToDraw = excavateModules(cells, calculatedImageSettings.excavation);
				image = /* @__PURE__ */ react.default.createElement("image", {
					href: imageSettings.src,
					height: calculatedImageSettings.h,
					width: calculatedImageSettings.w,
					x: calculatedImageSettings.x + margin,
					y: calculatedImageSettings.y + margin,
					preserveAspectRatio: "none",
					opacity: calculatedImageSettings.opacity,
					crossOrigin: calculatedImageSettings.crossOrigin
				});
			}
			const fgPath = generatePath(cellsToDraw, margin);
			return /* @__PURE__ */ react.default.createElement("svg", __spreadValues({
				height: size,
				width: size,
				viewBox: `0 0 ${numCells} ${numCells}`,
				ref: forwardedRef,
				role: "img"
			}, otherProps), !!title && /* @__PURE__ */ react.default.createElement("title", null, title), /* @__PURE__ */ react.default.createElement("path", {
				fill: bgColor,
				d: `M0,0 h${numCells}v${numCells}H0z`,
				shapeRendering: "crispEdges"
			}), /* @__PURE__ */ react.default.createElement("path", {
				fill: fgColor,
				d: fgPath,
				shapeRendering: "crispEdges"
			}), image);
		});
		QRCodeSVG.displayName = "QRCodeSVG";
		//#endregion
		//#region src/client/pair-api.ts
		/** Read the host-authoritative desktop pairing policy. */
		async function readPairGatePolicy() {
			const response = await fetch("api/pair/status");
			if (!response.ok) throw new Error(`remote-web-ui: status failed with ${String(response.status)}`);
			const value = await response.json();
			if (typeof value.requirePairingForLan !== "boolean") throw new Error("remote-web-ui: status omitted requirePairingForLan");
			return { requirePairingForLan: value.requirePairingForLan };
		}
		/**
		* Mint a fresh pairing token (one active token at a time — this invalidates
		* any previous link).
		* @param address - optional LAN IP literal the QR must be built from (the
		* default is the first interface); unknown literals refuse with
		* 'unknown-address'.
		* @returns the issued link, the lan-required refusal (server never bound
		* 0.0.0.0), or the forbidden refusal (the loopback-only fence rejected this
		* origin — the panel is a desktop control endpoint).
		*/
		async function issuePair(address) {
			const response = await fetch("api/pair/issue", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ ...address !== void 0 ? { address } : {} })
			});
			if (!response.ok) {
				if (response.status === 409) return {
					ok: false,
					code: "lan-required"
				};
				if (response.status === 403) return {
					ok: false,
					code: "forbidden"
				};
				if (response.status === 400) return {
					ok: false,
					code: "unknown-address"
				};
				throw new Error(`remote-web-ui: issue failed with ${String(response.status)}`);
			}
			return await response.json();
		}
		/**
		* Accept a pairing token (the phone's first open of the QR link). Success
		* sets the device cookie; the page then reloads to boot with it.
		* @param token - the token from the URL.
		* @returns the wire result.
		*/
		async function acceptPair(token) {
			const response = await fetch("api/pair/accept", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ token })
			});
			if (response.ok) return { ok: true };
			if (response.status === 404 || response.status === 409) return {
				ok: false,
				code: "invalid"
			};
			return {
				ok: false,
				code: "forbidden"
			};
		}
		/** Revoke mobile access (paired devices + the current token). */
		async function stopPair() {
			const response = await fetch("api/pair/stop", { method: "POST" });
			if (!response.ok) throw new Error(`remote-web-ui: stop failed with ${String(response.status)}`);
		}
		/**
		* Revoke one paired device from the loopback panel.
		* @param deviceId - the session id of the row to drop.
		*/
		async function revokePair(deviceId) {
			const response = await fetch("api/pair/revoke", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ deviceId })
			});
			if (response.status === 404) return;
			if (!response.ok) throw new Error(`remote-web-ui: revoke failed with ${String(response.status)}`);
		}
		/**
		* Presence heartbeat from a paired phone.
		* @returns the response status, so the caller can stop polling once the server
		*   proves this page is not paired (see {@link shouldStopHeartbeat}).
		*/
		async function sendHeartbeat() {
			return (await fetch("api/pair/heartbeat", { method: "POST" })).status;
		}
		/**
		* Whether a heartbeat answer means "this page can never be accepted again" and
		* the 10 s wake source should stop: 401 (unpaired, or the device was revoked)
		* and 403 (the fence refused it) are permanent for this page, while a network
		* error or a 5xx is transient and keeps the cadence.
		* @param status - the heartbeat response status.
		*/
		function shouldStopHeartbeat(status) {
			return status === 401 || status === 403;
		}
		/** Whether the current page URL carries a pairing token. */
		function readPairParams(search) {
			const pair = new URLSearchParams(search).get("pair");
			return pair !== null && pair !== "" ? { pair } : {};
		}
		/** A failed LAN-bind read, carrying the HTTP status when the server answered. */
		var LanBindStatusError = class extends Error {
			status;
			/**
			* @param status - the response status, or undefined when the request failed
			*   before a response (network error).
			* @param message - the diagnostic message.
			*/
			constructor(status, message) {
				super(message);
				this.status = status;
				this.name = "LanBindStatusError";
			}
		};
		/** Read the LAN-bind facts (loopback-only endpoint). */
		async function readLanBindStatus() {
			const response = await fetch("api/pair/lan-bind");
			if (!response.ok) throw new LanBindStatusError(response.status, `remote-web-ui: lan-bind status failed with ${String(response.status)}`);
			return await response.json();
		}
		/**
		* Whether a LAN-bind status failure means this origin can never read the
		* endpoint (401/403 from the loopback-only fence), so a poll should stop
		* instead of retrying a known refusal; a transient error keeps the cadence.
		* @param status - the response status, or undefined for a network failure.
		*/
		function shouldStopLanBindPoll(status) {
			return status === 401 || status === 403;
		}
		/**
		* Validate one allowlist answer. A host that does not carry the allowlist (an
		* older plugin, or a mock) answers something else entirely, and the panel must
		* hide the section rather than render a half-built one — so anything without
		* both tables is rejected here.
		* @param value - the parsed JSON body.
		* @returns the frame, or undefined when the answer is not one.
		*/
		function parseLanAllowlistFrame(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const record = value;
			if (!Array.isArray(record.entries) || !Array.isArray(record.pending)) return void 0;
			return {
				enabled: record.enabled !== false,
				...typeof record.available === "boolean" ? { available: record.available } : {},
				entries: record.entries,
				pending: record.pending
			};
		}
		/**
		* Read the LAN approval list (loopback-only endpoint: the decision belongs on
		* the desktop, never on the device asking for access).
		* @returns the switch and both tables.
		*/
		async function readLanAllowlist() {
			const response = await fetch("api/pair/lan");
			if (!response.ok) throw new LanBindStatusError(response.status, `remote-web-ui: allowlist status failed with ${String(response.status)}`);
			const frame = parseLanAllowlistFrame(await response.json());
			if (frame === void 0) throw new LanBindStatusError(void 0, "remote-web-ui: allowlist status answer was not a list");
			return frame;
		}
		/** POST one { address } body to an allowlist write endpoint and read the new state. */
		async function writeLanAllowlist(path, address) {
			const response = await fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ address })
			});
			if (!response.ok) throw new LanBindStatusError(response.status, `remote-web-ui: allowlist write failed with ${String(response.status)}`);
			const frame = parseLanAllowlistFrame(await response.json());
			if (frame === void 0) throw new LanBindStatusError(void 0, "remote-web-ui: allowlist write answer was not a list");
			return frame;
		}
		/**
		* Approve one refused peer: it joins the list and may connect without a token.
		* @param address - the normalized peer address from the pending table.
		*/
		async function approveLanPeer(address) {
			return await writeLanAllowlist("api/pair/lan/approve", address);
		}
		/**
		* Remove one approved peer and revoke the session it stood for.
		* @param address - the entry's address or rule.
		*/
		async function removeLanPeer(address) {
			return await writeLanAllowlist("api/pair/lan/remove", address);
		}
		/**
		* Forget one refused peer without granting it anything.
		* @param address - the peer address from the pending table.
		*/
		async function dismissLanPeer(address) {
			return await writeLanAllowlist("api/pair/lan/dismiss", address);
		}
		/** Human-readable expiry clock, e.g. "10:35". */
		function formatClock(epochMs) {
			const date = new Date(epochMs);
			return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
		}
		/** Calendar + clock for last-seen timestamps, e.g. "2026-08-19 10:35". */
		function formatLastSeen(epochMs) {
			const date = new Date(epochMs);
			return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${formatClock(epochMs)}`;
		}
		/**
		* Copy text to the clipboard with a fallback for insecure contexts
		* (plain-HTTP LAN origins lack navigator.clipboard).
		* @param text - the text to copy.
		* @returns whether the copy succeeded.
		*/
		async function copyText(text) {
			if (typeof navigator !== "undefined" && navigator.clipboard !== void 0) try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {}
			try {
				const area = document.createElement("textarea");
				area.value = text;
				area.style.position = "fixed";
				area.style.opacity = "0";
				document.body.appendChild(area);
				area.select();
				const ok = document.execCommand("copy");
				area.remove();
				return ok;
			} catch {
				return false;
			}
		}
		//#endregion
		//#region src/client/device-name.ts
		/** Derive a short, non-sensitive device label from a browser User-Agent. */
		function deviceNameFromUserAgent(userAgent) {
			if (userAgent === void 0 || userAgent.trim() === "") return void 0;
			const os = /Windows NT/i.test(userAgent) ? "Windows" : /Android/i.test(userAgent) ? "Android" : /iPhone|iPad|iPod/i.test(userAgent) ? "iOS" : /Macintosh|Mac OS X/i.test(userAgent) ? "macOS" : /Linux/i.test(userAgent) ? "Linux" : void 0;
			const browser = /Edg(?:A|iOS)?\//i.test(userAgent) ? "Edge" : /(?:OPR|Opera)\//i.test(userAgent) ? "Opera" : /(?:Chrome|CriOS)\//i.test(userAgent) ? "Chrome" : /(?:Firefox|FxiOS)\//i.test(userAgent) ? "Firefox" : /Safari\//i.test(userAgent) && /Version\//i.test(userAgent) ? "Safari" : void 0;
			if (os !== void 0 && browser !== void 0) return `${os} · ${browser}`;
			return os ?? browser;
		}
		//#endregion
		//#region \0dsh-css:packages/dsh-remote-web-ui/src/client/remote.module.css.mjs
		const css$1 = ".fThDlq_overlay{z-index:1000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.fThDlq_mask{background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);position:absolute;inset:0}.fThDlq_trigger{width:36px;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,box-shadow .12s;display:inline-flex;position:relative}.fThDlq_trigger[data-wide=wide]{border-radius:999px;flex:auto;justify-content:flex-start;gap:8px;width:auto;min-width:0;padding:0 10px}.fThDlq_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.fThDlq_trigger:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}.fThDlq_trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2), 0 0 0 4px var(--dsw-alias-brand-primary);outline:none}.fThDlq_trigger:disabled{opacity:.5;cursor:default}.fThDlq_panel{z-index:1;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);width:560px;max-width:calc(100vw - 48px);max-height:calc(100vh - 48px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);border-radius:24px;flex-direction:column;gap:14px;padding:24px;font-size:14px;line-height:22px;display:flex;position:relative;overflow:auto}.fThDlq_header{align-items:flex-start;gap:12px;display:flex}.fThDlq_heading{flex:1;min-width:0}.fThDlq_title{margin:0;font-size:18px;font-weight:600;line-height:26px}.fThDlq_subtitle{color:var(--dsw-alias-label-secondary);margin:4px 0 0;font-size:13px}.fThDlq_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,box-shadow .12s;display:inline-flex}.fThDlq_close:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_close:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}.fThDlq_close:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2), 0 0 0 4px var(--dsw-alias-brand-primary);outline:none}.fThDlq_close:disabled{opacity:.5;cursor:default}.fThDlq_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:16px;flex-direction:column;align-items:center;gap:12px;padding:16px;display:flex}.fThDlq_cardHeader{justify-content:space-between;align-items:center;gap:12px;width:100%;display:flex}.fThDlq_cardTitle{font-weight:500}.fThDlq_badge{white-space:nowrap;border-radius:999px;flex:none;align-items:center;gap:6px;min-width:0;padding:2px 10px;font-size:12px;line-height:18px;display:inline-flex}.fThDlq_badge:before{content:\"\";background:currentColor;border-radius:50%;width:8px;height:8px}.fThDlq_badge-waiting{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_badge-connected{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_badge-disconnected{color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_badge-stopped{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_badgePublic{color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_badges{flex:none;align-items:center;gap:6px;display:inline-flex}.fThDlq_qrWrap{background:var(--dsw-alias-bg-base);border-radius:12px;justify-content:center;align-items:center;padding:12px;display:flex}.fThDlq_qr{display:block}.fThDlq_expired{color:var(--dsw-alias-state-error-primary);margin:0;font-size:13px}.fThDlq_expiry{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px}.fThDlq_hint{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px}.fThDlq_link{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption);font-family:var(--dsw-font-mono,ui-monospace, monospace);margin:0;font-size:12px;display:block;overflow:hidden}.fThDlq_pairLinks{flex-direction:column;gap:8px;display:flex}.fThDlq_pairLinkRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:10px;align-items:center;gap:10px;min-width:0;padding:10px 12px;display:flex}.fThDlq_pairLinkText{flex:1;min-width:0}.fThDlq_pairLinkLabel{color:var(--dsw-alias-label-secondary);margin-bottom:3px;font-size:12px;display:block}.fThDlq_copyLink{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-height:30px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;flex:none;align-items:center;gap:5px;padding:0 10px;display:inline-flex}.fThDlq_oneTimeHint{color:var(--dsw-alias-label-caption);margin:0;font-size:12px}.fThDlq_stoppedHint{color:var(--dsw-alias-state-error-primary);margin:0;font-size:13px}.fThDlq_tunnelNote{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px}.fThDlq_tunnelFailed{color:var(--dsw-alias-state-error-primary);margin:0;font-size:13px}.fThDlq_actions{gap:8px;display:flex}.fThDlq_action{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;border-radius:10px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-size:13px;transition:background-color .12s,border-color .12s,box-shadow .12s;display:inline-flex}.fThDlq_action:hover:not(:disabled){background:var(--dsw-alias-button-floating-hover)}.fThDlq_action:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}.fThDlq_action:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2), 0 0 0 4px var(--dsw-alias-brand-primary);outline:none}.fThDlq_action:disabled{opacity:.5;cursor:default}.fThDlq_banner{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:16px;padding:16px}.fThDlq_bannerTitle{color:var(--dsw-alias-state-warn-primary);margin:0;font-weight:500}.fThDlq_bannerHint{color:var(--dsw-alias-label-secondary);margin:6px 0 0;font-size:13px}.fThDlq_fencePage{z-index:2000;box-sizing:border-box;background:var(--dsw-alias-bg-base);text-align:center;flex-direction:column;justify-content:center;align-items:center;padding:40px 24px;display:flex;position:fixed;inset:0;overflow:auto}.fThDlq_fenceCard{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:min(520px,100%);box-shadow:var(--dsw-shadow-lv3);text-align:center;border-radius:20px;margin-inline:auto;padding:36px 40px}.fThDlq_fenceMark{background:var(--dsw-alias-state-error-secondary);width:44px;height:44px;color:var(--dsw-alias-state-error-primary);border-radius:50%;place-items:center;margin-inline:auto;font-size:24px;line-height:1;display:grid}.fThDlq_fenceEyebrow{color:var(--dsw-alias-state-error-primary);margin:22px 0 8px;font-size:13px;font-weight:600}.fThDlq_fenceTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:24px;line-height:1.35}.fThDlq_fenceDetail{color:var(--dsw-alias-label-secondary);margin:12px 0 0;font-size:14px;line-height:1.65}.fThDlq_fenceSteps{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);text-align:left;border-radius:12px;margin:24px auto 0;padding:20px 20px 20px 42px;font-size:14px;line-height:1.65}.fThDlq_fenceSteps li+li{margin-top:8px}.fThDlq_fenceForm{width:100%;margin-top:20px}.fThDlq_fenceInputRow{gap:8px;width:100%;display:flex}.fThDlq_fenceInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);min-width:0;color:var(--dsw-alias-label-primary);font:inherit;border-radius:10px;flex:1;padding:10px 14px;font-size:13px;transition:border-color .12s,box-shadow .12s}.fThDlq_fenceInput:focus{border-color:var(--dsw-alias-brand-primary);outline:none;box-shadow:0 0 0 2px #0066ff26}.fThDlq_fencePairButton{border:1px solid var(--dsw-alias-button-primary-fill);background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);font:inherit;cursor:pointer;border-radius:10px;flex-shrink:0;padding:10px 18px;font-size:13px;font-weight:500;transition:filter .12s,opacity .12s}.fThDlq_fencePairButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill));border-color:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill))}.fThDlq_fencePairButton:disabled{opacity:.55;cursor:not-allowed}.fThDlq_fencePairButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.fThDlq_fenceError{color:var(--dsw-alias-state-error-primary);text-align:left;margin:10px 0 0;font-size:13px;line-height:1.4}.fThDlq_fenceRetry{border:1px solid var(--dsw-alias-border-l2);width:100%;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:10px;margin-top:12px;padding:10px 16px;font-weight:500;transition:background-color .12s,color .12s}.fThDlq_fenceRetry:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.fThDlq_fenceRetry:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px}.fThDlq_fenceFootnote{color:var(--dsw-alias-label-tertiary);margin:14px 0 0;font-size:12px;line-height:1.55}.fThDlq_addresses{border:none;margin:12px 0 0;padding:0}.fThDlq_addresses legend{color:var(--dsw-alias-label-secondary);padding:0;font-size:13px}.fThDlq_address{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;cursor:pointer;border-radius:6px;align-items:center;gap:8px;margin-top:6px;padding:4px 6px;font-size:13px;transition:background-color .12s;display:flex}.fThDlq_address:hover{background:var(--dsw-alias-interactive-bg-hover)}.fThDlq_address input:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2), 0 0 0 4px var(--dsw-alias-brand-primary);border-radius:50%;outline:none}.fThDlq_addressValue{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary);flex:1;font-size:12px;overflow:hidden}.fThDlq_addressHint{color:var(--dsw-alias-label-tertiary);margin:6px 0 0;font-size:12px}.fThDlq_devices{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:16px;flex-direction:column;gap:8px;padding:12px 16px 14px;display:flex}.fThDlq_devicesTitle{margin:0;font-size:13px;font-weight:500;line-height:20px}.fThDlq_devicesEmpty{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px}.fThDlq_deviceList{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.fThDlq_deviceRow{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.fThDlq_deviceMeta{flex-direction:column;gap:2px;min-width:0;display:flex}.fThDlq_deviceName{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;overflow:hidden}.fThDlq_devicePresence{font-size:12px;line-height:18px}.fThDlq_deviceOnline{color:var(--dsw-alias-state-success-primary)}.fThDlq_deviceOffline{color:var(--dsw-alias-label-secondary)}.fThDlq_deviceSeen{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:12px}.fThDlq_deviceRevoke{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px;flex:none;padding:6px 10px;font-size:12px;transition:background-color .12s,color .12s}.fThDlq_deviceRevoke:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.fThDlq_deviceRevoke:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2), 0 0 0 4px var(--dsw-alias-brand-primary);outline:none}@media (prefers-reduced-motion:reduce){.fThDlq_trigger,.fThDlq_close,.fThDlq_action,.fThDlq_address,.fThDlq_deviceRevoke{transition:none}}.fThDlq_entryRow{flex:none;align-items:center;gap:6px;min-width:0;display:flex}.fThDlq_entryRow[data-rail=rail]{flex-direction:column-reverse;gap:4px}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footArea]{flex-flow:wrap;align-items:center}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footArea]>:not([class*=settingsArea]):not([class*=footerActions]){flex:100%;min-width:0}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footArea]>[class*=footerActions]{display:contents}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footerActions]>[data-slot=\"sidebar.footer.action\"]>:not([data-dsh-part=entry]):not([class*=entryRow]){flex:100%;order:1;min-width:0}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footerActions]>[data-slot=\"sidebar.footer.action\"]>[data-dsh-part=entry],[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=footerActions]>[data-slot=\"sidebar.footer.action\"]>[class*=entryRow]{flex:none;order:4;min-width:0}[data-dsh-frame]:not([data-sidebar-collapsed]) [class*=settingsArea]{flex:auto;order:3;width:auto;min-width:0}[data-dsh-frame][data-sidebar-collapsed] [class*=footerActions]:has([data-rail=rail]){flex-direction:column;align-items:center;gap:4px}";
		const tagId$1 = "@linxin666/dsh-remote-web-ui/packages/dsh-remote-web-ui/src/client/remote.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-remote-web-ui";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var remote_module_css_default = {
			"action": "fThDlq_action",
			"actions": "fThDlq_actions",
			"address": "fThDlq_address",
			"addressHint": "fThDlq_addressHint",
			"addressValue": "fThDlq_addressValue",
			"addresses": "fThDlq_addresses",
			"badge": "fThDlq_badge",
			"badge-connected": "fThDlq_badge-connected",
			"badge-disconnected": "fThDlq_badge-disconnected",
			"badge-stopped": "fThDlq_badge-stopped",
			"badge-waiting": "fThDlq_badge-waiting",
			"badgePublic": "fThDlq_badgePublic",
			"badges": "fThDlq_badges",
			"banner": "fThDlq_banner",
			"bannerHint": "fThDlq_bannerHint",
			"bannerTitle": "fThDlq_bannerTitle",
			"card": "fThDlq_card",
			"cardHeader": "fThDlq_cardHeader",
			"cardTitle": "fThDlq_cardTitle",
			"close": "fThDlq_close",
			"copyLink": "fThDlq_copyLink",
			"deviceList": "fThDlq_deviceList",
			"deviceMeta": "fThDlq_deviceMeta",
			"deviceName": "fThDlq_deviceName",
			"deviceOffline": "fThDlq_deviceOffline",
			"deviceOnline": "fThDlq_deviceOnline",
			"devicePresence": "fThDlq_devicePresence",
			"deviceRevoke": "fThDlq_deviceRevoke",
			"deviceRow": "fThDlq_deviceRow",
			"deviceSeen": "fThDlq_deviceSeen",
			"devices": "fThDlq_devices",
			"devicesEmpty": "fThDlq_devicesEmpty",
			"devicesTitle": "fThDlq_devicesTitle",
			"entryRow": "fThDlq_entryRow",
			"expired": "fThDlq_expired",
			"expiry": "fThDlq_expiry",
			"fenceCard": "fThDlq_fenceCard",
			"fenceDetail": "fThDlq_fenceDetail",
			"fenceError": "fThDlq_fenceError",
			"fenceEyebrow": "fThDlq_fenceEyebrow",
			"fenceFootnote": "fThDlq_fenceFootnote",
			"fenceForm": "fThDlq_fenceForm",
			"fenceInput": "fThDlq_fenceInput",
			"fenceInputRow": "fThDlq_fenceInputRow",
			"fenceMark": "fThDlq_fenceMark",
			"fencePage": "fThDlq_fencePage",
			"fencePairButton": "fThDlq_fencePairButton",
			"fenceRetry": "fThDlq_fenceRetry",
			"fenceSteps": "fThDlq_fenceSteps",
			"fenceTitle": "fThDlq_fenceTitle",
			"header": "fThDlq_header",
			"heading": "fThDlq_heading",
			"hint": "fThDlq_hint",
			"link": "fThDlq_link",
			"mask": "fThDlq_mask",
			"oneTimeHint": "fThDlq_oneTimeHint",
			"overlay": "fThDlq_overlay",
			"pairLinkLabel": "fThDlq_pairLinkLabel",
			"pairLinkRow": "fThDlq_pairLinkRow",
			"pairLinkText": "fThDlq_pairLinkText",
			"pairLinks": "fThDlq_pairLinks",
			"panel": "fThDlq_panel",
			"qr": "fThDlq_qr",
			"qrWrap": "fThDlq_qrWrap",
			"stoppedHint": "fThDlq_stoppedHint",
			"subtitle": "fThDlq_subtitle",
			"title": "fThDlq_title",
			"trigger": "fThDlq_trigger",
			"tunnelFailed": "fThDlq_tunnelFailed",
			"tunnelNote": "fThDlq_tunnelNote"
		};
		//#endregion
		//#region src/client/RemotePanel.tsx
		/**
		* The mobile remote-control panel body: status card (state text + badge),
		* the QR code, the open-on-phone hint with the link text, and the three
		* actions (stop / refresh / copy). Pure presentation — all state and
		* actions arrive through props from the entry's behavior component.
		*/
		/**
		* The QR symbol, memoized on the link: the panel re-renders on every SSE state
		* frame (a paired phone heartbeats every 10s), and qrcode.react rebuilds the
		* SVG path and element tree on each render.
		*/
		const PairQrCode = (0, react.memo)(function PairQrCode({ url, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QRCodeSVG, {
				value: url,
				size: 184,
				level: "M",
				marginSize: 1,
				className
			});
		});
		/** Badge text + tone per phase (ready states only). */
		function statusOf(t, state) {
			switch (state.phase) {
				case "connected": return {
					text: t("status.connected", { n: state.onlineCount }),
					tone: "connected"
				};
				case "disconnected": return {
					text: t("status.disconnected"),
					tone: "disconnected"
				};
				case "stopped": return {
					text: t("status.stopped"),
					tone: "stopped"
				};
				case "lan-required": return {
					text: t("status.lanRequired"),
					tone: "stopped"
				};
				case "waiting": return {
					text: t("status.waiting"),
					tone: "waiting"
				};
			}
		}
		/**
		* Render the pairing panel.
		* @param props - copy, state, and actions.
		* @returns the panel element tree.
		*/
		function RemotePanel({ t, state, copied, copiedToken, onClose, onStop, onRefresh, onCopy, onCopyToken, onPickAddress, onPickPublic, onRevoke, lan, onLanApprove, onLanRemove, onLanDismiss }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: remote_module_css_default.panel,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": t("title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: remote_module_css_default.header,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: remote_module_css_default.heading,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: remote_module_css_default.title,
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.subtitle,
							children: t("subtitle")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: remote_module_css_default.close,
						"aria-label": t("close.label"),
						onClick: onClose,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 14 })
					})]
				}), state.kind === "lan-required" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: remote_module_css_default.banner,
					role: "alert",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerTitle,
						children: t("status.lanRequired")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerHint,
						children: t("status.lanRequiredHint")
					})]
				}) : state.kind === "loopback-required" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: remote_module_css_default.banner,
					role: "alert",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerTitle,
						children: t("status.loopbackRequired")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerHint,
						children: t("status.loopbackRequiredHint")
					})]
				}) : state.kind === "unreachable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: remote_module_css_default.banner,
					role: "alert",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerTitle,
						children: t("status.unreachable")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.bannerHint,
						children: t("status.unreachableHint")
					})]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					state.posture !== void 0 && state.posture.hosts.some((host) => host.exposed) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: remote_module_css_default.banner,
						role: "alert",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.bannerTitle,
							children: t("posture.exposed")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.bannerHint,
							children: t("posture.exposedHint", { hosts: state.posture.hosts.filter((host) => host.exposed).map((host) => host.host).join(", ") })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: remote_module_css_default.card,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: remote_module_css_default.cardHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: remote_module_css_default.cardTitle,
									children: t("card.title")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: remote_module_css_default.badges,
									children: [state.public && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: clsx(remote_module_css_default.badge, remote_module_css_default.badgePublic),
										children: t("public.badge")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: clsx(remote_module_css_default.badge, remote_module_css_default[`badge-${statusOf(t, state).tone}`]),
										children: statusOf(t, state).text
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: remote_module_css_default.qrWrap,
								"data-testid": "remote-qr",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PairQrCode, {
									url: state.url,
									className: remote_module_css_default.qr
								})
							}),
							state.expired ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.expired,
								children: t("pair.expired")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.expiry,
								children: t("pair.expires", { time: formatClock(state.expiresAt) })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.hint,
						children: state.public ? t("pair.publicHint") : t("pair.hint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: remote_module_css_default.pairLinks,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: remote_module_css_default.pairLinkRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: remote_module_css_default.pairLinkText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: remote_module_css_default.pairLinkLabel,
									children: t("pair.linkLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									className: remote_module_css_default.link,
									title: state.url,
									children: state.url
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: remote_module_css_default.copyLink,
								onClick: () => onCopy(state.url),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutlineRegular, { size: 14 }), copied ? t("action.copied") : t("action.copyLink")]
							})]
						}), state.token !== void 0 && state.token !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: remote_module_css_default.pairLinkRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: remote_module_css_default.pairLinkText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: remote_module_css_default.pairLinkLabel,
									children: t("pair.tokenLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									className: remote_module_css_default.link,
									title: state.token,
									children: state.token
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: remote_module_css_default.copyLink,
								onClick: () => onCopyToken ? onCopyToken(state.token) : onCopy(state.token),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutlineRegular, { size: 14 }), copiedToken ? t("action.copiedToken") : t("action.copyToken")]
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: remote_module_css_default.oneTimeHint,
						children: [
							t("pair.oneTimeHint"),
							" ",
							t("pair.dockerHint")
						]
					}),
					state.phase === "stopped" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.stoppedHint,
						children: t("stopped.hint")
					}),
					state.tunnel !== void 0 && state.tunnel.state !== "running" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: state.tunnel.state === "failed" ? remote_module_css_default.tunnelFailed : remote_module_css_default.tunnelNote,
						role: "status",
						children: state.tunnel.state === "failed" ? t("tunnel.failed", { error: state.tunnel.error ?? t("tunnel.unknownError") }) : t("tunnel.starting")
					}),
					state.relay?.state === "registering" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.tunnelNote,
						role: "status",
						children: t("relay.registering")
					}),
					state.relay?.state === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: remote_module_css_default.tunnelFailed,
						role: "status",
						children: t("relay.failed", { error: state.relay.error ?? t("tunnel.unknownError") })
					}),
					(state.publicBaseUrl !== void 0 || state.lanAddresses.length > 1) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
						className: remote_module_css_default.addresses,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("address.label") }),
							state.publicBaseUrl !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: remote_module_css_default.address,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "radio",
										name: "lan-address",
										"aria-label": t("address.public"),
										checked: state.public,
										onChange: onPickPublic
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("address.public") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										className: remote_module_css_default.addressValue,
										children: state.publicBaseUrl
									})
								]
							}, "public"),
							state.lanAddresses.map((address) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: remote_module_css_default.address,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "radio",
										name: "lan-address",
										"aria-label": address,
										checked: !state.public && address === state.address,
										onChange: () => onPickAddress(address)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("address.lan") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										className: remote_module_css_default.addressValue,
										children: address
									})
								]
							}, address)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.addressHint,
								children: t("address.hint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: remote_module_css_default.actions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: remote_module_css_default.action,
							onClick: onStop,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconStopFillRegular, { size: 14 }), t("action.stop")]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: remote_module_css_default.action,
							onClick: onRefresh,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 14 }), t("action.refresh")]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: remote_module_css_default.devices,
						"data-testid": "remote-devices",
						"aria-label": t("devices.title"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							className: remote_module_css_default.devicesTitle,
							children: t("devices.title")
						}), state.devices.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.devicesEmpty,
							children: t("devices.empty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: remote_module_css_default.deviceList,
							children: state.devices.map((device) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: remote_module_css_default.deviceRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: remote_module_css_default.deviceMeta,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: remote_module_css_default.deviceName,
											children: deviceNameFromUserAgent(device.userAgent) ?? t("devices.unknown")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: clsx(remote_module_css_default.devicePresence, device.online ? remote_module_css_default.deviceOnline : remote_module_css_default.deviceOffline),
											children: device.online ? t("devices.online") : t("devices.offline")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: remote_module_css_default.deviceSeen,
											children: t("devices.lastSeen", { time: formatLastSeen(device.lastSeenAt) })
										})
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: remote_module_css_default.deviceRevoke,
									"aria-label": t("devices.revoke.label"),
									onClick: () => {
										onRevoke(device.id);
									},
									children: t("devices.revoke")
								})]
							}, device.id))
						})]
					}),
					lan !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: remote_module_css_default.devices,
						"data-testid": "remote-lan",
						"aria-label": t("lanAllow.title"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: remote_module_css_default.devicesTitle,
								children: t("lanAllow.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.devicesEmpty,
								children: lan.available === false ? t("lanAllow.unavailable") : lan.enabled ? t("lanAllow.on") : t("lanAllow.off")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
								className: remote_module_css_default.devicesTitle,
								children: t("lanAllow.pendingTitle")
							}),
							lan.pending.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.devicesEmpty,
								children: t("lanAllow.pendingEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: remote_module_css_default.deviceList,
								children: lan.pending.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: remote_module_css_default.deviceRow,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: remote_module_css_default.deviceMeta,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: remote_module_css_default.deviceName,
													children: deviceNameFromUserAgent(entry.userAgent) ?? t("devices.unknown")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
													className: remote_module_css_default.link,
													children: entry.address
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: remote_module_css_default.deviceSeen,
													children: t("lanAllow.hits", { n: entry.hits })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: remote_module_css_default.deviceSeen,
													children: t("devices.lastSeen", { time: formatLastSeen(entry.lastSeenAt) })
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: remote_module_css_default.deviceRevoke,
											"aria-label": t("lanAllow.approve.label"),
											onClick: () => {
												onLanApprove?.(entry.address);
											},
											children: t("lanAllow.approve")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: remote_module_css_default.deviceRevoke,
											"aria-label": t("lanAllow.dismiss.label"),
											onClick: () => {
												onLanDismiss?.(entry.address);
											},
											children: t("lanAllow.dismiss")
										})
									]
								}, entry.address))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
								className: remote_module_css_default.devicesTitle,
								children: t("lanAllow.approvedTitle")
							}),
							lan.entries.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.devicesEmpty,
								children: t("lanAllow.approvedEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: remote_module_css_default.deviceList,
								children: lan.entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: remote_module_css_default.deviceRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: remote_module_css_default.deviceMeta,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: remote_module_css_default.deviceName,
												children: entry.label ?? deviceNameFromUserAgent(entry.userAgent) ?? t("devices.unknown")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
												className: remote_module_css_default.link,
												children: entry.rule ?? entry.address
											}),
											entry.rule !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: remote_module_css_default.deviceSeen,
												children: t("lanAllow.rule")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: remote_module_css_default.deviceSeen,
												children: t("devices.lastSeen", { time: formatLastSeen(entry.lastSeenAt) })
											})
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: remote_module_css_default.deviceRevoke,
										"aria-label": t("lanAllow.remove.label"),
										onClick: () => {
											onLanRemove?.(entry.rule ?? entry.address);
										},
										children: t("lanAllow.remove")
									})]
								}, entry.rule ?? entry.address))
							})
						]
					})
				] })]
			});
		}
		//#endregion
		//#region src/client/PhoneIcon.tsx
		/**
		* Render the phone icon.
		* @param props - size and optional class.
		* @returns the svg element.
		*/
		function PhoneIcon({ size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				className,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M4.2 1.8h2.4l.9 2.4-1.5 1.1a7.4 7.4 0 0 0 4.7 4.7l1.1-1.5 2.4.9v2.4a.9.9 0 0 1-1 .9A11.4 11.4 0 0 1 3.3 2.8a.9.9 0 0 1 .9-1Z",
					stroke: "currentColor",
					strokeWidth: "1.3",
					strokeLinejoin: "round"
				})
			});
		}
		//#endregion
		//#region src/client/RemoteEntry.tsx
		/**
		* The sidebar remote-control seat: the phone-icon trigger beside the
		* settings button, and the pairing panel modal. Owns the panel behavior —
		* token minting on open, the status SSE subscription, stop/refresh/copy — and
		* renders the pure {@link RemotePanel} body. The family self-update seat is
		* its own plugin (dsh-update) and no longer rides this row. Component-local
		* state per the client stack rules: nothing here survives remounts or crosses
		* entries.
		*/
		/** How often the open panel re-reads the LAN approval list (loopback-only). */
		const LAN_ALLOWLIST_POLL_MS = 5e3;
		/**
		* Apply one status frame onto the current state: the ready state mirrors
		* the full phase/device picture, while the lan-required banner only keeps
		* the auto-tunnel frame (the signal for the running re-issue).
		*/
		function mergeFrame(state, frame) {
			if (state.kind === "lan-required") return {
				...state,
				...frame.tunnel !== void 0 ? { tunnel: frame.tunnel } : {}
			};
			if (state.kind !== "ready") return state;
			return {
				...state,
				phase: frame.phase,
				deviceCount: frame.deviceCount,
				onlineCount: frame.onlineCount,
				devices: frame.devices ?? [],
				...frame.tunnel !== void 0 ? { tunnel: frame.tunnel } : {},
				...frame.relay !== void 0 ? { relay: frame.relay } : {},
				...frame.posture !== void 0 ? { posture: frame.posture } : {}
			};
		}
		/**
		* Render the remote-control trigger and panel.
		* @param props - composed slot props (contract in this package).
		* @returns the entry element tree.
		*/
		function RemoteEntry({ wide, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [state, setState] = (0, react.useState)({ kind: "lan-required" });
			const stateRef = (0, react.useRef)(state);
			(0, react.useEffect)(() => {
				stateRef.current = state;
			}, [state]);
			const [copied, setCopied] = (0, react.useState)(false);
			const [copiedToken, setCopiedToken] = (0, react.useState)(false);
			const eventSource = (0, react.useRef)(void 0);
			const openSeq = (0, react.useRef)(0);
			const closeEventSource = (0, react.useCallback)(() => {
				eventSource.current?.close();
				eventSource.current = void 0;
			}, []);
			const mint = (0, react.useCallback)(async (address) => {
				let result;
				try {
					result = await issuePair(address);
				} catch {
					return { kind: "unreachable" };
				}
				if (!result.ok) {
					if (result.code === "forbidden") return { kind: "loopback-required" };
					if (result.code === "unknown-address") return { kind: "unreachable" };
					return { kind: "lan-required" };
				}
				const publicBaseUrl = result.publicBaseUrl;
				return {
					kind: "ready",
					url: result.url,
					token: result.token,
					expiresAt: result.expiresAt,
					expired: Date.now() > result.expiresAt,
					phase: "waiting",
					deviceCount: 0,
					onlineCount: 0,
					devices: [],
					public: publicBaseUrl !== void 0 && result.url.startsWith(publicBaseUrl),
					...publicBaseUrl !== void 0 ? { publicBaseUrl } : {},
					address: address ?? result.lanAddresses[0] ?? "",
					lanAddresses: result.lanAddresses
				};
			}, []);
			const openPanel = (0, react.useCallback)(async () => {
				const seq = ++openSeq.current;
				setOpen(true);
				const next = await mint();
				if (seq !== openSeq.current) return;
				setState(next);
				if (next.kind !== "ready" && next.kind !== "lan-required") return;
				const source = new EventSource("api/pair/events");
				eventSource.current = source;
				source.onmessage = (event) => {
					try {
						const frame = JSON.parse(event.data);
						if (frame.type !== "state") return;
						const previous = stateRef.current;
						if (previous.kind === "lan-required" && frame.tunnel?.state === "running" && previous.tunnel?.state !== "running") {
							mint().then(setState);
							return;
						}
						setState((current) => mergeFrame(current, frame));
					} catch {}
				};
			}, [mint]);
			const closePanel = (0, react.useCallback)(() => {
				openSeq.current += 1;
				closeEventSource();
				setOpen(false);
			}, [closeEventSource]);
			(0, react.useEffect)(() => {
				if (state.kind !== "ready") return;
				if (state.expired) return;
				const delay = state.expiresAt - Date.now();
				if (delay <= 0) {
					setState((previous) => previous.kind === "ready" ? {
						...previous,
						expired: true
					} : previous);
					return;
				}
				const timer = window.setTimeout(() => {
					setState((previous) => previous.kind === "ready" ? {
						...previous,
						expired: true
					} : previous);
				}, delay);
				return () => {
					window.clearTimeout(timer);
				};
			}, [state]);
			(0, react.useEffect)(() => closeEventSource, [closeEventSource]);
			const handleStop = (0, react.useCallback)(() => {
				stopPair().then(() => {
					setState((previous) => previous.kind === "ready" ? {
						...previous,
						phase: "stopped",
						devices: []
					} : previous);
				}).catch(() => {});
			}, []);
			const handleRevoke = (0, react.useCallback)((deviceId) => {
				revokePair(deviceId).then(() => {
					setState((previous) => previous.kind === "ready" ? {
						...previous,
						devices: previous.devices.filter((device) => device.id !== deviceId)
					} : previous);
				}).catch(() => {});
			}, []);
			const handleRefresh = (0, react.useCallback)(() => {
				mint().then(setState);
			}, [mint]);
			/** Re-mint against another LAN literal (multi-homed machines). */
			const handlePickAddress = (0, react.useCallback)((address) => {
				mint(address).then(setState);
			}, [mint]);
			/** Re-mint against the configured public (tunneled) base. */
			const handlePickPublic = (0, react.useCallback)(() => {
				mint().then(setState);
			}, [mint]);
			const handleCopy = (0, react.useCallback)((url) => {
				copyText(url).then((ok) => {
					if (!ok) return;
					setCopied(true);
					window.setTimeout(() => {
						setCopied(false);
					}, 1500);
				});
			}, []);
			const handleCopyToken = (0, react.useCallback)((token) => {
				copyText(token).then((ok) => {
					if (!ok) return;
					setCopiedToken(true);
					window.setTimeout(() => {
						setCopiedToken(false);
					}, 1500);
				});
			}, []);
			const [lan, setLan] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (!open) return;
				let cancelled = false;
				const load = () => {
					readLanAllowlist().then((frame) => {
						if (!cancelled) setLan(frame);
					}).catch(() => {
						if (!cancelled) setLan(void 0);
					});
				};
				load();
				const timer = window.setInterval(load, LAN_ALLOWLIST_POLL_MS);
				return () => {
					cancelled = true;
					window.clearInterval(timer);
				};
			}, [open]);
			/** Apply a write result: every endpoint answers with the new full state. */
			const applyLan = (0, react.useCallback)((pending) => {
				pending.then(setLan).catch(() => {});
			}, []);
			const handleLanApprove = (0, react.useCallback)((address) => {
				applyLan(approveLanPeer(address));
			}, [applyLan]);
			const handleLanRemove = (0, react.useCallback)((address) => {
				applyLan(removeLanPeer(address));
			}, [applyLan]);
			const handleLanDismiss = (0, react.useCallback)((address) => {
				applyLan(dismissLanPeer(address));
			}, [applyLan]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: remote_module_css_default.entryRow,
				"data-rail": wide ? void 0 : "rail",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TooltipAnchor, {
					wide,
					label: t("entry.label"),
					onClick: openPanel,
					expanded: open
				})
			}), open && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: remote_module_css_default.overlay,
				role: "presentation",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: remote_module_css_default.mask,
					"aria-hidden": "true",
					onClick: closePanel
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RemotePanel, {
					t,
					state,
					copied,
					copiedToken,
					onClose: closePanel,
					onStop: handleStop,
					onRefresh: handleRefresh,
					onCopy: handleCopy,
					onCopyToken: handleCopyToken,
					onPickAddress: handlePickAddress,
					onPickPublic: handlePickPublic,
					onRevoke: handleRevoke,
					...lan !== void 0 ? { lan } : {},
					onLanApprove: handleLanApprove,
					onLanRemove: handleLanRemove,
					onLanDismiss: handleLanDismiss
				})]
			}), document.body)] });
		}
		/** The trigger: an icon-only control with a persistent accessible label. */
		function TooltipAnchor({ wide, label, onClick, expanded }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: remote_module_css_default.trigger,
				"data-wide": wide ? "wide" : "rail",
				"aria-label": label,
				"aria-expanded": expanded,
				title: label,
				onClick,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PhoneIcon, { size: wide ? 16 : 18 })
			});
		}
		//#endregion
		//#region src/client/FooterRemoteEntry.tsx
		/**
		* Render the remote-control trigger + pairing panel from the footer seat.
		* @param props - composed slot props (footer seat subset).
		* @returns the entry element tree.
		*/
		function FooterRemoteEntry(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RemoteEntry, {
				wide: props.wide,
				t: props.t
			});
		}
		//#endregion
		//#region src/client/PairFailedNotice.tsx
		/**
		* One-time failed-pairing notice: a fixed toast rendered on the phone after
		* a QR accept failed (invalid/used token or a network error). Mounted by
		* the client apply with a plain React root — no slot machinery for a
		* transient diagnostic.
		*/
		/**
		* Render the failed-pair toast (auto-dismisses).
		* @param props - localized copy.
		* @returns the toast element.
		*/
		function PairFailedNotice({ t }) {
			const [visible, setVisible] = (0, react.useState)(true);
			(0, react.useEffect)(() => {
				const timer = window.setTimeout(() => {
					setVisible(false);
				}, 8e3);
				return () => {
					window.clearTimeout(timer);
				};
			}, []);
			if (!visible) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: remote_module_css_default.notice,
				role: "alert",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: remote_module_css_default.noticeTitle,
					children: t("pair.failed.title")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: remote_module_css_default.noticeDetail,
					children: t("pair.failed.detail")
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:packages/dsh-remote-web-ui/src/client/settings-card.module.css.mjs
		const css = ".Kwoi6G_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.Kwoi6G_card:hover{border-color:var(--dsw-alias-label-dimmed)}.Kwoi6G_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.Kwoi6G_header{appearance:none;box-sizing:border-box;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.Kwoi6G_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.Kwoi6G_headerStatic{box-sizing:border-box;border-radius:12px;align-items:center;gap:12px;width:100%;padding:14px 16px;display:flex}.Kwoi6G_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.Kwoi6G_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.Kwoi6G_description{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}.Kwoi6G_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.Kwoi6G_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.Kwoi6G_chevronOpen{transform:rotate(180deg)}.Kwoi6G_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.Kwoi6G_readOnly{color:var(--dsw-alias-label-secondary);margin:12px 0 0;font-size:12px;line-height:1.5}.Kwoi6G_notExposed{color:var(--dsw-alias-state-warn-primary);margin:12px 0 0;font-size:12px;line-height:1.5}.Kwoi6G_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.Kwoi6G_failed{min-width:0;color:var(--dsw-alias-state-error-primary,#b42318);text-overflow:ellipsis;white-space:nowrap;flex:1;margin:0;font-size:12px;line-height:1.5;overflow:hidden}.Kwoi6G_discard,.Kwoi6G_save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.Kwoi6G_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.Kwoi6G_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.Kwoi6G_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}.Kwoi6G_discard:disabled,.Kwoi6G_save:disabled{opacity:.4;cursor:default}.Kwoi6G_discard:focus-visible,.Kwoi6G_save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.Kwoi6G_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.Kwoi6G_field+.Kwoi6G_field{border-top:1px solid var(--dsw-alias-border-l2)}.Kwoi6G_head{align-items:center;gap:8px;display:flex}.Kwoi6G_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.Kwoi6G_badges{align-items:center;gap:8px;display:inline-flex}.Kwoi6G_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.Kwoi6G_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.Kwoi6G_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.Kwoi6G_reset:disabled{cursor:default}.Kwoi6G_reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.Kwoi6G_input,.Kwoi6G_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.Kwoi6G_input:focus-visible,.Kwoi6G_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.Kwoi6G_input:disabled,.Kwoi6G_select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.Kwoi6G_inputInvalid{border:1px solid var(--dsw-alias-state-error-primary,#b42318);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.Kwoi6G_inputInvalid:focus-visible{outline:2px solid var(--dsw-alias-state-error-primary,#b42318);outline-offset:1px;border-color:var(--dsw-alias-state-error-primary,#b42318)}.Kwoi6G_selectWrap{position:relative}.Kwoi6G_selectButton{appearance:none;text-align:left;cursor:pointer;justify-content:space-between;align-items:center;gap:8px;width:100%;display:flex}.Kwoi6G_selectLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.Kwoi6G_selectChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.Kwoi6G_selectChevronOpen{transform:rotate(180deg)}.Kwoi6G_selectPopup{z-index:40;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);max-height:240px;box-shadow:0 8px 24px var(--dsw-alias-bg-mask-2);opacity:0;border-radius:8px;flex-direction:column;padding:4px;transition:opacity .1s,transform .1s;display:flex;position:absolute;top:calc(100% + 4px);left:0;right:0;overflow-y:auto;transform:translateY(-4px)}.Kwoi6G_selectPopupOpen{opacity:1;transform:none}.Kwoi6G_selectPopupClose{opacity:0;pointer-events:none;transform:translateY(-4px)}.Kwoi6G_selectOption{color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;text-overflow:ellipsis;border-radius:6px;flex-shrink:0;padding:6px 10px;font-size:13px;line-height:1.5;overflow:hidden}.Kwoi6G_selectOption:hover,.Kwoi6G_selectOptionActive{background:var(--dsw-alias-interactive-bg-hover)}.Kwoi6G_selectOptionSelected{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 10%, transparent);font-weight:500}.Kwoi6G_invalid{color:var(--dsw-alias-state-error-primary,#b42318);margin:0;font-size:12px;line-height:1.5}.Kwoi6G_hint{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:1.5}@media (prefers-reduced-motion:reduce){.Kwoi6G_card,.Kwoi6G_header,.Kwoi6G_chevron,.Kwoi6G_chevronOpen,.Kwoi6G_discard,.Kwoi6G_save,.Kwoi6G_selectChevron,.Kwoi6G_selectChevronOpen,.Kwoi6G_selectPopup{transition:none}}";
		const tagId = "@linxin666/dsh-remote-web-ui/packages/dsh-remote-web-ui/src/client/settings-card.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-remote-web-ui";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var settings_card_module_css_default = {
			"badge": "Kwoi6G_badge",
			"badges": "Kwoi6G_badges",
			"body": "Kwoi6G_body",
			"card": "Kwoi6G_card",
			"cardOpen": "Kwoi6G_cardOpen",
			"chevron": "Kwoi6G_chevron",
			"chevronOpen": "Kwoi6G_chevronOpen",
			"description": "Kwoi6G_description",
			"discard": "Kwoi6G_discard",
			"failed": "Kwoi6G_failed",
			"field": "Kwoi6G_field",
			"footer": "Kwoi6G_footer",
			"head": "Kwoi6G_head",
			"headText": "Kwoi6G_headText",
			"header": "Kwoi6G_header",
			"headerStatic": "Kwoi6G_headerStatic",
			"hint": "Kwoi6G_hint",
			"input": "Kwoi6G_input",
			"inputInvalid": "Kwoi6G_inputInvalid",
			"invalid": "Kwoi6G_invalid",
			"label": "Kwoi6G_label",
			"name": "Kwoi6G_name",
			"notExposed": "Kwoi6G_notExposed",
			"pending": "Kwoi6G_pending",
			"readOnly": "Kwoi6G_readOnly",
			"reset": "Kwoi6G_reset",
			"save": "Kwoi6G_save",
			"select": "Kwoi6G_select",
			"selectButton": "Kwoi6G_selectButton",
			"selectChevron": "Kwoi6G_selectChevron",
			"selectChevronOpen": "Kwoi6G_selectChevronOpen",
			"selectLabel": "Kwoi6G_selectLabel",
			"selectOption": "Kwoi6G_selectOption",
			"selectOptionActive": "Kwoi6G_selectOptionActive",
			"selectOptionSelected": "Kwoi6G_selectOptionSelected",
			"selectPopup": "Kwoi6G_selectPopup",
			"selectPopupClose": "Kwoi6G_selectPopupClose",
			"selectPopupOpen": "Kwoi6G_selectPopupOpen",
			"selectWrap": "Kwoi6G_selectWrap"
		};
		//#endregion
		//#region src/client/PluginSettingsCard.tsx
		/**
		* Family-shared chrome for plugin settings cards: a disclosure header naming
		* the plugin and what its settings govern, the controls inside, and the save
		* that writes them. Renders nothing while the namespace is unavailable — a
		* deployment that does not compose the owning plugin should show no trace of
		* it. Inlined into each consumer's client bundle; mirrors the official
		* ui-plugin-config PluginCard in a self-contained slice.
		*/
		/**
		* Render one plugin settings card.
		* @param props - the plugin's copy keys, its form state, and its controls.
		* @returns the card, or nothing while the namespace is still loading.
		*/
		function PluginSettingsCard(props) {
			const [open, setOpen] = (0, react.useState)(props.defaultOpen ?? true);
			const { state, alwaysOpen } = props;
			if (!state.available) return null;
			const title = props.t(props.titleKey);
			const description = props.t(props.descriptionKey);
			const blocked = !state.dirty || state.invalid || state.saving;
			const expanded = alwaysOpen === true || open;
			const cardClass = expanded ? `${settings_card_module_css_default.cardOpen} ${settings_card_module_css_default.card}` : settings_card_module_css_default.card;
			const header = alwaysOpen === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.headerStatic,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: settings_card_module_css_default.headText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.name,
						title,
						children: title
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.description,
						title: description,
						children: props.descriptionNode ?? description
					})]
				}), state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: settings_card_module_css_default.pending,
					title: props.t("settings.unsaved"),
					children: props.t("settings.unsaved")
				}) : null]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: settings_card_module_css_default.header,
				"aria-expanded": open,
				"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
				onClick: () => {
					setOpen(!open);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: settings_card_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.name,
							title,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.description,
							title: description,
							children: props.descriptionNode ?? description
						})]
					}),
					state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.pending,
						title: props.t("settings.unsaved"),
						children: props.t("settings.unsaved")
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: open ? `${settings_card_module_css_default.chevron} ${settings_card_module_css_default.chevronOpen}` : settings_card_module_css_default.chevron,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
							fill: "currentColor"
						})
					})
				]
			});
			if (!state.exposed && props.renderChildrenWhenNotExposed !== true) {
				const showNotice = props.hideNotExposedNotice !== true;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
					className: cardClass,
					children: [header, expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: settings_card_module_css_default.body,
						children: showNotice ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.notExposed,
							role: "status",
							children: props.t("settings.notExposed")
						}) : null
					}) : null]
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: cardClass,
				children: [header, expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: settings_card_module_css_default.body,
					children: [
						!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.readOnly,
							role: "status",
							children: props.t("settings.readOnly")
						}) : null,
						props.children,
						props.hideFooter === true ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.footer,
							children: [
								state.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
									className: settings_card_module_css_default.failed,
									role: "status",
									children: [props.t("settings.saveFailed"), state.failedReason ? " - " + state.failedReason : ""]
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.discard,
									disabled: !state.dirty || state.saving,
									onClick: props.onDiscard,
									children: props.t("settings.discard")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.save,
									disabled: blocked,
									onClick: props.onSave,
									children: props.t(!state.saving ? "settings.save" : "settings.saving")
								})
							]
						})
					]
				}) : null]
			});
		}
		/** A staged value field. `numeric` only hints the keypad: which drafts a field accepts is decided by its spec. */
		function ValueField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						id: props.id,
						className: props.invalid ? settings_card_module_css_default.inputInvalid : settings_card_module_css_default.input,
						type: "text",
						...props.numeric === true ? { inputMode: "numeric" } : {},
						...props.invalid ? { "aria-invalid": true } : {},
						value: props.text,
						placeholder: props.placeholder ?? "",
						disabled: props.disabled,
						onChange: (event) => {
							props.onEdit(event.target.value);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: props.invalid ? settings_card_module_css_default.invalid : settings_card_module_css_default.hint,
						children: props.invalid ? props.invalidLabel : props.hint
					})
				]
			});
		}
		const NON_SKIN_BODY_MARKERS = /* @__PURE__ */ new Set(["dshSkinCenter", "dshSidebarCollapsed"]);
		function isSkinActive() {
			return Object.keys(document.body.dataset).some((key) => key.startsWith("dsh") && !NON_SKIN_BODY_MARKERS.has(key));
		}
		const SELECT_CLOSE_MS = 100;
		/**
		* The shared dual-mode select control. While an appearance skin is active it
		* renders the legacy native `<select>` untouched, so element-level skin
		* selectors keep working; under the default appearance it renders a
		* self-drawn `role="listbox"` popup whose open/close is transition-animated.
		* Staged cards reach it through BooleanField/ChoiceField; immediate-apply
		* editors (the side-card prefs) bind it directly through onEdit.
		* 双模式下拉框：皮肤激活时用原生 select，默认外观用自绘动画弹层。
		*/
		function SelectField(props) {
			const { id, options, value } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [closing, setClosing] = (0, react.useState)(false);
			const [phase, setPhase] = (0, react.useState)("initial");
			const [activeIndex, setActiveIndex] = (0, react.useState)(0);
			const closeTimer = (0, react.useRef)(void 0);
			const wrapRef = (0, react.useRef)(null);
			const popupRef = (0, react.useRef)(null);
			const currentIndex = () => {
				const index = options.findIndex((option) => option.value === value);
				return index >= 0 ? index : 0;
			};
			const close = (0, react.useCallback)(() => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
				setClosing(true);
				closeTimer.current = setTimeout(() => {
					setClosing(false);
					setOpen(false);
				}, SELECT_CLOSE_MS);
			}, []);
			const openPopup = () => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
				setActiveIndex(currentIndex());
				setPhase("initial");
				setClosing(false);
				setOpen(true);
			};
			const commit = (index) => {
				const option = options[index];
				if (option) props.onEdit(option.value);
				close();
			};
			const onTriggerClick = () => {
				if (props.disabled) return;
				if (open && !closing) close();
				else openPopup();
			};
			const onKeyDown = (event) => {
				if (props.disabled) return;
				const count = options.length;
				switch (event.key) {
					case "ArrowDown":
					case "ArrowUp":
					case "Enter":
					case " ":
						event.preventDefault();
						if (!open) openPopup();
						else if (!closing) if (event.key === "ArrowDown") setActiveIndex((index) => (index + 1) % count);
						else if (event.key === "ArrowUp") setActiveIndex((index) => (index - 1 + count) % count);
						else commit(activeIndex);
						break;
					case "Escape":
						if (open) {
							event.preventDefault();
							event.stopPropagation();
							close();
						}
						break;
					case "Tab":
						if (open) close();
						break;
				}
			};
			(0, react.useEffect)(() => () => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
			}, []);
			(0, react.useLayoutEffect)(() => {
				if (open && !closing && phase === "initial") {
					popupRef.current?.offsetHeight;
					setPhase("open");
				}
			}, [
				open,
				closing,
				phase
			]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					const target = event.target;
					if (target instanceof Node && !wrapRef.current?.contains(target)) close();
				};
				document.addEventListener("pointerdown", onPointerDown);
				return () => document.removeEventListener("pointerdown", onPointerDown);
			}, [open, close]);
			(0, react.useEffect)(() => {
				if (props.disabled && open) close();
			}, [
				props.disabled,
				open,
				close
			]);
			if (isSkinActive()) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
				id,
				className: settings_card_module_css_default.select,
				value,
				disabled: props.disabled,
				onChange: (event) => {
					props.onEdit(event.target.value);
				},
				children: options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: option.value,
					children: option.label
				}, option.value))
			});
			const label = options.find((option) => option.value === value)?.label ?? "";
			const popupClass = closing ? `${settings_card_module_css_default.selectPopup} ${settings_card_module_css_default.selectPopupClose}` : phase === "open" ? `${settings_card_module_css_default.selectPopup} ${settings_card_module_css_default.selectPopupOpen}` : settings_card_module_css_default.selectPopup;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.selectWrap,
				ref: wrapRef,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					id,
					className: `${settings_card_module_css_default.select} ${settings_card_module_css_default.selectButton}`,
					disabled: props.disabled,
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					"aria-activedescendant": open ? `${id}-o${activeIndex}` : void 0,
					"aria-invalid": props.invalid || void 0,
					onClick: onTriggerClick,
					onKeyDown,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.selectLabel,
						children: label
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: open ? `${settings_card_module_css_default.selectChevron} ${settings_card_module_css_default.selectChevronOpen}` : settings_card_module_css_default.selectChevron,
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
							fill: "currentColor"
						})
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: popupClass,
					role: "listbox",
					ref: popupRef,
					children: options.map((option, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						id: `${id}-o${index}`,
						role: "option",
						"aria-selected": option.value === value,
						className: `${settings_card_module_css_default.selectOption}${option.value === value ? ` ${settings_card_module_css_default.selectOptionSelected}` : ""}${index === activeIndex && !closing ? ` ${settings_card_module_css_default.selectOptionActive}` : ""}`,
						onClick: () => {
							commit(index);
						},
						children: option.label
					}, option.value))
				}) : null]
			});
		}
		/** A staged boolean field: 继承 / 开 / 关. */
		function BooleanField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
						id: props.id,
						options: [
							{
								value: "",
								label: props.inheritLabel
							},
							{
								value: "true",
								label: props.onLabel
							},
							{
								value: "false",
								label: props.offLabel
							}
						],
						value: props.text,
						disabled: props.disabled,
						invalid: props.invalid,
						onEdit: props.onEdit
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.hint,
						children: props.hint
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-store-engine
		const platform = ["@deepseek-ai/dsh-client", "-store"].join("");
		const legacy = ["@deepseek-ai/dsh-client-runtime", "/client"].join("");
		let engine;
		try {
			engine = require(platform);
		} catch {
			engine = require(legacy);
		}
		const createSnapshotStore = engine.createSnapshotStore;
		engine.defineStore;
		engine.shallowEqual;
		//#endregion
		//#region src/client/settings-form.ts
		/** A whole- or decimal-number field. An empty draft clears the field; any other draft that is not a finite number within the constraints blocks the save. */
		function numberField(field, constraints = {}) {
			const { integer = false, min } = constraints;
			return {
				field,
				format: (value) => typeof value === "number" ? String(value) : "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return { kind: "clear" };
					const parsed = Number(trimmed);
					if (!Number.isFinite(parsed)) return void 0;
					if (integer && !Number.isInteger(parsed)) return void 0;
					if (min !== void 0 && parsed < min) return void 0;
					return {
						kind: "set",
						value: parsed
					};
				}
			};
		}
		/** A free-text field. An empty draft clears the field. */
		function textField(field) {
			return {
				field,
				format: (value) => typeof value === "string" ? value : "",
				parse: (text) => {
					const trimmed = text.trim();
					return trimmed === "" ? { kind: "clear" } : {
						kind: "set",
						value: trimmed
					};
				}
			};
		}
		/**
		* A free-text field the Host treats as a secret and redacts from the read-back
		* (role('secret') in the section schema). The card still edits it like text,
		* but a save never compares the redacted value back: the staged set is judged
		* by the mutation settling (see {@link FieldSpec.secret}).
		*/
		function secretField(field) {
			return {
				...textField(field),
				secret: true
			};
		}
		/** A boolean field, edited through true/false draft text. */
		function booleanField(field) {
			return {
				field,
				format: (value) => typeof value === "boolean" ? String(value) : "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return { kind: "clear" };
					if (trimmed === "true") return {
						kind: "set",
						value: true
					};
					if (trimmed === "false") return {
						kind: "set",
						value: false
					};
				}
			};
		}
		/**
		* Stages one card's edits over one settings namespace and writes them on save.
		*
		* The Host is the only authority on whether a value was accepted — its
		* validators own the constraints no schema can express — so the outcome is
		* read back from the section rather than predicted here. A save that did not
		* land keeps its drafts, so the user can correct them instead of retyping.
		*/
		var CardForm = class {
			scope;
			specs;
			staged = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			/** The form subscription installed in the constructor; released by dispose(). */
			disposeForm;
			disposed = false;
			saving = false;
			/** A save asked for while one was in flight; it runs once the first settles (#1754). */
			saveQueued = false;
			failed = false;
			failedReason;
			/** @param scope - the bound configuration form for this card's namespace. */
			constructor(scope, specs) {
				this.scope = scope;
				this.specs = new Map(specs.map((spec) => [spec.field, spec]));
				this.disposeForm = scope.subscribe(() => {
					this.publish();
				});
			}
			/**
			* Release the form subscription and every bound store listener. The card
			* must call this on teardown; later calls are no-ops.
			*/
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				this.disposeForm();
				this.listeners.clear();
			}
			/** Publish a projection of this form, rebuilt whenever the form or a draft changes. */
			bind(project) {
				const store = createSnapshotStore(project());
				this.listeners.add(() => {
					store.set(project());
				});
				return store;
			}
			/** Read the card-level state: what the Host serves, and what a save would do. */
			shell() {
				const snapshot = this.scope.getSnapshot();
				const plan = this.plan();
				return {
					available: snapshot.status !== "loading",
					exposed: snapshot.status === "ready",
					writable: snapshot.writable,
					dirty: plan.length > 0,
					invalid: plan.some((item) => item.judge === void 0),
					saving: this.saving,
					failed: this.failed,
					...this.failedReason === void 0 ? {} : { failedReason: this.failedReason }
				};
			}
			/** Read one field's state from the effective section and its staged draft. */
			field(field) {
				const spec = this.specOf(field);
				const staged = this.staged.get(field);
				if (staged === void 0) return {
					text: spec.format(this.sectionValue(field)),
					overridden: this.stored(field),
					invalid: false
				};
				const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
				return {
					text: staged.text,
					overridden: write?.kind === "set",
					invalid: write === void 0
				};
			}
			/** The actions the card's slot registration injects. */
			actions() {
				return {
					edit: (field, text) => {
						this.stage(field, {
							text,
							clear: false
						});
					},
					resetField: (field) => {
						this.stage(field, {
							text: this.specOf(field).format(this.baseValue(field)),
							clear: true
						});
					},
					save: () => {
						this.requestSave();
					},
					discard: () => {
						if (this.staged.size === 0 && !this.failed) return;
						this.staged.clear();
						this.failed = false;
						this.failedReason = void 0;
						this.publish();
					}
				};
			}
			/**
			* Write every staged edit in one atomic form mutation, then re-seed from
			* what the Host accepted.
			*
			* The whole batch rides one mutate, so cross-field validate hooks
			* (baseURL+model) judge it as a unit: the Host either applies every write
			* or refuses the batch. The form contract answers a refusal or a skipped
			* write with `false` (it recovers with a fresh Host view instead of
			* throwing), so the outcome is judged twice: the answer itself, and then the
			* settled snapshot read back one planned write at a time. One missed write
			* fails the whole save. A transport that rejects instead (the dsh-web bridge
			* controller on a dead connection) reports through the same failure path
			* with its rejection message. A save that did not land keeps its drafts, so
			* the user can correct them instead of retyping.
			* @returns settlement after the mutation and the read-back.
			*/
			/**
			* Run one save, and re-run it once if another was asked for while this one
			* was still in flight.
			*
			* A save is a Host round trip that also drives the profile reconcile, and
			* the Host runs that write inside one exclusive transaction. Answering a
			* press that arrives mid-flight by returning immediately dropped the edit
			* with no explanation, which is the "the save button stops working after a
			* few rounds" report (#1754). Serializing instead means a save pressed while
			* another is still settling runs against the settled state - which is what
			* the operator meant by pressing it again.
			* @returns settlement after the mutation and the read-back.
			*/
			async requestSave() {
				if (this.saving) {
					this.saveQueued = true;
					return;
				}
				await this.save();
				if (!this.saveQueued) return;
				this.saveQueued = false;
				await this.requestSave();
			}
			async save() {
				const plan = this.plan();
				const valid = plan.filter((item) => item.judge !== void 0);
				if (plan.length === 0 || this.saving || valid.length !== plan.length) return;
				const pending = /* @__PURE__ */ new Map();
				for (const item of plan) pending.set(item.field, this.staged.get(item.field));
				this.saving = true;
				this.failed = false;
				this.failedReason = void 0;
				this.publish();
				const ops = valid.map((item) => item.op.op === "set" ? {
					op: "set",
					path: [item.field],
					value: item.op.value
				} : {
					op: "unset",
					path: [item.field]
				});
				let failedReason;
				let accepted = false;
				try {
					accepted = await this.scope.mutate(ops);
				} catch (error) {
					failedReason = error instanceof Error ? error.message : String(error);
				}
				const landed = accepted && failedReason === void 0 && valid.every((item) => item.judge());
				for (const [field, before] of pending) if (landed && this.staged.get(field) === before) this.staged.delete(field);
				this.saving = false;
				this.failed = !landed;
				this.failedReason = failedReason;
				this.publish();
			}
			/**
			* Every staged edit a save would write. An entry whose draft is not a value
			* its field accepts carries no write: the form is still dirty, and the save
			* refuses rather than dropping the edit. A staged edit that matches the
			* effective section is not a write at all.
			* @returns the planned writes, in the order the fields were staged.
			*/
			plan() {
				const plan = [];
				for (const [field, staged] of this.staged) {
					const spec = this.specOf(field);
					if (staged.clear) {
						if (this.stored(field)) plan.push({
							field,
							op: {
								field,
								op: "unset"
							},
							judge: () => this.landedUnset(field)
						});
						continue;
					}
					if (staged.text === spec.format(this.sectionValue(field))) continue;
					const write = spec.parse(staged.text);
					if (write === void 0) plan.push({
						field,
						op: {
							field,
							op: "unset"
						},
						judge: void 0
					});
					else if (write.kind === "clear") plan.push({
						field,
						op: {
							field,
							op: "unset"
						},
						judge: () => this.landedUnset(field)
					});
					else plan.push({
						field,
						op: {
							field,
							op: "set",
							value: write.value
						},
						judge: () => this.landedSet(field, write.value)
					});
				}
				return plan;
			}
			/**
			* Read-back judgment for a planned set: the user layer must hold the
			* intended value once the mutation has settled.
			*/
			landedSet(field, value) {
				if (this.specOf(field).secret) return true;
				return this.userLayer()?.[field] === value;
			}
			/**
			* Read-back judgment for a planned unset: the field must be gone from the
			* user layer once the mutation has settled.
			*/
			landedUnset(field) {
				return !this.stored(field);
			}
			stage(field, edit) {
				this.staged.set(field, edit);
				this.failed = false;
				this.failedReason = void 0;
				this.publish();
			}
			specOf(field) {
				const spec = this.specs.get(field);
				if (spec === void 0) throw new Error(`settings card has no field ${field}`);
				return spec;
			}
			snapshotOf() {
				return this.scope.getSnapshot();
			}
			sectionValue(field) {
				return this.snapshotOf().value?.[field];
			}
			baseValue(field) {
				return this.snapshotOf().base?.[field];
			}
			userLayer() {
				return this.snapshotOf().user;
			}
			stored(field) {
				const user = this.userLayer();
				return user !== void 0 && Object.hasOwn(user, field);
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/RemoteSettingsCard.tsx
		/**
		* The remote-control settings card: pairing security and device limits.
		* Registers into the `web-ui.plugin.item` child slot the Web UI plugin group
		* renders, bound to the `remote-web-ui` profile entry's configuration form.
		*/
		/** Bridges the `remote-web-ui` form onto the card's staged form. */
		var RemoteSettingsCardController = class {
			form;
			store;
			/** @param scope - the configuration form for the `remote-web-ui` entry. */
			constructor(scope) {
				this.form = new CardForm(scope, [
					booleanField("enabled"),
					numberField("tokenTtlMs"),
					numberField("offlineAfterMs"),
					numberField("maxDevices"),
					numberField("idleExpireMs"),
					textField("cookieName"),
					booleanField("requirePairingForLan"),
					textField("publicBaseUrl"),
					booleanField("autoTunnel"),
					secretField("tunnelToken"),
					booleanField("relay"),
					booleanField("lanBind")
				]);
				this.store = this.form.bind(() => this.projection());
			}
			projection() {
				return {
					...this.form.shell(),
					enabled: this.form.field("enabled"),
					tokenTtlMs: this.form.field("tokenTtlMs"),
					offlineAfterMs: this.form.field("offlineAfterMs"),
					maxDevices: this.form.field("maxDevices"),
					idleExpireMs: this.form.field("idleExpireMs"),
					cookieName: this.form.field("cookieName"),
					requirePairingForLan: this.form.field("requirePairingForLan"),
					publicBaseUrl: this.form.field("publicBaseUrl"),
					autoTunnel: this.form.field("autoTunnel"),
					tunnelToken: this.form.field("tunnelToken"),
					relay: this.form.field("relay"),
					lanBind: this.form.field("lanBind")
				};
			}
			/**
			* Build the face the card's slot registration injects.
			* @returns the card's snapshot and its form actions.
			*/
			inject() {
				return {
					hooks: { remoteSettingsCard: this.store },
					...this.form.actions()
				};
			}
			/**
			* Release the card's form subscription and bound stores; the slot
			* disposer calls this on teardown.
			*/
			dispose() {
				this.form.dispose();
			}
		};
		/**
		* Render the remote-control card.
		* @param props - locale copy, the card snapshot, and its form actions.
		* @returns the card.
		*/
		function RemoteSettingsCard(props) {
			const { t } = props;
			const state = props.useRemoteSettingsCard((snapshot) => snapshot);
			const disabled = !state.writable;
			const fieldProps = {
				overriddenLabel: t("settings.overridden"),
				resetLabel: t("settings.reset"),
				invalidLabel: t("settings.invalidNumber"),
				disabled
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(PluginSettingsCard, {
				t,
				titleKey: "settings.title",
				descriptionKey: "settings.description",
				defaultOpen: false,
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-remote-enabled",
						label: t("settings.enabled"),
						hint: t("settings.enabledHint"),
						inheritLabel: t("settings.inherit"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.enabled,
						onEdit: (text) => {
							props.edit("enabled", text);
						},
						onReset: () => {
							props.resetField("enabled");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-token-ttl",
						label: t("settings.tokenTtlMs"),
						hint: t("settings.tokenTtlMsHint"),
						numeric: true,
						...fieldProps,
						...state.tokenTtlMs,
						onEdit: (text) => {
							props.edit("tokenTtlMs", text);
						},
						onReset: () => {
							props.resetField("tokenTtlMs");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-offline",
						label: t("settings.offlineAfterMs"),
						hint: t("settings.offlineAfterMsHint"),
						numeric: true,
						...fieldProps,
						...state.offlineAfterMs,
						onEdit: (text) => {
							props.edit("offlineAfterMs", text);
						},
						onReset: () => {
							props.resetField("offlineAfterMs");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-max-devices",
						label: t("settings.maxDevices"),
						hint: t("settings.maxDevicesHint"),
						numeric: true,
						...fieldProps,
						...state.maxDevices,
						onEdit: (text) => {
							props.edit("maxDevices", text);
						},
						onReset: () => {
							props.resetField("maxDevices");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-idle-expire",
						label: t("settings.idleExpireMs"),
						hint: t("settings.idleExpireMsHint"),
						numeric: true,
						...fieldProps,
						...state.idleExpireMs,
						onEdit: (text) => {
							props.edit("idleExpireMs", text);
						},
						onReset: () => {
							props.resetField("idleExpireMs");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-cookie",
						label: t("settings.cookieName"),
						hint: t("settings.cookieNameHint"),
						...fieldProps,
						...state.cookieName,
						onEdit: (text) => {
							props.edit("cookieName", text);
						},
						onReset: () => {
							props.resetField("cookieName");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-remote-fence",
						label: t("settings.requirePairingForLan"),
						hint: t("settings.requirePairingForLanHint"),
						inheritLabel: t("settings.inherit"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.requirePairingForLan,
						onEdit: (text) => {
							props.edit("requirePairingForLan", text);
						},
						onReset: () => {
							props.resetField("requirePairingForLan");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-public-base",
						label: t("settings.publicBaseUrl"),
						hint: t("settings.publicBaseUrlHint"),
						placeholder: "https://example.trycloudflare.com",
						...fieldProps,
						...state.publicBaseUrl,
						onEdit: (text) => {
							props.edit("publicBaseUrl", text);
						},
						onReset: () => {
							props.resetField("publicBaseUrl");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-remote-auto-tunnel",
						label: t("settings.autoTunnel"),
						hint: t("settings.autoTunnelHint"),
						inheritLabel: t("settings.inherit"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.autoTunnel,
						onEdit: (text) => {
							props.edit("autoTunnel", text);
						},
						onReset: () => {
							props.resetField("autoTunnel");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
						id: "settings-remote-tunnel-token",
						label: t("settings.tunnelToken"),
						hint: t("settings.tunnelTokenHint"),
						placeholder: "eyJ...",
						...fieldProps,
						...state.tunnelToken,
						onEdit: (text) => {
							props.edit("tunnelToken", text);
						},
						onReset: () => {
							props.resetField("tunnelToken");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-remote-relay",
						label: t("settings.relay"),
						hint: t("settings.relayHint"),
						inheritLabel: t("settings.inherit"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.relay,
						onEdit: (text) => {
							props.edit("relay", text);
						},
						onReset: () => {
							props.resetField("relay");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LanBindStatus, { t }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-remote-lan-bind",
						label: t("settings.lanBind"),
						hint: t("settings.lanBindHint"),
						inheritLabel: t("settings.inherit"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.lanBind,
						onEdit: (text) => {
							props.edit("lanBind", text);
						},
						onReset: () => {
							props.resetField("lanBind");
						}
					})
				]
			});
		}
		/**
		* Live LAN-bind facts above the toggle: the managed block's host, the live
		* bind, the firewall summary, and the reachable LAN URLs. Polls the
		* loopback-only status endpoint; a failure (non-loopback origin) renders
		* nothing — the pairing panel carries the loopback banner instead.
		*/
		function LanBindStatus({ t }) {
			const [frame, setFrame] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				let alive = true;
				const read = () => {
					readLanBindStatus().then((value) => {
						if (alive) setFrame(value);
					}).catch((error) => {
						if (error instanceof LanBindStatusError && shouldStopLanBindPoll(error.status)) window.clearInterval(timer);
					});
				};
				const timer = window.setInterval(read, 1e4);
				read();
				return () => {
					alive = false;
					window.clearInterval(timer);
				};
			}, []);
			if (frame === void 0) return null;
			const lanOn = frame.blockHost === "0.0.0.0";
			const firewallText = frame.firewall.managed ? t(frame.firewall.ok ? "lan.firewall.ok" : "lan.firewall.bad") : t("lan.firewall.unmanaged");
			const lines = [t("lan.bind", {
				host: frame.bindHost,
				port: String(frame.port)
			}) + " · " + firewallText];
			if (lanOn && frame.lanUrls.length > 0) lines.push(t("lan.urls", { urls: frame.lanUrls.join("  ") }));
			if (!lanOn) lines.push(t("lan.off"));
			if (frame.setting === null) lines.push(t("lan.untouched"));
			if (frame.pendingRestart === true) lines.push(t("lan.pendingRestart"));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 2,
					fontSize: 12,
					lineHeight: "18px",
					opacity: .85
				},
				children: lines.map((line, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: { wordBreak: "break-all" },
					children: line
				}, index))
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `remote` namespace dictionaries: the remote-access surface copy. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"entry.label": "远程访问",
			"mobile.whale.open": "打开侧边栏",
			"mobile.composer.pickModel": "选择模型",
			"mobile.composer.pickEffort": "选择推理等级",
			"title": "远程访问",
			"subtitle": "通过手机或另一台电脑配对，远程使用同一份 Web 界面（官方界面 + 移动端适配）",
			"card.title": "设备配对",
			"public.badge": "公网",
			"status.waiting": "等待设备连接",
			"status.connected": "已连接 {n} 台设备",
			"status.disconnected": "已配对设备离线",
			"status.stopped": "已停止远程访问",
			"status.lanRequired": "此功能需要局域网绑定或公网地址才能使用",
			"status.lanRequiredHint": "当前服务仅绑定在 127.0.0.1 且未配置公网地址，手机无法访问。请在本插件的设置卡片中打开“局域网访问”（装在全家桶里时在「设置 → Web 插件 → 远程访问设置」，单独安装时在设置 → 插件 → 本插件行），或用 dsh web --host 0.0.0.0 重新启动，或填写内网穿透的公网地址。",
			"status.loopbackRequired": "配对面板仅限本机使用",
			"status.loopbackRequiredHint": "请通过 http://127.0.0.1 打开此页面后重试；手机请使用配对链接访问。",
			"status.unreachable": "无法连接配对服务",
			"status.unreachableHint": "请刷新页面后重试。",
			"pair.hint": "无法扫码？可直接打开下方配对链接",
			"pair.publicHint": "公网链接：设备无需与本机处于同一网络",
			"address.label": "选择二维码指向的网络",
			"address.public": "公网地址",
			"address.lan": "局域网",
			"address.hint": "远程设备不在同一网络时请使用公网地址；局域网地址仅限同一网络内使用。",
			"pair.expires": "二维码有效至 {time}",
			"pair.expired": "二维码已过期，请刷新",
			"pair.linkLabel": "配对链接",
			"pair.tokenLabel": "配对令牌",
			"pair.dockerHint": "Docker 或反向代理环境下，可直接复制此令牌并在目标设备配对页面输入。",
			"pair.oneTimeHint": "链接含限时令牌；在令牌过期或刷新二维码之前，同一链接可为多台设备完成配对（每次配对各自生成独立设备会话）。",
			"pair.failed.title": "配对失败",
			"pair.failed.detail": "链接无效或已过期，请回到电脑端刷新二维码后重新扫码。",
			"fence.unpaired.title": "此设备未配对，无法访问工作区数据",
			"fence.unpaired.eyebrow": "需要设备配对",
			"fence.unpaired.hint": "为保护工作区、会话与插件数据，远程电脑必须先通过主电脑授权。",
			"fence.unpaired.stepDesktop": "在主电脑打开 http://127.0.0.1:3080，进入“远程访问”。",
			"fence.unpaired.stepLink": "在“设备配对”中复制电脑配对链接。",
			"fence.unpaired.stepOpen": "在当前浏览器打开该链接，完成授权后即可进入。",
			"fence.unpaired.retry": "重新检测",
			"fence.unpaired.tokenPlaceholder": "或在此直接粘贴配对链接 / Token",
			"fence.unpaired.pairAction": "立即配对",
			"fence.unpaired.pairing": "配对中…",
			"fence.unpaired.tokenInvalid": "配对链接或 Token 无效已过期",
			"fence.unpaired.tokenFailed": "配对失败，请检查网络或重新获取链接",
			"fence.unpaired.footnote": "请勿使用他人提供的配对链接；管理员可随时取消此设备的授权。",
			"posture.exposed": "/api 通道对未配对设备敞开",
			"posture.exposedHint": "以下来源的请求未经配对即可访问完整桌面 API：{hosts}。请移除对应来源的 --trusted-host（配对机制已覆盖远程访问），或改为仅绑定 127.0.0.1 并使用隧道。",
			"action.stop": "停止",
			"action.refresh": "刷新二维码",
			"action.copy": "复制链接",
			"action.copyLink": "复制链接",
			"action.copyToken": "复制令牌",
			"action.copied": "已复制",
			"action.copiedToken": "已复制令牌",
			"devices.title": "已授权设备",
			"devices.empty": "还没有已配对的设备。扫码或打开链接后会出现在这里。",
			"devices.unknown": "未知设备",
			"devices.online": "在线",
			"devices.offline": "离线",
			"devices.lastSeen": "最近活动 {time}",
			"devices.revoke": "取消配对",
			"devices.revoke.label": "取消配对此设备",
			"lanAllow.title": "局域网设备批准",
			"lanAllow.on": "已开启：批准过的地址无需令牌即可连接。",
			"lanAllow.off": "已关闭：只有配对令牌能连接。",
			"lanAllow.unavailable": "当前部署没有启用批准名单。",
			"lanAllow.pendingTitle": "等待批准的连接",
			"lanAllow.pendingEmpty": "暂时没有被拒绝的连接。",
			"lanAllow.approvedTitle": "已批准设备",
			"lanAllow.approvedEmpty": "还没有已批准的设备。",
			"lanAllow.approve": "批准",
			"lanAllow.approve.label": "批准这个地址连接",
			"lanAllow.dismiss": "忽略",
			"lanAllow.dismiss.label": "忽略这条连接记录",
			"lanAllow.remove": "移除",
			"lanAllow.remove.label": "移除这个地址的访问权",
			"lanAllow.hits": "被拒绝 {n} 次",
			"lanAllow.rule": "网段规则",
			"stopped.hint": "已停止远程访问。点击\"刷新二维码\"重新开启。",
			"tunnel.starting": "公网隧道启动中，二维码将自动变为公网链接…",
			"tunnel.failed": "公网隧道启动失败：{error}",
			"tunnel.unknownError": "未知错误",
			"relay.registering": "正在把临时隧道同步到固定域名（<id>.dsh-market.com）…",
			"relay.failed": "固定域名同步失败：{error}。正在自动重试，期间二维码可能使用临时地址。",
			"close.label": "关闭远程访问面板",
			"settings.title": "远程访问设置",
			"settings.description": "配对安全与设备限额。",
			"settings.enabled": "启用远程访问",
			"settings.enabledHint": "关闭后移除侧边栏入口并停用配对路由与局域网栅栏。",
			"settings.tokenTtlMs": "配对令牌有效期（毫秒）",
			"settings.tokenTtlMsHint": "新生成的二维码链接在此时间后失效。",
			"settings.offlineAfterMs": "设备离线判定（毫秒）",
			"settings.offlineAfterMsHint": "配对设备超过该时长未上报心跳即视为离线。",
			"settings.maxDevices": "已配对设备上限",
			"settings.maxDevicesHint": "超过上限时淘汰最旧的设备会话。",
			"settings.idleExpireMs": "空闲过期（毫秒）",
			"settings.idleExpireMsHint": "超过该时长没有任何心跳或请求的已配对设备会被删除，必须重新扫码。默认 7 天。",
			"settings.cookieName": "设备 Cookie 名",
			"settings.cookieNameHint": "携带已配对设备标识的 Cookie 名称。",
			"settings.requirePairingForLan": "局域网访问要求配对",
			"settings.requirePairingForLanHint": "开启：非本机回环的桌面 Web GUI 改走门控的 /remote，必须携带有效配对 Cookie；关闭：桌面继续走普通路径（仅在该来源已被 SDK 信任时有意义），配对只管理令牌与状态。",
			"settings.publicBaseUrl": "公网地址（可选）",
			"settings.publicBaseUrlHint": "内网穿透的公网地址，如 Cloudflare Tunnel：https://xxx.trycloudflare.com；固定域名隧道（下方令牌）也填这里。填写后二维码将生成公网链接，手机不在同一网络也能配对；留空则仅局域网可用。",
			"settings.autoTunnel": "自动公网隧道",
			"settings.autoTunnelHint": "开启后插件自动启动 Cloudflare quick tunnel（无需安装任何工具），并自动更新公网地址与信任配置，手机随时可用公网配对；注意临时域名每次重启都会变化，手机需重新扫码。开启时忽略下方固定隧道令牌与上方手动公网地址。",
			"settings.tunnelToken": "固定域名隧道令牌（Cloudflare Tunnel）",
			"settings.tunnelTokenHint": "填入 Cloudflare 命名隧道的 Token（即 cloudflared tunnel run --token 的值），插件会自动运行该隧道：公共主机名固定不变，手机配对一次后重启也无需重新配对。需先在 Cloudflare 控制台把公共主机名映射到 http://127.0.0.1:<端口>，并在上方\"公网地址\"填写同一域名。优先级低于\"自动公网隧道\"。",
			"settings.relay": "固定域名中继（推荐开启）",
			"settings.relayHint": "开启后自动隧道会额外注册一个固定不变的公网子域名（<id>.dsh-market.com，由 dsh-market 边缘中继到你的临时隧道），手机配对一次后重启无需重新扫码，二维码与书签地址永远不变。流量经由 dsh-market 边缘转发（与临时隧道相同的信任面）；关闭则回退为纯临时地址，每次重启需重新配对。仅对\"自动公网隧道\"生效。",
			"settings.lanBind": "局域网访问（绑定 0.0.0.0）",
			"settings.lanBindHint": "开启后插件把绑定默认改写为 0.0.0.0 并写入 profile 补丁（显式 --host 仍优先），同时维护主机防火墙放行（Windows/Linux；macOS 无需管理）；关闭回退 127.0.0.1。绑定变化通常在重启 dsh web 后生效。",
			"lan.cardTitle": "局域网访问",
			"lan.bind": "绑定：{host}:{port}",
			"lan.off": "当前仅本机可访问。",
			"lan.urls": "局域网地址：{urls}",
			"lan.firewall.ok": "防火墙已放行",
			"lan.firewall.bad": "防火墙未放行（需管理员权限）",
			"lan.firewall.unmanaged": "防火墙不由插件管理（未检测到受支持的防火墙）",
			"lan.untouched": "开关尚未使用：打开后插件才会改写 profile 补丁。",
			"lan.pendingRestart": "绑定将在重启 dsh web 后生效。",
			"settings.inherit": "继承",
			"settings.on": "开",
			"settings.off": "关",
			"settings.overridden": "已覆盖",
			"settings.reset": "恢复默认",
			"settings.notExposed": "当前 DSH 版本未向设置页暴露本插件的配置命名空间，表单不可用。可编辑 $DSH_HOME/settings.yaml 直接配置，或确认提供该命名空间的插件已挂载其设置域并重启。",
			"settings.readOnly": "当前部署的设置只读。",
			"settings.expand": "展开设置",
			"settings.collapse": "收起设置",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.discard": "放弃",
			"settings.unsaved": "未保存",
			"settings.saveFailed": "部署未接受这些值，已保留供你修改。",
			"settings.invalidNumber": "请输入数字，留空则使用默认值。"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"entry.label": "Remote access",
			"mobile.whale.open": "Open sidebar",
			"mobile.composer.pickModel": "Pick model",
			"mobile.composer.pickEffort": "Pick reasoning effort",
			"title": "Remote access",
			"subtitle": "Pair a phone or another computer to share the same Web GUI (official UI + mobile adaptation)",
			"card.title": "Pair a device",
			"public.badge": "Public",
			"status.waiting": "Waiting for a device",
			"status.connected": "{n} device(s) connected",
			"status.disconnected": "Paired devices offline",
			"status.stopped": "Remote access stopped",
			"status.lanRequired": "This feature needs a LAN bind or a public address",
			"status.lanRequiredHint": "The server is bound to 127.0.0.1 and no public address is configured, so a phone cannot reach it. Turn on LAN access in this plugin settings card (under Settings → Web Plugins → Remote access when the full family is installed, or on this plugin row under Settings → Plugins for a standalone install), or restart with dsh web --host 0.0.0.0, or set the tunneled public address.",
			"status.loopbackRequired": "The pairing panel works on this machine only",
			"status.loopbackRequiredHint": "Open this page at http://127.0.0.1 to mint a QR code; phones use the paired link.",
			"status.unreachable": "Cannot reach the pairing service",
			"status.unreachableHint": "Refresh the page and try again.",
			"pair.hint": "Cannot scan? Open one of the pairing links below",
			"pair.publicHint": "Public links work when the device is not on the same network",
			"address.label": "Network the QR code points to",
			"address.public": "Public",
			"address.lan": "LAN",
			"address.hint": "Use the public address when the remote device is on another network; LAN addresses only work on the same network.",
			"pair.expires": "QR code valid until {time}",
			"pair.expired": "QR code expired — refresh it",
			"pair.linkLabel": "Pairing link",
			"pair.tokenLabel": "Pairing token",
			"pair.dockerHint": "In Docker or reverse proxy environments, copy this token to pair directly on the target device.",
			"pair.oneTimeHint": "The link carries a time-limited token: until it expires or the QR is refreshed, the same link can pair several devices, each with its own device session.",
			"pair.failed.title": "Pairing failed",
			"pair.failed.detail": "The link is invalid or has expired. Refresh the QR code on your computer and scan again.",
			"fence.unpaired.title": "This device is not paired and cannot reach workspace data",
			"fence.unpaired.eyebrow": "Device pairing required",
			"fence.unpaired.hint": "To protect workspace, session, and plugin data, a remote computer must first be authorized by the primary computer.",
			"fence.unpaired.stepDesktop": "On the primary computer, open http://127.0.0.1:3080 and go to Remote access.",
			"fence.unpaired.stepLink": "Copy the computer pairing link under Pair a device.",
			"fence.unpaired.stepOpen": "Open that link in this browser. After authorization, the workspace will become available.",
			"fence.unpaired.retry": "Check again",
			"fence.unpaired.tokenPlaceholder": "Or paste pairing link / token here",
			"fence.unpaired.pairAction": "Pair Now",
			"fence.unpaired.pairing": "Pairing…",
			"fence.unpaired.tokenInvalid": "Pairing link or token is invalid or expired",
			"fence.unpaired.tokenFailed": "Pairing failed, please check network or issue a new link",
			"fence.unpaired.footnote": "Do not use pairing links from people you do not trust. An administrator can revoke this device at any time.",
			"posture.exposed": "The /api channel is open to unpaired devices",
			"posture.exposedHint": "Requests from {hosts} reach the full desktop API without pairing. Remove --trusted-host for them (pairing already covers remote access), or bind loopback only and use the tunnel.",
			"action.stop": "Stop",
			"action.refresh": "Refresh QR",
			"action.copy": "Copy link",
			"action.copyLink": "Copy link",
			"action.copyToken": "Copy token",
			"action.copied": "Copied",
			"action.copiedToken": "Token copied",
			"devices.title": "Authorized devices",
			"devices.empty": "No paired devices yet. Scan the QR or open the link to add one.",
			"devices.unknown": "Unknown device",
			"devices.online": "Online",
			"devices.offline": "Offline",
			"devices.lastSeen": "Last active {time}",
			"devices.revoke": "Unpair",
			"devices.revoke.label": "Unpair this device",
			"lanAllow.title": "LAN device approval",
			"lanAllow.on": "On: an approved address connects without a token.",
			"lanAllow.off": "Off: only a pairing token can connect.",
			"lanAllow.unavailable": "This deployment carries no approval list.",
			"lanAllow.pendingTitle": "Waiting for approval",
			"lanAllow.pendingEmpty": "No refused connections right now.",
			"lanAllow.approvedTitle": "Approved devices",
			"lanAllow.approvedEmpty": "No approved devices yet.",
			"lanAllow.approve": "Approve",
			"lanAllow.approve.label": "Approve this address",
			"lanAllow.dismiss": "Dismiss",
			"lanAllow.dismiss.label": "Dismiss this connection record",
			"lanAllow.remove": "Remove",
			"lanAllow.remove.label": "Remove this address's access",
			"lanAllow.hits": "Refused {n} times",
			"lanAllow.rule": "Subnet rule",
			"stopped.hint": "Remote access is stopped. Click \"Refresh QR\" to re-enable it.",
			"tunnel.starting": "The public tunnel is starting; the QR code will switch to a public link shortly…",
			"tunnel.failed": "The public tunnel failed to start: {error}",
			"tunnel.unknownError": "unknown error",
			"relay.registering": "Syncing the ephemeral tunnel to the stable hostname (<id>.dsh-market.com)…",
			"relay.failed": "Stable-hostname sync failed: {error}. Retrying automatically; the QR may use the ephemeral address meanwhile.",
			"close.label": "Close remote access panel",
			"settings.title": "Remote access settings",
			"settings.description": "Pairing security and device limits.",
			"settings.enabled": "Enable remote access",
			"settings.enabledHint": "When off, the sidebar entry is removed and pairing routes plus the LAN fence stop.",
			"settings.tokenTtlMs": "Pairing token lifetime (ms)",
			"settings.tokenTtlMsHint": "How long a minted QR link stays valid before it dies.",
			"settings.offlineAfterMs": "Device offline threshold (ms)",
			"settings.offlineAfterMsHint": "A paired device flips to offline when it has not been seen for this long.",
			"settings.maxDevices": "Paired device cap",
			"settings.maxDevicesHint": "Hard cap on paired device sessions; the oldest is evicted when full.",
			"settings.idleExpireMs": "Idle expiry (ms)",
			"settings.idleExpireMsHint": "A paired device with no heartbeat or request for this long is deleted and must scan again. Default is 7 days.",
			"settings.cookieName": "Device cookie name",
			"settings.cookieNameHint": "Cookie that carries the paired device id.",
			"settings.requirePairingForLan": "Require pairing for LAN access",
			"settings.requirePairingForLanHint": "On: a desktop Web GUI at a non-loopback origin rides the gated /remote channel and must carry a live paired-device cookie. Off: the desktop stays on its original paths (only useful when that origin is already trusted) and pairing only manages tokens/status.",
			"settings.publicBaseUrl": "Public address (optional)",
			"settings.publicBaseUrlHint": "The public URL of a tunnel in front of this server, e.g. a Cloudflare Tunnel: https://xxx.trycloudflare.com; a fixed-hostname tunnel (token below) also goes here. When set, the QR link is built from it so a phone anywhere can pair; leave blank for LAN-only usage.",
			"settings.autoTunnel": "Auto public tunnel",
			"settings.autoTunnelHint": "When on, the plugin runs its own Cloudflare quick tunnel (no tool installation needed) and keeps the public address and trust config in sync automatically, so a phone anywhere can pair at any time; note the ephemeral hostname changes on every restart, so phones must scan again. The named-tunnel token below and the manual public address above are ignored while this is on.",
			"settings.tunnelToken": "Fixed-hostname tunnel token (Cloudflare Tunnel)",
			"settings.tunnelTokenHint": "Paste a Cloudflare named-tunnel token (the value of cloudflared tunnel run --token) and the plugin runs the tunnel itself: the public hostname stays fixed, so a phone pairs once and never again across restarts. First map the public hostname to http://127.0.0.1:<port> in the Cloudflare dashboard and enter the same hostname as the public address above. Lower precedence than the auto quick tunnel.",
			"settings.relay": "Stable-hostname relay (recommended)",
			"settings.relayHint": "When on, the auto tunnel additionally registers a never-changing public subdomain (<id>.dsh-market.com, relayed by the dsh-market edge to your ephemeral tunnel), so a phone pairs once and the QR and bookmark stay valid across restarts. Traffic transits the dsh-market edge (the same trust point as the ephemeral tunnel); turn off to fall back to the raw ephemeral address, which needs re-pairing after every restart. Applies to the auto public tunnel only.",
			"settings.lanBind": "LAN access (bind 0.0.0.0)",
			"settings.lanBindHint": "When on, the plugin writes a managed block into the profile patch defaulting the bind to 0.0.0.0 (an explicit --host flag still wins), and maintains the matching host firewall rule (Windows/Linux; other platforms need none). When off, the block pins 127.0.0.1. The bind change usually takes effect after dsh web restarts.",
			"lan.cardTitle": "LAN access",
			"lan.bind": "Bind: {host}:{port}",
			"lan.off": "Currently localhost-only.",
			"lan.urls": "LAN URLs: {urls}",
			"lan.firewall.ok": "firewall open",
			"lan.firewall.bad": "firewall blocked (needs admin)",
			"lan.firewall.unmanaged": "firewall not managed (no supported firewall detected)",
			"lan.untouched": "The toggle has never been used; the profile patch is only written once you flip it.",
			"lan.pendingRestart": "The bind change takes effect after dsh web restarts.",
			"settings.inherit": "Inherit",
			"settings.on": "On",
			"settings.off": "Off",
			"settings.overridden": "Overridden",
			"settings.reset": "Reset to default",
			"settings.notExposed": "This DSH version does not expose this plugin's settings namespace to the configuration page, so the form is unavailable. Edit $DSH_HOME/settings.yaml directly, or confirm that the plugin owning the namespace is mounted with its settings domain and restart.",
			"settings.readOnly": "This deployment stores settings read-only.",
			"settings.expand": "Show settings",
			"settings.collapse": "Hide settings",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.discard": "Discard",
			"settings.unsaved": "Unsaved",
			"settings.saveFailed": "The deployment did not accept these values; they were left for you to correct.",
			"settings.invalidNumber": "Enter a number, or leave blank to use the default."
		};
		//#endregion
		//#region src/client/deep-link.ts
		/** sessionStorage key for the failed-pair notice. */
		const PAIR_FAILED_MARKER = "dsh-remote-pair-failed";
		/** The browser implementation of {@link PageSurface}. */
		const browserPage = {
			get href() {
				return window.location.href;
			},
			replaceState(url) {
				window.history.replaceState(null, "", url);
			},
			navigate(url) {
				window.location.assign(url);
			},
			reload() {
				window.location.reload();
			}
		};
		/**
		* Run the pair boot flow for this page load.
		* @param ctx - client root context (unused since the deep-link retirement;
		* kept for call-site stability).
		* @param search - the current location.search.
		* @param page - the page surface (defaults to the browser).
		*/
		function runPairBootFlow(ctx, search, page = browserPage) {
			const params = readPairParams(search);
			if (params.pair !== void 0) runAccept(params.pair, page);
		}
		/** Accept the token, then reload into the paired official UI. */
		async function runAccept(token, page) {
			let ok = false;
			try {
				ok = (await acceptPair(token)).ok;
				if (!ok) sessionStorage.setItem(PAIR_FAILED_MARKER, "failed");
			} catch {
				sessionStorage.setItem(PAIR_FAILED_MARKER, "failed");
			}
			const url = new URL(page.href);
			url.searchParams.delete("pair");
			page.replaceState(`${url.pathname}${url.search}${url.hash}`);
			if (ok) page.reload();
		}
		/** Connection-plugin method prefix under the gated channel. */
		const REMOTE_API_PREFIX$1 = `/remote/api`;
		({ mux: `${REMOTE_API_PREFIX$1}/remote.mux` }).mux, `${REMOTE_API_PREFIX$1}`;
		/**
		* The cookieless device credential: the boot patch reads the device id from
		* the /pair-app URL, keeps it in sessionStorage, and attaches it to every
		* gated HTTP call as this header (and to WebSocket upgrades as the `device`
		* query parameter - WS handshakes cannot carry headers from the Web API).
		* The channel gate accepts it exactly like the device cookie, so the mobile
		* flow works even with browser cookies fully blocked; the cookie remains the
		* primary credential on normal browsers.
		*/
		const REMOTE_DEVICE_HEADER = "x-dsh-remote-device";
		const REMOTE_DEVICE_QUERY = "device";
		//#endregion
		//#region src/remote-channel-rules.ts
		/**
		* The remote-channel rewrite contract as pure data (issue #987): both the
		* browser patch (client/remote-channel.ts) and the parse-time boot patch
		* (remote-channel-boot.ts, inlined into index.html by the host) decide from
		* these tables, so the two can never drift apart.
		* @module @linxin666/dsh-remote-web-ui/remote-channel-rules
		*/
		/** The gated mirror prefix (must match src/remote-methods.ts). */
		const REMOTE_PREFIX = "/remote";
		/**
		* The schemes that can deliver a page a remote party controls: the network
		* transports, plus the documents a network page can mint. Every other scheme
		* is registered and served by an application on this machine, so its page is
		* the machine's own page whatever the application calls the scheme.
		*
		* The list is deliberately the *web* side rather than an allowlist of known
		* desktop shells. The official DSH Desktop shell serves its Web GUI from
		* `dsh-app://app/` (`location.hostname === 'app'`), which no hostname
		* predicate can recognise; a scheme allowlist fixed that instance (#1682) but
		* left the next shell — or a `file:` page — fenced behind a pairing page it
		* can never complete, because a pairing link is reachable only over the
		* network. Naming the web side instead makes an unknown application scheme
		* local by construction.
		*
		* `blob:`, `data:`, `about:` and `filesystem:` stay on the web side: a
		* network page mints those documents, so they must keep the fence.
		*/
		const WEB_PAGE_PROTOCOLS = [
			"http:",
			"https:",
			"blob:",
			"data:",
			"about:",
			"filesystem:"
		];
		/**
		* Whether one page scheme can carry a document a remote party controls.
		* @param protocol - `location.protocol` of the page (for example `https:`).
		* @returns true for the network transports and the documents they mint.
		*/
		function isWebPageProtocol(protocol) {
			return WEB_PAGE_PROTOCOLS.includes(protocol);
		}
		/**
		* Hostname-only loopback classification: localhost, the IPv6 loopback literal
		* (WHATWG keeps its brackets) and any 127/8 IPv4 literal. Kept string-in,
		* boolean-out and dependency-free so the browser half and the inlined boot
		* script can both run it verbatim.
		* @param hostname - a page/cookie hostname, IPv6 literals bracketed.
		* @returns true for a loopback name or literal.
		*/
		function isLoopbackHostname(hostname) {
			if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") return true;
			const parts = hostname.split(".");
			return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
		}
		/**
		* Whether the current page is served from the machine running the host, so
		* its same-origin traffic must NOT be fenced behind the pairing channel.
		* Three independent facts all describe the page itself and any one is enough:
		*
		* - the page's own hostname is loopback;
		* - the page's protocol is not a {@link WEB_PAGE_PROTOCOLS} web scheme, so an
		*   application on this machine delivered it — the desktop shell's
		*   `dsh-app://app/` is one such page, and a scheme this build has never
		*   heard of is another;
		* - the official connection transport already declared this shell the host
		*   owner (`__DSH_TRANSPORT__.ownsHost === true`) AND the page is not a
		*   network origin. The official client reads the same hook to derive
		*   `connection.isLoopback`, and the desktop shell sets it before any boot
		*   entry — without this term the plugin's predicate contradicts the host's
		*   own conclusion (#1682). The network-origin guard is deliberate: this
		*   plugin's own device-gated landing (a LAN or tunnel page) publishes the
		*   same hook to grant a paired remote the full UI, and that page must keep
		*   riding the gated channel — `ownsHost` buys the presentation, never an
		*   exemption from the pairing fence.
		*
		* The order matters: loopback is checked first so a loopback page keeps its
		* exemption even on a scheme no list carries, and the scheme test runs before
		* the hook test so a web page always reaches the network-origin guard. A
		* missing or empty scheme is not evidence of a local page - the fence stays
		* up - because a real document always reports its own scheme.
		*
		* @param hostname - `location.hostname` of the page.
		* @param protocol - `location.protocol` of the page (for example `https:`).
		* @param transportOwnsHost - `__DSH_TRANSPORT__?.ownsHost` as read by the caller.
		* @returns true when the page is local and needs no remote channel.
		*/
		function isLocalPage(hostname, protocol, transportOwnsHost) {
			if (isLoopbackHostname(hostname)) return true;
			if (protocol !== void 0 && protocol !== "" && !isWebPageProtocol(protocol)) return true;
			return transportOwnsHost === true && !isNetworkOrigin(hostname);
		}
		/**
		* Whether a hostname can only be reached across a network, so a page on it is
		* remote whatever transport hook it carries: any IPv4/IPv6 literal (a dot or a
		* colon) or any dotted DNS name. A hostname with no dot and no colon is a
		* scheme-local authority (the desktop shell's `app`), which is why this test,
		* not a loopback test, is what the `ownsHost` term is gated on.
		* @param hostname - the page hostname.
		* @returns true when the page cannot be the machine's own local page.
		*/
		function isNetworkOrigin(hostname) {
			return hostname.includes(".") || hostname.includes(":");
		}
		/** The live rule set. */
		const REMOTE_CHANNEL_RULES = {
			remotePrefix: REMOTE_PREFIX,
			apiPrefix: "/api/",
			pairPrefix: "/api/pair/",
			updatePrefix: "/api/update/",
			settingsBridgePrefix: "/api/dsh-web-ui-settings",
			sidebarPrefix: "/sidebar/",
			gitPrefix: "/git/",
			petPrefix: "/pet/",
			wsPaths: [
				"/api/remote.mux",
				"/sidebar/ws/terminal",
				"/sidebar/ws/agent-terminals",
				"/sidebar/ws/agent-opens",
				"/api/dsh-ssh/terminal"
			],
			deviceHeader: REMOTE_DEVICE_HEADER,
			deviceKey: "dsh-remote-device",
			deviceQuery: REMOTE_DEVICE_QUERY,
			uploadPath: "/api/session/uploadFileBinary",
			uploadHookGlobal: "__DSH_FILE_UPLOAD__",
			webProtocols: WEB_PAGE_PROTOCOLS,
			hostGrantGlobal: "__DSH_REMOTE_HOST_GRANT__"
		};
		/** The window global the boot patch publishes its seat under. */
		const REMOTE_CHANNEL_BOOT_GLOBAL = "__DSH_REMOTE_CHANNEL_BOOT__";
		//#endregion
		//#region src/client/remote-channel.ts
		/**
		* The remote desktop channel — browser half. On a non-loopback origin (LAN
		* address or public tunnel) fenced host routes refuse the request, and
		* pairing is the real access control — so same-origin traffic the desktop
		* issues is rewritten onto this plugin's gated `/remote` prefix (host half
		* in src/remote-api.ts). The host then re-issues the call to 127.0.0.1 so
		* plugin loopback fences pass.
		*
		* The rewrite is deliberately narrow:
		* - loopback origins are untouched (the desktop at 127.0.0.1 keeps original paths);
		* - the pairing routes (`/api/pair/*`) stay where they are — accept must
		*   work BEFORE a device is paired;
		* - the update endpoints (`/api/update/*`) stay loopback-only;
		* - the family settings bridge (`/api/dsh-web-ui-settings/*`) stays
		*   loopback-only (same plane as SDK settings.*);
		* - `/api/*` (SDK methods and `/api/<plugin>/...` plugin namespaces),
		*   `/sidebar/*`, `/git/*`, and `/pet/*` ride the channel;
		* - fetch, EventSource, WebSocket, and img/script/iframe `src` are patched;
		*   everything else calls the original unchanged.
		*
		* Pure helpers are exported for unit tests; `installRemoteChannel` patches
		* the given window and returns their restore.
		*/
		const RULES = REMOTE_CHANNEL_RULES;
		/**
		* Read the page-origin facts from a window-like object: the hostname and
		* protocol of the page itself plus the official transport's host-owner flag
		* (`__DSH_TRANSPORT__.ownsHost`, set by the desktop shell before any boot
		* entry, and by this plugin's own paired landing).
		* @param win - the window to read (defaults to the real one).
		* @returns the facts `isLocalPage`/`remoteChannelRequired` decide from.
		*/
		function pageOriginFacts(win = window) {
			const transport = win.__DSH_TRANSPORT__;
			return {
				hostname: win.location.hostname,
				protocol: win.location.protocol,
				...transport?.ownsHost === true ? { transportOwnsHost: true } : {}
			};
		}
		/** Decide whether a remote desktop channel is required from local or host policy. */
		function remoteChannelRequired(origin, snapshot, hostPairingPolicy) {
			if (isLocalPage(origin.hostname, origin.protocol, origin.transportOwnsHost)) return false;
			if (snapshot.status === "ready") return (snapshot.value?.enabled ?? true) && (snapshot.value?.requirePairingForLan ?? true);
			return hostPairingPolicy !== false;
		}
		/**
		* Whether one same-origin path must ride the gated channel (fetch, EventSource,
		* img/script/iframe src).
		* @param pathname - the request URL pathname.
		*/
		function shouldRewriteFetchPath(pathname) {
			if (pathname.startsWith(RULES.pairPrefix)) return false;
			if (pathname.startsWith(RULES.updatePrefix)) return false;
			if (pathname === RULES.settingsBridgePrefix || pathname.startsWith(`${RULES.settingsBridgePrefix}/`)) return false;
			if (pathname.startsWith(RULES.apiPrefix)) return true;
			if (pathname.startsWith(RULES.sidebarPrefix) || pathname === "/sidebar") return true;
			if (pathname.startsWith(RULES.gitPrefix) || pathname === "/git") return true;
			if (pathname.startsWith(RULES.petPrefix) || pathname === "/pet") return true;
			return false;
		}
		/**
		* Whether one WebSocket path must ride the gated channel.
		* @param pathname - the WebSocket URL pathname.
		*/
		function shouldRewriteWsPath(pathname) {
			return RULES.wsPaths.includes(pathname);
		}
		/** The gated twin of one fenced path (`/remote` + original pathname). */
		function rewritePath(pathname) {
			return `${REMOTE_PREFIX}${pathname}`;
		}
		/**
		* Rewrite one raw URL string when it is same-origin and fenced. Relative
		* inputs stay relative so resource loaders do not unexpectedly absolutize.
		*/
		function rewriteRawUrl(raw, baseHref, origin) {
			let url;
			try {
				url = new URL(raw, baseHref);
			} catch {
				return raw;
			}
			if (url.origin !== origin) return raw;
			if (!shouldRewriteFetchPath(url.pathname)) return raw;
			url.pathname = rewritePath(url.pathname);
			if (raw.startsWith("/") && !raw.startsWith("//")) return `${url.pathname}${url.search}${url.hash}`;
			return url.href;
		}
		/** Read an unpaired code from either the SDK envelope or a plugin JSON body. */
		function unpairedCodeOf(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const record = value;
			const nested = record.result;
			if (typeof nested === "object" && nested !== null) {
				const error = nested.error;
				if (typeof error === "object" && error !== null && typeof error.code === "string") return error.code;
			}
			const error = record.error;
			if (typeof error === "object" && error !== null && typeof error.code === "string") return error.code;
		}
		/**
		* Whether a gated 403 is the unpaired-device fence (not a loopback-only
		* method denial, which uses the same status with code `forbidden`).
		*/
		async function isUnpairedDenied(response) {
			if (response.status !== 403) return false;
			try {
				return unpairedCodeOf(await response.json()) === "unpaired";
			} catch {
				return false;
			}
		}
		/**
		* Wrap a prototype `src` setter so fenced same-origin URLs ride `/remote`.
		* No-ops when the constructor is missing or `src` is not configurable.
		*/
		function patchSrcAccessor(ctor, rewrite) {
			if (ctor === void 0) return () => {};
			const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, "src");
			if (descriptor === void 0 || descriptor.configurable === false) return () => {};
			if (descriptor.set === void 0) return () => {};
			const originalSet = descriptor.set;
			const originalGet = descriptor.get;
			Object.defineProperty(ctor.prototype, "src", {
				configurable: true,
				enumerable: descriptor.enumerable ?? true,
				get: originalGet,
				set(value) {
					originalSet.call(this, rewrite(String(value)));
				}
			});
			return () => {
				Object.defineProperty(ctor.prototype, "src", descriptor);
			};
		}
		/**
		* Patch `fetch`, `EventSource`, `WebSocket`, and resource `src` accessors on
		* one window to route fenced traffic through the gated channel.
		* @param window - the browser window (or a test double).
		* @param options - the unpaired callback.
		* @returns a function restoring the originals.
		*/
		function installRemoteChannel(window, options = {}) {
			const originalFetch = window.fetch;
			const OriginalWebSocket = window.WebSocket;
			const OriginalEventSource = window.EventSource;
			const restoreUploadHook = installFileUploadHook(window);
			const sameOrigin = (url) => url.origin === window.location.origin;
			const rewrite = (raw) => rewriteRawUrl(raw, window.location.href, window.location.origin);
			const device = (() => {
				try {
					return window.sessionStorage?.getItem(RULES.deviceKey) ?? null;
				} catch {
					return null;
				}
			})();
			const attach = (init) => {
				if (device === null) return init;
				const headers = init?.headers;
				if (typeof Headers !== "undefined" && headers instanceof Headers) try {
					const copy = new Headers(headers);
					copy.set(RULES.deviceHeader, device);
					return {
						...init,
						headers: copy
					};
				} catch {
					return init;
				}
				if (typeof headers === "object" && headers !== null) return {
					...init,
					headers: {
						...headers,
						[RULES.deviceHeader]: device
					}
				};
				return init;
			};
			const withDeviceQuery = (url) => {
				if (device !== null) url.searchParams.set(RULES.deviceQuery, device);
				return url;
			};
			const patchedFetch = (input, init) => {
				const url = new URL(typeof input === "string" || input instanceof URL ? input.toString() : input.url, window.location.href);
				if (sameOrigin(url) && shouldRewriteFetchPath(url.pathname)) {
					const rewritten = new URL(url);
					rewritten.pathname = rewritePath(url.pathname);
					const next = typeof input === "string" || input instanceof URL ? rewritten.toString() : new Request(rewritten, input);
					return Promise.resolve(originalFetch.call(window, next, attach(init))).then(async (response) => {
						if (response.status === 403 && await isUnpairedDenied(response.clone())) options.onUnpaired?.();
						else options.onPaired?.();
						return response;
					});
				}
				return originalFetch.call(window, input, init);
			};
			class PatchedWebSocket extends OriginalWebSocket {
				constructor(url, protocols) {
					const parsed = new URL(url.toString(), window.location.href);
					const wsOrigin = parsed.protocol === "wss:" ? `https://${parsed.host}` : parsed.protocol === "ws:" ? `http://${parsed.host}` : "";
					if (wsOrigin !== "" && wsOrigin === window.location.origin && shouldRewriteWsPath(parsed.pathname)) {
						const rewritten = new URL(parsed);
						rewritten.pathname = rewritePath(parsed.pathname);
						super(withDeviceQuery(rewritten), protocols);
						return;
					}
					super(url, protocols);
				}
			}
			const restoreSrc = [
				patchSrcAccessor(window.HTMLImageElement, rewrite),
				patchSrcAccessor(window.HTMLScriptElement, rewrite),
				patchSrcAccessor(window.HTMLIFrameElement, rewrite)
			];
			window.fetch = patchedFetch;
			window.WebSocket = PatchedWebSocket;
			if (OriginalEventSource !== void 0) {
				class PatchedEventSource extends OriginalEventSource {
					constructor(url, eventSourceInitDict) {
						const parsed = new URL(url.toString(), window.location.href);
						if (sameOrigin(parsed) && shouldRewriteFetchPath(parsed.pathname)) {
							const rewritten = new URL(parsed);
							rewritten.pathname = rewritePath(parsed.pathname);
							super(withDeviceQuery(rewritten), eventSourceInitDict);
							return;
						}
						super(url, eventSourceInitDict);
					}
				}
				window.EventSource = PatchedEventSource;
			}
			return () => {
				window.fetch = originalFetch;
				window.WebSocket = OriginalWebSocket;
				if (OriginalEventSource !== void 0) window.EventSource = OriginalEventSource;
				for (const restore of restoreSrc) restore();
				restoreUploadHook();
			};
		}
		/**
		* Publish the official pre-Cordis upload hook so background uploads keep
		* riding the patched main-thread fetch (issue #1580).
		*
		* `@deepseek-ai/dsh-client-file-upload` reads `globalThis.__DSH_FILE_UPLOAD__`
		* once when its runtime is constructed; without it the carrier is a Web
		* Worker, whose own globals no main-thread patch reaches. That worker's XHR
		* goes straight to `<origin>/api/session/uploadFileBinary` with neither the
		* `/remote` rewrite nor the cookieless device credential, so the harness
		* browser-auth fence answers 401 and every upload from a paired browser
		* fails. Rewriting the worker URL cannot fix it: a worker context carries
		* neither the pairing cookie nor the device header.
		*
		* The hook hands the runtime the same transport the rest of the page uses -
		* the boot script publishes an identical one (remote-channel-boot.ts), and
		* this is the fallback for pages served without it.
		*
		* @param window - the browser window (or a test double), BEFORE the channel patch.
		* @returns a function retiring the hook (a pre-existing one is left alone).
		*/
		function installFileUploadHook(window) {
			if (window.__DSH_FILE_UPLOAD__ !== void 0) return () => {};
			const originalFetch = window.fetch;
			const hook = { fetch: (input, init) => {
				const raw = typeof input === "string" ? input : input.href;
				let url;
				try {
					url = new URL(raw, window.location.href);
				} catch {
					return originalFetch.call(window, input, init);
				}
				if (url.origin === window.location.origin && url.pathname === RULES.uploadPath) return window.fetch.call(window, raw, init);
				return originalFetch.call(window, input, init);
			} };
			window.__DSH_FILE_UPLOAD__ = hook;
			return () => {
				if (window.__DSH_FILE_UPLOAD__ === hook) delete window.__DSH_FILE_UPLOAD__;
			};
		}
		/**
		* Decide what the channel lifecycle must do next.
		* @param active - whether the gated remote channel should be running now.
		* @param installed - whether it currently is (disposer !== undefined).
		* @returns the transition to apply.
		*/
		function channelTransition(active, installed) {
			if (active && !installed) return "install";
			if (!active && installed) return "retire";
			return "none";
		}
		//#endregion
		//#region src/client/FenceNotice.tsx
		/**
		* Unpaired-desktop notice: a full-page blocking surface rendered when the remote channel
		* (see remote-channel.ts) refuses a call because this desktop browser has no
		* live paired-device cookie. Retires automatically once a gated call
		* succeeds (the channel reports pairing) or when the channel itself is
		* torn down (requirePairingForLan off / plugin disabled), so it never
		* outlives the unpaired state it describes.
		*/
		/**
		* Extract a pairing token from either a raw token string or a copied pairing link URL.
		*/
		function extractPairToken(input) {
			const trimmed = input.trim();
			if (trimmed === "") return void 0;
			try {
				const token = new URL(trimmed).searchParams.get("pair");
				if (token !== null && token !== "") return token;
			} catch {}
			return trimmed;
		}
		/**
		* Render the unpaired blocking page.
		* @param props - localized copy.
		* @returns the notice element.
		*/
		function FenceNotice({ t, onRetry, onAccept = acceptPair }) {
			const [tokenInput, setTokenInput] = (0, react.useState)("");
			const [submitting, setSubmitting] = (0, react.useState)(false);
			const [errorMsg, setErrorMsg] = (0, react.useState)(void 0);
			const handleSubmit = async (event) => {
				event.preventDefault();
				const token = extractPairToken(tokenInput);
				if (!token) return;
				setSubmitting(true);
				setErrorMsg(void 0);
				try {
					const result = await onAccept(token);
					if (result.ok) {
						onRetry();
						return;
					}
					if (result.code === "invalid") setErrorMsg(t("fence.unpaired.tokenInvalid"));
					else setErrorMsg(t("fence.unpaired.tokenFailed"));
				} catch {
					setErrorMsg(t("fence.unpaired.tokenFailed"));
				} finally {
					setSubmitting(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: remote_module_css_default.fencePage,
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "remote-fence-title",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
					className: remote_module_css_default.fenceCard,
					"data-dsh-plugin": "remote-web-ui",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: remote_module_css_default.fenceMark,
							"aria-hidden": "true",
							children: "×"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.fenceEyebrow,
							children: t("fence.unpaired.eyebrow")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
							id: "remote-fence-title",
							className: remote_module_css_default.fenceTitle,
							children: t("fence.unpaired.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.fenceDetail,
							children: t("fence.unpaired.hint")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ol", {
							className: remote_module_css_default.fenceSteps,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("fence.unpaired.stepDesktop") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("fence.unpaired.stepLink") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("fence.unpaired.stepOpen") })
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
							className: remote_module_css_default.fenceForm,
							onSubmit: handleSubmit,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: remote_module_css_default.fenceInputRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "text",
									className: remote_module_css_default.fenceInput,
									placeholder: t("fence.unpaired.tokenPlaceholder"),
									value: tokenInput,
									onChange: (event) => {
										setTokenInput(event.target.value);
										if (errorMsg !== void 0) setErrorMsg(void 0);
									},
									disabled: submitting,
									"aria-label": t("fence.unpaired.tokenPlaceholder")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: remote_module_css_default.fencePairButton,
									type: "submit",
									disabled: submitting || tokenInput.trim() === "",
									children: submitting ? t("fence.unpaired.pairing") : t("fence.unpaired.pairAction")
								})]
							}), errorMsg !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: remote_module_css_default.fenceError,
								role: "alert",
								children: errorMsg
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: remote_module_css_default.fenceRetry,
							type: "button",
							onClick: onRetry,
							children: t("fence.unpaired.retry")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: remote_module_css_default.fenceFootnote,
							children: t("fence.unpaired.footnote")
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/telemetry.ts
		const VISITOR_KEY = "dsh-web-ui-telemetry-visitor";
		const DAY_KEY_PREFIX = "dsh-web-ui-telemetry-day:";
		const ENDPOINT = "https://dsh-market.com/api/telemetry/event";
		/** The building package's version, when the bundle carries it. */
		function bakedVersion() {
			try {
				return "0.4.4";
			} catch {
				return;
			}
		}
		/** Read or lazily create the anonymous visitor id; null when storage is unavailable. */
		function visitorId() {
			try {
				const existing = localStorage.getItem(VISITOR_KEY);
				if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
				const fresh = crypto.randomUUID().replaceAll("-", "");
				localStorage.setItem(VISITOR_KEY, fresh);
				return fresh;
			} catch {
				return null;
			}
		}
		/** Drop stale per-day dedup keys so localStorage does not grow forever. */
		function pruneDayKeys(today) {
			try {
				for (let index = localStorage.length - 1; index >= 0; index -= 1) {
					const key = localStorage.key(index);
					if (key !== null && key.startsWith(DAY_KEY_PREFIX) && key !== DAY_KEY_PREFIX + today) localStorage.removeItem(key);
				}
			} catch {}
		}
		/**
		* Fire the daily heartbeat for the given items at most once per UTC day per
		* browser. Never throws and never blocks the caller. Items without an explicit
		* version inherit the bundle's baked build version.
		*/
		function reportDailyHeartbeat(items) {
			try {
				if (items.length === 0) return;
				const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (navigator.webdriver) return;
				if (localStorage.getItem(DAY_KEY_PREFIX + today) !== null) return;
				const visitor = visitorId();
				if (visitor === null) return;
				pruneDayKeys(today);
				const payloadItems = items.map((item) => {
					const out = { name: item.name };
					const version = item.version ?? bakedVersion();
					if (version !== void 0) out.version = version;
					if (item.channel !== void 0) out.channel = item.channel;
					return out;
				});
				const body = JSON.stringify({
					kind: "heartbeat",
					visitor,
					items: payloadItems
				});
				fetch(ENDPOINT, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body,
					keepalive: true
				}).then((response) => {
					if (response.ok) localStorage.setItem(DAY_KEY_PREFIX + today, "1");
				}).catch(() => {});
			} catch {}
		}
		//#endregion
		//#region src/client/mobile-adapt.ts
		/** Storage key for the manual desktop opt-out. */
		const FORCE_DESKTOP_KEY = "dsh-remote-force-desktop";
		/** Storage key for the dragged whale position. */
		const WHALE_POS_KEY = "dsh-remote-whale-pos";
		/** Injected stylesheet identity. */
		const ADAPT_CSS_ID = "dsh-remote-web-ui/mobile-adapt.css";
		/** Body class while the adaptation is active. */
		const ACTIVE_CLASS = "dsh-remote-portrait";
		/** Body class while the collapsed rail is hidden behind the whale. */
		const RAIL_HIDDEN_CLASS = "dsh-remote-rail-hidden";
		/**
		* The official sidebar column root. Also the scope of the row sweep: every row
		* the drag suppression covers is a descendant of it, so the document-wide scan
		* it replaces only ever returned these.
		*/
		const SIDEBAR_SELECTOR = "[class*=\"_sidebarCol\"]";
		/** The official draggable session/project rows (see disableRowDrag). */
		const ROW_SELECTOR = "[class*=\"_sessionRow\"], [class*=\"_projectRow\"]";
		/** The injected stylesheet, addressed through the same cached lookup. */
		const STYLE_SELECTOR = `style[data-plugin-css="${ADAPT_CSS_ID}"]`;
		/** Whale button id. */
		const WHALE_ID = "dshRemoteWhale";
		/** Compact picker: synthesized model button id. */
		const MODEL_BTN_ID = "dshRemoteModelPick";
		/** Compact picker: synthesized effort button id. */
		const EFFORT_BTN_ID = "dshRemoteEffortPick";
		/** Body class while the compact picker buttons are wired. */
		const COMPACT_CLASS = "dsh-remote-compact-picker";
		/** Body class while the header actions are seated in the tabs row. */
		const HEADER_SEATED_CLASS = "dsh-remote-header-seated";
		/**
		* Width the seated header actions paint over the tabs row, as a CSS variable
		* on <html>. The row caps its own width with it (see the v80 rules) instead of
		* reserving the space with padding.
		*/
		const HEADER_RESERVE_VAR = "--dsh-remote-header-actions-reserve";
		/** Locale-dependent fast path for the official picker cells (zh/en). */
		const PICKER_CELL_PATTERN = {
			model: /模型|Model/,
			effort: /推理等级|Reasoning|Effort/i
		};
		/** Position of each drill cell among the sheet's chevron cells. */
		const DRILL_INDEX = {
			model: 0,
			effort: 1
		};
		/**
		* The official application frame. The layout column classes are the anchor:
		* `_frame` is shared by unrelated official components (the chat turn rail,
		* message-image thumbnails, the subagent pill, PlanReviewPanel), so a bare
		* suffix match would restyle and hit-block those. `data-dsh-frame` is the
		* aggregate compat stamp, kept as the fast path.
		*/
		const APP_FRAME_SELECTOR = "[data-dsh-frame], [class*=\"_frame\"]:has([class*=\"_centerCol\"])";
		/**
		* The official composer surface. `_composerSeat` is the plugin's historical
		* anchor; the official `data-dsh-surface="composer"` part attribute is the
		* stable alternative if the class ever gains a modifier.
		*/
		const COMPOSER_SELECTOR = "[class$=\"_composerSeat\"], [data-dsh-surface=\"composer\"]";
		/** Resolve the official application frame (never a nested `_frame` surface). */
		function appFrame() {
			const frame = document.querySelector(APP_FRAME_SELECTOR);
			return frame instanceof HTMLElement ? frame : null;
		}
		/**
		* Whether the current viewport is a portrait touch device small enough to
		* need the adaptation.
		*/
		function isMobilePortrait() {
			if (typeof window === "undefined") return false;
			if (typeof window.matchMedia !== "function") return false;
			if (!window.matchMedia("(orientation: portrait)").matches) return false;
			if (!window.matchMedia("(pointer: coarse)").matches) return false;
			if (window.innerWidth >= 1100) return false;
			if (window.sessionStorage.getItem(FORCE_DESKTOP_KEY) === "1") return false;
			return true;
		}
		/**
		* The injected rules. Grouped by surface; version comments trace rules back
		* to the dsh-LAN reference they were ported from.
		*/
		const ADAPT_CSS = [
			"html,body{height:100%}",
			"[class*=\"_frame\"]:has([class*=\"_centerCol\"]){width:100%;height:100dvh}",
			"[class$=\"_railFish\"] button,[class$=\"_panelIcon\"],[class$=\"_newSession\"]{min-width:44px;min-height:44px}",
			"[class$=\"_scroll\"]{padding:8px 10px}",
			"[class$=\"_input\"],textarea,input{font-size:16px}",
			"[class$=\"_composer\"]{padding-bottom:calc(4px + env(safe-area-inset-bottom))}",
			"[class$=\"_scrollBody\"] [class$=\"_root\"]{font-size:14.5px}",
			"[class$=\"_scrollBody\"] [class$=\"_bubble\"]{font-size:14.5px}",
			"[class$=\"_titleRow\"] *{font-size:13px}",
			"[class*=\"_sidebarCol\"] [class$=\"_root\"],[class*=\"_sidebarCol\"] [class$=\"_newSession\"],[class*=\"_sidebarCol\"] [class$=\"_trigger\"],[class*=\"_sidebarCol\"] [class$=\"_title\"]{font-size:13px}",
			"[class*=\"_sidebarCol\"] [class$=\"_meta\"],[class*=\"_sidebarCol\"] [class$=\"_time\"]{font-size:11.5px}",
			"[class$=\"_frame\"][data-sidebar-collapsed]{grid-template-columns:0 minmax(0,1fr) 0 !important}",
			"[class$=\"_frame\"][data-sidebar-collapsed] [class*=\"_sidebarCol\"]{grid-column:1/2}",
			"[class$=\"_frame\"][data-sidebar-collapsed] [class$=\"_centerCol\"]{grid-column:2/3}",
			"[class$=\"_frame\"][data-sidebar-collapsed] [class$=\"_detailsCol\"]{grid-column:3/4}",
			`body.${RAIL_HIDDEN_CLASS} [class$="_titleRow"]{padding-left:52px}`,
			`#${WHALE_ID}{position:fixed;top:calc(4px + env(safe-area-inset-top));left:calc(8px + env(safe-area-inset-left));z-index:2147482999;width:34px;height:34px;min-width:34px;padding:0;border-radius:10px;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,.25)}`,
			`#${WHALE_ID} svg{width:20px;height:15px;display:block}`,
			`#${WHALE_ID}:active{opacity:.72}`,
			`#${WHALE_ID}{touch-action:none}`,
			"[class*=\"_sidebarCol\"] [class$=\"_logoRow\"] [class*=\"_iconButton\"]{width:18px;height:18px}",
			"[class*=\"_sidebarCol\"] [class$=\"_logoRow\"] [class*=\"_iconButton\"] svg{width:13px;height:13px;min-width:0;min-height:0}",
			"[class*=\"_sidebarCol\"] [class*=\"_projectRow\"] [class*=\"_rowActions\"]{display:inline-flex}",
			"[class*=\"_sidebarCol\"] [class*=\"_sessionRow\"],[class*=\"_sidebarCol\"] [class*=\"_projectRow\"]{-webkit-user-drag:none;user-select:none}",
			"[class$=\"_headerUtilities\"]{display:none}",
			"[class$=\"_composerSeat\"] [class$=\"_card\"]{margin-bottom:1px}",
			"[class$=\"_composerSeat\"] [class$=\"_row\"]{flex-wrap:wrap;row-gap:0;padding:2px 8px 1px;position:relative}",
			"[class$=\"_composerSeat\"] [class$=\"_add\"]{position:absolute;left:8px;top:50%;transform:translateY(-50%)}",
			"[class$=\"_composerSeat\"] [class$=\"_modes\"]{min-width:0;padding-left:38px}",
			"[class$=\"_composerSeat\"] [class$=\"_trailing\"]{flex-basis:100%;position:relative;min-height:32px;justify-content:flex-start;padding-left:38px;padding-right:78px}",
			"[class$=\"_composerSeat\"] [class$=\"_trailing\"] *{font-size:12px}",
			"[class$=\"_composerSeat\"] [class$=\"_modes\"] [class$=\"_trigger\"]{height:24px;min-height:24px;font-size:12px}",
			"[class$=\"_composerSeat\"] [class$=\"_trailing\"] [class$=\"_trigger\"]{height:24px;min-height:24px;font-size:11px}",
			"[class$=\"_composerSeat\"] [class$=\"_trailing\"] > [class$=\"_root\"]:has([class$=\"_track\"]){position:absolute;right:52px;top:50%;transform:translateY(-50%)}",
			"[class$=\"_composerSeat\"] [class$=\"_primary\"]{position:absolute;right:8px;top:50%;transform:translateY(-50%)}",
			"[class$=\"_composerSeat\"]{transform:none !important}",
			"[class$=\"_composerSeat\"] [class$=\"_menu\"]{position:fixed !important;left:8px !important;right:8px !important;top:auto !important;bottom:calc(8px + env(safe-area-inset-bottom)) !important;width:auto !important;max-width:none !important;max-height:70dvh !important;overflow-y:auto !important;z-index:2147482000}",
			"[class$=\"_composerSeat\"] [class$=\"_menu\"] [class$=\"_cell\"]{height:44px;min-height:44px;font-size:13px}",
			`body.${COMPACT_CLASS} [class$="_composerSeat"] [class$="_trailing"] [class$="_trigger"]:has([class$="_triggerEffort"]){display:none}`,
			`body.${COMPACT_CLASS} [class$="_composerSeat"] [class$="_trailing"]{flex-basis:auto;position:static;min-height:0;padding:0;width:0}`,
			`body.${COMPACT_CLASS} [class$="_composerSeat"] [class$="_trailing"] > [class$="_root"]:has([class$="_track"]){right:44px}`,
			`#${MODEL_BTN_ID},#${EFFORT_BTN_ID}{width:26px;height:32px;min-width:26px;padding:0;border-radius:9px;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;margin-left:4px}`,
			`#${MODEL_BTN_ID} svg,#${EFFORT_BTN_ID} svg{width:16px;height:16px;display:block}`,
			`#${MODEL_BTN_ID}:active,#${EFFORT_BTN_ID}:active{opacity:.7}`,
			"[class$=\"_composerSeat\"] [data-slot=\"conversation.composer.dock\"] [class$=\"_root\"]{font-size:10px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-align:left;line-height:13px;letter-spacing:-0.2px;padding-left:0;padding-right:0}",
			"[class$=\"_scrollBody\"] [class$=\"_root\"]{font-size:13px}",
			"[class*=\"_bubble\"][role=\"tooltip\"]{display:none}",
			"[class$=\"_composerSeat\"] [class$=\"_frame\"]{box-sizing:border-box;width:100%;max-width:100%;padding-left:12px;padding-right:12px;height:auto;max-height:calc(100dvh - 96px);align-items:flex-start;overflow-y:auto}",
			"[class$=\"_composerSeat\"] [class$=\"_frame\"] [class$=\"_card\"]{max-width:none;width:100%}",
			`body.${HEADER_SEATED_CLASS} [class$="_header"] [class$="_titleCluster"] [class$="_headerActions"]{position:absolute;left:0;top:0;margin:0;display:flex;align-items:center;gap:6px;flex:none;z-index:2}`,
			"[class$=\"_header\"] [class$=\"_tabs\"] [class*=\"_tab\"]{font-size:12px;white-space:nowrap}",
			`body.${HEADER_SEATED_CLASS} [class$="_header"] [class$="_tabs"]{max-width:max(0px,calc(100% - var(${HEADER_RESERVE_VAR},0px)));overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;margin-bottom:-2px}`,
			`body.${HEADER_SEATED_CLASS} [class$="_header"] [class$="_tabs"]::-webkit-scrollbar{display:none}`,
			`body.${HEADER_SEATED_CLASS} [class$="_header"] [class$="_tabs"] > [class*="_tab"]{flex:0 0 auto}`,
			`body.${ACTIVE_CLASS} [class$=\"_detailsCol\"]{display:none !important}`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"ssh\"],`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"skill-explorer\"],`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"task-board\"],`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"git-graph\"],`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"pet\"],`,
			`body.${ACTIVE_CLASS} [data-dsh-plugin=\"usage\"]{display:none !important}`,
			`body.${ACTIVE_CLASS} [class$=\"_overlayLayer\"] [class$=\"_workbench\"]{display:none !important}`,
			"[class$=\"_overlay\"] [class$=\"_panel\"]{flex-direction:column;max-height:calc(100dvh - 32px)}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_nav\"]{flex-direction:row;gap:4px;width:100%;padding:12px 12px 0;overflow-x:auto;overflow-y:hidden}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_navTitle\"]{display:none}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_navList\"]{flex-direction:row;gap:4px}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_navCell\"]{height:34px;padding:0 12px;gap:6px;flex:none;border-radius:10px}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_navLabel\"]{font-size:13px}",
			"[class$=\"_overlay\"] [class$=\"_panel\"] [class$=\"_content\"]{flex:1;min-height:0}"
		];
		/** Cube glyph for the compact model button (a plain box outline). */
		const CUBE_ICON = "<path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/>";
		/** Level glyph for the compact effort button (three rising bars). */
		const LEVELS_ICON = "<path d=\"M4 6h16\"/><path d=\"M7 12h10\"/><path d=\"M10 18h4\"/>";
		/** The DeepSeek fish glyph (the official brand mark path). */
		const FISH_PATH = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018Z";
		/**
		* Install the adaptation layer. Runs once per page (idempotent); the
		* evaluate loop re-applies on orientation/resize and reverts off-portrait.
		*/
		function startMobileAdapt() {
			if (typeof window === "undefined" || typeof document === "undefined") return;
			if (window.__dshRemoteAdaptInstalled === true) return;
			window.__dshRemoteAdaptInstalled = true;
			const w = window;
			/**
			* Label lookup for the injected surfaces: the `remote` namespace seat wired
			* by the plugin apply, else the English fallback (the SDK's universal
			* fallback; the sync tick re-renders the labels once the seat is live).
			*/
			const surfaceText = (key, fallback) => {
				try {
					const out = w.__dshRemoteAdapt?.translate?.(key);
					return typeof out === "string" && out.length > 0 ? out : fallback;
				} catch {
					return fallback;
				}
			};
			let active = false;
			let savedViewportContent = null;
			let whaleEl = null;
			let whaleObserver = null;
			/** Header subtree observer: marks the geometry measurement dirty on re-render. */
			let headerObserver = null;
			/** Document child-list observer: invalidates the cached-absent selector set. */
			let domObserver = null;
			let observedHeader = null;
			/** Whether the seated-actions geometry needs re-measuring (see alignActionsText). */
			let headerGeometryDirty = true;
			let whaleTimer = null;
			let whaleSuppressClick = false;
			let whaleShown = false;
			let drag = null;
			let swipeTouch = null;
			let lastComposerTap = 0;
			let adaptEnabled = true;
			/**
			* Idempotently (re-)install the adaptation stylesheet. The rules live in
			* one <style> tag keyed by data-plugin-css; the sync tick re-runs this so
			* a tag lost to any external DOM cleanup is restored within one tick
			* instead of silently dropping the suppressions (portrait pet hiding,
			* rail compaction) while the body class stays.
			*/
			function ensureAdaptStyle() {
				if (nodeOf(STYLE_SELECTOR) !== null) return;
				const tag = document.createElement("style");
				tag.dataset.plugin = "remote-web-ui";
				tag.dataset.pluginCss = ADAPT_CSS_ID;
				tag.textContent = ADAPT_CSS.join("");
				document.head.appendChild(tag);
				nodeCache.set(STYLE_SELECTOR, tag);
				nodeMissCache.delete(STYLE_SELECTOR);
			}
			function apply() {
				if (active) return;
				active = true;
				forgetAbsentSelectors();
				document.body.classList.add(ACTIVE_CLASS);
				try {
					w.__dshRemoteAdapt?.closeDetails?.();
				} catch {}
				ensureAdaptStyle();
				const meta = document.querySelector("meta[name=viewport]");
				if (meta instanceof HTMLMetaElement && meta.getAttribute("content") !== null && !(meta.getAttribute("content") ?? "").includes("viewport-fit")) {
					savedViewportContent = meta.getAttribute("content");
					meta.setAttribute("content", `${savedViewportContent}, viewport-fit=cover`);
				}
				ensureWhale();
				ensureDomObserver();
				syncWhale();
				setWhaleTimer(true);
				seatHeaderActions();
			}
			function revert() {
				if (!active) return;
				active = false;
				unseatHeaderActions();
				restoreRowDrag();
				removeCompactPicker();
				document.body.classList.remove(ACTIVE_CLASS);
				document.body.classList.remove(RAIL_HIDDEN_CLASS);
				document.querySelector(`style[data-plugin-css="${ADAPT_CSS_ID}"]`)?.remove();
				const meta = document.querySelector("meta[name=viewport]");
				if (meta instanceof HTMLMetaElement && savedViewportContent !== null) {
					meta.setAttribute("content", savedViewportContent);
					savedViewportContent = null;
				}
				if (whaleEl !== null) whaleEl.style.display = "none";
				whaleShown = false;
				setWhaleTimer(false);
				if (whaleObserver !== null) {
					whaleObserver.disconnect();
					whaleObserver = null;
				}
				if (domObserver !== null) {
					domObserver.disconnect();
					domObserver = null;
				}
				forgetAbsentSelectors();
			}
			/**
			* Observe the document for the two kinds of change that can make a cached-absent
			* target discoverable again (see nodeOf): node insertion/removal, and the
			* class / compat-stamp attributes the cached selectors match on.
			*
			* Body class writes are excluded by target: the layer toggles three body
			* classes every tick, and counting those would invalidate the negative cache
			* on every tick and restore the very scan this cache removes. They cannot
			* create a target either — every cached selector matches an element other
			* than <body>.
			*
			* The record queue is drained on a microtask, so this stays off the layout
			* path; a chat turn's insertions are a handful per second, not per element.
			*/
			function ensureDomObserver() {
				if (domObserver !== null || typeof MutationObserver === "undefined" || !document.body) return;
				domObserver = new MutationObserver((records) => {
					for (const record of records) if (record.type === "childList" || record.target !== document.body) {
						noteDomChange();
						return;
					}
				});
				domObserver.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["class", "data-dsh-frame"]
				});
			}
			/** Start/stop the 600ms sync tick; a no-op when already in the asked state. */
			function setWhaleTimer(on) {
				if (on && whaleTimer === null && active) whaleTimer = window.setInterval(syncWhale, 600);
				else if (!on && whaleTimer !== null) {
					window.clearInterval(whaleTimer);
					whaleTimer = null;
				}
			}
			/**
			* Compact picker (v79): a phone row cannot fit the desktop text triggers,
			* so the model/effort entries become two icon buttons in the trailing
			* row. Both forward to the official picker trigger (its menu renders as
			* the bottom sheet) and then drill straight into the asked cell — model
			* list or effort list — so one tap lands on the list, matching the
			* cube-model / brain-effort mapping. The official context ring next to
			* the send button keeps its own semantics untouched.
			*/
			function removeCompactPicker() {
				document.body.classList.remove(COMPACT_CLASS);
				document.getElementById(MODEL_BTN_ID)?.remove();
				document.getElementById(EFFORT_BTN_ID)?.remove();
			}
			function drillIntoPicker(kind) {
				const trigger = document.querySelector("[class$=\"_composerSeat\"] [class$=\"_trailing\"] [class$=\"_trigger\"]:has([class$=\"_triggerEffort\"])");
				if (trigger === null) return;
				trigger.click();
				let tries = 0;
				const tapCell = () => {
					tries += 1;
					const cells = Array.from(document.querySelectorAll("[class$=\"_composerSeat\"] [class$=\"_menu\"] [class$=\"_cell\"]"));
					const byLabel = cells.find((c) => PICKER_CELL_PATTERN[kind].test(c.textContent ?? ""));
					const drillable = cells.filter((c) => c.querySelector("[class*=\"_cellChevron\"], [class*=\"_chevron\"]"));
					const cell = byLabel ?? drillable[DRILL_INDEX[kind]];
					if (cell !== void 0) {
						cell.click();
						return;
					}
					if (tries < 8) window.setTimeout(tapCell, 150);
				};
				window.setTimeout(tapCell, 150);
			}
			function makeCompactButton(id, title, icon, kind) {
				const btn = document.createElement("button");
				btn.id = id;
				btn.type = "button";
				btn.dataset.dshPlugin = "remote-web-ui";
				btn.title = title;
				btn.setAttribute("aria-label", title);
				btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
				btn.addEventListener("click", () => {
					drillIntoPicker(kind);
				});
				return btn;
			}
			function syncCompactPicker() {
				if (!active) return;
				const tools = nodeOf("[class$=\"_composerSeat\"] [class$=\"_tools\"]");
				const trigger = tools?.parentElement?.querySelector("[class$=\"_triggerEffort\"]")?.parentElement;
				if (tools === null || trigger === null) {
					removeCompactPicker();
					return;
				}
				if (document.getElementById(MODEL_BTN_ID) === null) tools.appendChild(makeCompactButton(MODEL_BTN_ID, surfaceText("mobile.composer.pickModel", "Pick model"), CUBE_ICON, "model"));
				if (document.getElementById(EFFORT_BTN_ID) === null) tools.appendChild(makeCompactButton(EFFORT_BTN_ID, surfaceText("mobile.composer.pickEffort", "Pick reasoning effort"), LEVELS_ICON, "effort"));
				for (const [id, key, fallback] of [[
					MODEL_BTN_ID,
					"mobile.composer.pickModel",
					"Pick model"
				], [
					EFFORT_BTN_ID,
					"mobile.composer.pickEffort",
					"Pick reasoning effort"
				]]) {
					const btn = document.getElementById(id);
					if (btn === null) continue;
					const label = surfaceText(key, fallback);
					btn.title = label;
					btn.setAttribute("aria-label", label);
				}
				document.body.classList.add(COMPACT_CLASS);
			}
			/**
			* The official sidebar toggle in the logo row. The row's own `_toggle` class
			* is the precise anchor; the row's last button is the fallback for cohorts
			* that only expose the generic icon-button class (the first button is the
			* brand, which navigates home — never click that one). `_railFish` is kept
			* for older compositions that carried a rail fish button.
			*/
			function officialSidebarToggle() {
				const rail = document.querySelector("[class$=\"_railFish\"] button");
				if (rail instanceof HTMLElement) return rail;
				const row = document.querySelector("[class$=\"_logoRow\"]");
				if (row === null) return null;
				const toggles = row.querySelectorAll("button[class*=\"_toggle\"]");
				const last = toggles.length > 0 ? toggles[toggles.length - 1] : row.querySelectorAll("button")[row.querySelectorAll("button").length - 1];
				return last instanceof HTMLElement ? last : null;
			}
			/**
			* Toggle the sidebar through the official rail/logo toggle first, then
			* verify the flip and fall back to the wired layout face.
			*
			* The order is evidence-driven: the official toggle owns its own store
			* actions and flips the state on every cohort we support, while the wired
			* LayoutController is mounted yet inert on the installed cohort — calling it
			* left `data-sidebar-collapsed` untouched for the whole 800ms observation
			* window, so face-first made every whale tap wait out the verification
			* delay before anything moved. The face stays the fallback for compositions
			* that render no logo-row toggle, and it is only called after the toggle
			* demonstrably failed, so the two can never cancel each other out.
			*/
			function toggleSidebarVerified() {
				const frame = appFrame();
				const collapsedBefore = frame !== null ? frame.hasAttribute("data-sidebar-collapsed") : null;
				const face = w.__dshRemoteAdapt?.toggleSidebar;
				const callFace = () => {
					if (typeof face !== "function") return;
					try {
						face();
					} catch {}
				};
				const toggle = officialSidebarToggle();
				if (collapsedBefore === null || toggle === null) {
					if (toggle !== null) toggle.click();
					else callFace();
					return;
				}
				toggle.click();
				let tries = 0;
				const verify = () => {
					if (!active) return;
					const frameNow = appFrame();
					if (frameNow === null) return;
					if (frameNow.hasAttribute("data-sidebar-collapsed") !== collapsedBefore) return;
					tries += 1;
					if (tries < 2) {
						window.setTimeout(verify, 120);
						return;
					}
					callFace();
				};
				window.setTimeout(verify, 120);
			}
			function ensureWhale() {
				if (whaleEl !== null || !document.body) return;
				const whale = document.createElement("button");
				whale.id = WHALE_ID;
				whale.type = "button";
				whale.dataset.dshPlugin = "remote-web-ui";
				const whaleLabel = surfaceText("mobile.whale.open", "Open sidebar");
				whale.title = whaleLabel;
				whale.setAttribute("aria-label", whaleLabel);
				whale.innerHTML = `<svg viewBox="0 0 23.16 17.04" fill="none" aria-hidden="true"><path d="${FISH_PATH}" fill="currentColor"/></svg>`;
				whale.addEventListener("click", () => {
					if (whaleSuppressClick) {
						whaleSuppressClick = false;
						return;
					}
					toggleSidebarVerified();
				});
				whale.addEventListener("pointerdown", (e) => {
					if (whaleEl === null) return;
					if (e.button !== 0 && e.pointerType === "mouse") return;
					if (active && isComposerField(document.activeElement)) {
						document.activeElement.blur();
						lastComposerTap = 0;
					}
					drag = {
						x: e.clientX,
						y: e.clientY,
						left: whale.offsetLeft,
						top: whale.offsetTop,
						moved: false
					};
					try {
						whale.setPointerCapture(e.pointerId);
					} catch {}
					e.preventDefault();
					e.stopPropagation();
				});
				whale.addEventListener("pointermove", (e) => {
					if (whaleEl === null || drag === null) return;
					const dx = e.clientX - drag.x;
					const dy = e.clientY - drag.y;
					drag.moved = drag.moved || Math.abs(dx) > 3 || Math.abs(dy) > 3;
					whaleEl.style.left = `${Math.min(Math.max(4, drag.left + dx), window.innerWidth - 38)}px`;
					whaleEl.style.top = `${Math.min(Math.max(4, drag.top + dy), window.innerHeight - 38)}px`;
					e.preventDefault();
					e.stopPropagation();
				});
				const endWhaleDrag = () => {
					if (whaleEl === null || drag === null) return;
					const moved = drag.moved;
					drag = null;
					whaleSuppressClick = moved;
					try {
						window.localStorage.setItem(WHALE_POS_KEY, JSON.stringify({
							x: whaleEl.offsetLeft,
							y: whaleEl.offsetTop
						}));
					} catch {}
				};
				whale.addEventListener("pointerup", endWhaleDrag);
				whale.addEventListener("pointercancel", () => {
					drag = null;
					whaleSuppressClick = false;
				});
				whaleEl = whale;
				document.body.appendChild(whale);
			}
			/**
			* Write one row's recorded official draggable state back onto it.
			* @param row - the tracked row element.
			* @param original - the recorded attribute value, or null when it was absent.
			*/
			function restoreRowDragState(row, original) {
				if (original === null) row.removeAttribute("draggable");
				else row.setAttribute("draggable", original);
			}
			/**
			* Restore the official draggable state this layer overrode while active.
			* Rows are React-owned and may have been re-created meanwhile, so only the
			* tracked elements are touched; a detached element is written back too
			* (harmless, and it keeps the entry prunable at every tick).
			*/
			function restoreRowDrag() {
				if (dragOverridden.size === 0) return;
				for (const [row, original] of dragOverridden) restoreRowDragState(row, original);
				dragOverridden.clear();
			}
			/** Restore a dragged position when the whale becomes visible again. */
			function applyWhalePos() {
				if (whaleEl === null) return;
				let pos = null;
				try {
					pos = JSON.parse(window.localStorage.getItem(WHALE_POS_KEY) ?? "null");
				} catch {}
				if (pos !== null && typeof pos.x === "number" && typeof pos.y === "number") {
					const x = Math.min(Math.max(4, pos.x), window.innerWidth - 38);
					const y = Math.min(Math.max(4, pos.y), window.innerHeight - 38);
					whaleEl.style.left = `${x}px`;
					whaleEl.style.top = `${y}px`;
				}
			}
			/** Rows whose official draggable state this layer overrode (restored on revert). */
			const dragOverridden = /* @__PURE__ */ new Map();
			function disableRowDrag() {
				if (!active) return;
				const rows = sidebarRows();
				for (const row of rows) if (row.getAttribute("draggable") !== "false") {
					if (!dragOverridden.has(row)) dragOverridden.set(row, row.getAttribute("draggable"));
					row.setAttribute("draggable", "false");
				}
				if (dragOverridden.size === 0) return;
				for (const [row, original] of dragOverridden) {
					if (row.isConnected) continue;
					restoreRowDragState(row, original);
					dragOverridden.delete(row);
				}
			}
			/**
			* Official nodes resolved through the document and cached while they stay
			* connected. The sync tick runs every 600ms for the page lifetime, and these
			* selectors (suffix class matches, :has()) cannot use Blink's fast paths, so
			* every miss walks the whole mounted DOM — the official chat keeps the whole
			* conversation mounted, i.e. tens of thousands of elements. React replaces a
			* node on a major re-render, which the isConnected guard detects.
			*/
			const nodeCache = /* @__PURE__ */ new Map();
			/**
			* Selectors known to be absent as of {@link domGeneration}. A miss is the
			* common case, not the exception: the layer holds no overlay of its own, and
			* several official surfaces it looks for (tabs row, tools row, sidebar rows)
			* legitimately do not exist at once. Re-walking a conversation-sized document
			* for the same absent selector on every 600ms tick was waste that almost
			* always resolved to null: five document-wide lookups per tick on the measured
			* fixture, zero after this cache. That is a lookup count — the wall-clock
			* saving is real while the mounted content is quiet and shrinks to the
			* row-scope saving when a turn streams (see the Agent Note for the harness and
			* the before/after numbers).
			*
			* A miss is trusted only while the observed content has not changed, so a
			* surface that appears is still found on the very next tick — the same
			* discovery latency the unconditional probe had. The cache is never aged by a
			* clock: it is cleared by {@link noteDomChange} while the observer is live and
			* by {@link forgetAbsentSelectors} across the windows where it is not (apply
			* and revert). One blind spot is deliberate and load-bearing: the observer
			* watches <body>, so a head-resident target is not covered by that signal —
			* the one such target is seeded into the cache where it is created (see
			* ensureAdaptStyle).
			*/
			const nodeMissCache = /* @__PURE__ */ new Set();
			/**
			* Bumped whenever a cached target may have appeared or disappeared. A surface
			* qualifies on a class token or on the aggregate compat stamp
			* (`data-dsh-frame`), so both insertions/removals AND those two attributes
			* can change the answer. Nothing the layer writes per tick lands here: its own
			* class writes are all on <body>, and its row/transform/label writes touch
			* other attributes entirely (see ensureDomObserver).
			*/
			let domGeneration = 0;
			/** The generation the negative cache was recorded against. */
			let missGeneration = -1;
			function noteDomChange() {
				domGeneration += 1;
			}
			/**
			* Drop every cached "absent" verdict. Called on apply and revert: while the
			* observer is disconnected the layer is blind to insertions, so a verdict
			* recorded before the gap could otherwise outlive the change that falsified
			* it and be served without a probe. The positive cache needs no equivalent —
			* its `isConnected` guard already re-resolves a replaced node.
			*/
			function forgetAbsentSelectors() {
				nodeMissCache.clear();
				domGeneration += 1;
			}
			function nodeOf(selector) {
				const cached = nodeCache.get(selector);
				if (cached !== void 0) {
					if (cached.isConnected) return cached;
					nodeCache.delete(selector);
				}
				if (missGeneration !== domGeneration) {
					nodeMissCache.clear();
					missGeneration = domGeneration;
				}
				if (nodeMissCache.has(selector)) return null;
				const found = document.querySelector(selector);
				if (found === null) {
					nodeMissCache.add(selector);
					return null;
				}
				nodeCache.set(selector, found);
				return found;
			}
			/**
			* The session/project rows the drag suppression covers, scoped to the cached
			* sidebar root. Each row carries the sidebar column class as an ancestor, so
			* the document-wide scan this replaces only ever returned rows from here.
			*/
			function sidebarRows() {
				const sidebar = nodeOf(SIDEBAR_SELECTOR);
				if (sidebar === null) return [];
				return Array.from(sidebar.querySelectorAll(ROW_SELECTOR));
			}
			/** The official application frame, through the same cached lookup. */
			function frameEl() {
				const frame = nodeOf(APP_FRAME_SELECTOR);
				return frame instanceof HTMLElement ? frame : null;
			}
			function syncWhale() {
				if (active) ensureAdaptStyle();
				if (whaleEl === null) return;
				if (!active) {
					whaleEl.style.display = "none";
					return;
				}
				const collapsed = frameEl()?.hasAttribute("data-sidebar-collapsed") === true;
				const overlayUp = nodeOf("[class$=\"_overlay\"]") !== null;
				const show = collapsed && !overlayUp;
				if (show && !whaleShown) applyWhalePos();
				whaleEl.style.display = show ? "" : "none";
				whaleShown = show;
				const whaleLabel = surfaceText("mobile.whale.open", "Open sidebar");
				if (whaleEl.title !== whaleLabel) whaleEl.title = whaleLabel;
				if (whaleEl.getAttribute("aria-label") !== whaleLabel) whaleEl.setAttribute("aria-label", whaleLabel);
				document.body.classList.toggle(RAIL_HIDDEN_CLASS, collapsed);
				disableRowDrag();
				seatHeaderActions();
				alignActionsText();
				syncCompactPicker();
			}
			function seatHeaderActions() {
				if (!active) return;
				const header = nodeOf("[class$=\"_header\"]");
				const tabs = header !== null ? header.querySelector("[class$=\"_tabs\"]") : null;
				const actions = header !== null ? header.querySelector("[class$=\"_titleCluster\"] [class$=\"_headerActions\"]") : null;
				const seated = header !== null && tabs !== null && actions !== null;
				document.body.classList.toggle(HEADER_SEATED_CLASS, seated);
				ensureHeaderObserver(seated ? header : null);
			}
			function alignActionsText() {
				if (!active) return;
				const header = nodeOf("[class$=\"_header\"]");
				if (header === null) return;
				const tabs = header.querySelector("[class$=\"_tabs\"]");
				const actions = header.querySelector("[class$=\"_titleCluster\"] [class$=\"_headerActions\"]");
				if (tabs === null || actions === null || !(tabs instanceof HTMLElement) || !(actions instanceof HTMLElement)) return;
				if (!headerGeometryDirty) return;
				headerGeometryDirty = false;
				const tabBtn = tabs.querySelector(":scope > [class*=\"_tab\"]");
				const textBottom = (el) => {
					if (el === null) return null;
					const text = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent !== null && n.textContent.trim() !== "");
					if (text === void 0) return null;
					try {
						const range = document.createRange();
						range.selectNode(text);
						return range.getBoundingClientRect().bottom;
					} catch {
						return null;
					}
				};
				const translate = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(actions.style.transform ?? "");
				let dx = translate !== null ? parseFloat(translate[1] ?? "0") : 0;
				let dy = translate !== null ? parseFloat(translate[2] ?? "0") : 0;
				const actionsRect = actions.getBoundingClientRect();
				const headerRect = header.getBoundingClientRect();
				const headerStyle = getComputedStyle(header);
				const rightDiff = headerRect.right - (parseFloat(headerStyle.paddingRight) || 0) - (parseFloat(headerStyle.borderRightWidth) || 0) - actionsRect.right;
				if (Math.abs(rightDiff) >= .5) dx = Math.round((dx + rightDiff) * 10) / 10;
				const tabBottom = textBottom(tabBtn);
				if (tabBottom !== null) {
					let maxBottom = null;
					for (const sel of ["[class$=\"_label\"]", "[class$=\"_count\"]"]) {
						const b = textBottom(actions.querySelector(sel));
						if (b !== null && (maxBottom === null || b > maxBottom)) maxBottom = b;
					}
					if (maxBottom !== null) {
						const bottomDiff = tabBottom - maxBottom;
						if (Math.abs(bottomDiff) >= .5) dy = Math.round((dy + bottomDiff) * 10) / 10;
					}
				}
				const next = `translate(${dx}px, ${dy}px)`;
				if (actions.style.transform !== next) actions.style.transform = next;
				const reserve = `${Math.ceil(actionsRect.width) + 8}px`;
				const rootStyle = document.documentElement.style;
				if (rootStyle.getPropertyValue(HEADER_RESERVE_VAR) !== reserve) rootStyle.setProperty(HEADER_RESERVE_VAR, reserve);
			}
			function unseatHeaderActions() {
				document.body.classList.remove(HEADER_SEATED_CLASS);
				document.documentElement.style.removeProperty(HEADER_RESERVE_VAR);
				const header = document.querySelector("[class$=\"_header\"]");
				const tabs = header !== null ? header.querySelector("[class$=\"_tabs\"]") : null;
				const actions = header !== null ? header.querySelector("[class$=\"_titleCluster\"] [class$=\"_headerActions\"]") : null;
				if (actions instanceof HTMLElement) actions.style.transform = "";
				if (tabs instanceof HTMLElement) tabs.style.paddingRight = "";
				if (headerObserver !== null) {
					headerObserver.disconnect();
					headerObserver = null;
					observedHeader = null;
				}
			}
			function ensureWhaleObserver() {
				if (whaleObserver !== null || typeof MutationObserver === "undefined" || !document.body) return;
				whaleObserver = new MutationObserver(() => {
					syncWhale();
				});
				whaleObserver.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-sidebar-collapsed"],
					subtree: true
				});
			}
			/**
			* Observe the conversation header subtree and mark its geometry dirty on any
			* re-render (label text, badge count, node replacement). The per-tick
			* alignment then reads layout only when the header actually changed instead
			* of on every tick while a message streams. The observer is swapped when the
			* header node is replaced and disconnected with the layer.
			*/
			function ensureHeaderObserver(header) {
				if (typeof MutationObserver === "undefined") return;
				if (observedHeader === header && headerObserver !== null) return;
				headerObserver?.disconnect();
				headerObserver = null;
				observedHeader = null;
				if (header === null) return;
				headerObserver = new MutationObserver(() => {
					headerGeometryDirty = true;
				});
				headerObserver.observe(header, {
					childList: true,
					subtree: true,
					characterData: true,
					attributes: true,
					attributeFilter: ["class"]
				});
				observedHeader = header;
				headerGeometryDirty = true;
			}
			function evaluate() {
				headerGeometryDirty = true;
				if (!adaptEnabled) {
					revert();
					return;
				}
				if (isMobilePortrait()) {
					apply();
					ensureWhaleObserver();
					if (active && drag === null) applyWhalePos();
				} else revert();
			}
			evaluate();
			window.addEventListener("orientationchange", evaluate);
			window.addEventListener("resize", evaluate);
			document.addEventListener("visibilitychange", () => {
				setWhaleTimer(document.visibilityState !== "hidden");
			});
			function onKeydownCapture(e) {
				if (!active) return;
				if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
				const t = e.target;
				if (!(t instanceof HTMLElement)) return;
				if (composerFieldOf(t) === null) return;
				if (e.isComposing || e.keyCode === 229) return;
				e.preventDefault();
				e.stopPropagation();
				try {
					document.execCommand("insertText", false, "\n");
				} catch {}
			}
			document.addEventListener("keydown", onKeydownCapture, true);
			function collapseSidebar() {
				toggleSidebarVerified();
			}
			function onClickCapture(e) {
				if (!active) return;
				const frame = appFrame();
				if (frame === null || frame.hasAttribute("data-sidebar-collapsed")) return;
				const t = e.target;
				if (!(t instanceof Element)) return;
				if (t.closest("[class*=\"_sidebarCol\"]") !== null) {
					const topNewSessionClicked = t.closest("[class$=\"_newSession\"], [class$=\"_brand\"]") !== null;
					let projectNewSessionClicked = false;
					const projectActions = t.closest("[class*=\"_projectRow\"] [class*=\"_rowActions\"]");
					if (projectActions !== null) {
						const btn = t.closest("button");
						const btns = projectActions.querySelectorAll("button");
						projectNewSessionClicked = btn !== null && btns.length > 0 && btn === btns[btns.length - 1];
					}
					let shouldCollapse = false;
					if (t.closest("[class*=\"_sessionRow\"]") !== null) shouldCollapse = t.closest("[class*=\"_rowActions\"]") === null;
					else if (t.closest("[class$=\"_settingsArea\"]") !== null || topNewSessionClicked || projectNewSessionClicked) shouldCollapse = true;
					if (shouldCollapse) collapseSidebar();
					return;
				}
				if (t.closest("[class$=\"_overlay\"], [class$=\"_dialog\"], [class$=\"_menu\"], [class*=\"_portal\"], [id=\"dshRemoteWhale\"], [id=\"dshLanGate\"]") !== null) return;
				collapseSidebar();
			}
			document.addEventListener("click", onClickCapture, true);
			function insideHScrollable(el) {
				let n = el;
				while (n !== null && n !== document.body) {
					const cs = getComputedStyle(n);
					if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
					n = n.parentElement;
				}
				return false;
			}
			document.addEventListener("touchstart", (e) => {
				if (!active) return;
				if (e.touches.length > 1) {
					swipeTouch = null;
					return;
				}
				const t = e.target;
				const editable = t instanceof HTMLElement && t.isContentEditable;
				if (t instanceof Element && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || editable || t.closest(`#${WHALE_ID}`) !== null || t.closest("table, [class$=\"_table\"], [class$=\"_tablePane\"]") !== null)) {
					swipeTouch = null;
					return;
				}
				const ct = e.changedTouches[0];
				if (ct === void 0) return;
				swipeTouch = {
					x: ct.clientX,
					y: ct.clientY,
					id: ct.identifier,
					el: t instanceof Element ? t : null
				};
			}, {
				capture: true,
				passive: true
			});
			document.addEventListener("touchend", (e) => {
				if (swipeTouch === null) return;
				if (e.touches.length > 0) return;
				const ct = e.changedTouches[0];
				if (ct === void 0 || ct.identifier !== swipeTouch.id) return;
				const dx = ct.clientX - swipeTouch.x;
				const dy = ct.clientY - swipeTouch.y;
				const start = swipeTouch;
				swipeTouch = null;
				if (!active) return;
				if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
				if (start.el !== null && insideHScrollable(start.el)) return;
				const frame = frameEl();
				if (frame === null) return;
				if (nodeOf("[class$=\"_overlay\"], [class$=\"_dialog\"], [class$=\"_menu\"], [class*=\"_portal\"]") !== null) return;
				const collapsed = frame.hasAttribute("data-sidebar-collapsed");
				if (dx < 0 && !collapsed) collapseSidebar();
				else if (dx > 0 && collapsed) toggleSidebarVerified();
			}, {
				capture: true,
				passive: true
			});
			document.addEventListener("touchcancel", () => {
				swipeTouch = null;
			}, true);
			const LONG_PRESS_MS = 500;
			const LONG_PRESS_MOVE = 10;
			let longPress = null;
			let suppressSessionClickUntil = 0;
			let suppressSessionClickRow = null;
			let longPressMenuGuardUntil = 0;
			function clearLongPress() {
				if (longPress !== null) {
					if (longPress.timer !== null) window.clearTimeout(longPress.timer);
					longPress = null;
				}
			}
			function openSessionMenu(row) {
				const actions = row.querySelector("[class*=\"_rowActions\"]");
				const btn = actions?.querySelector("button");
				if (actions === null || btn === null) return;
				longPressMenuGuardUntil = Date.now() + 1200;
				actions.style.display = "inline-flex";
				try {
					btn.click();
				} finally {
					window.setTimeout(() => {
						actions.style.display = "";
					}, 50);
				}
			}
			document.addEventListener("touchstart", (e) => {
				if (!active) return;
				const t = e.target;
				if (!(t instanceof Element)) {
					clearLongPress();
					return;
				}
				const row = t.closest("[class*=\"_sessionRow\"]");
				if (row === null || t.closest("[class*=\"_rowActions\"]") !== null) {
					clearLongPress();
					return;
				}
				const ct = e.changedTouches[0];
				if (ct === void 0) return;
				clearLongPress();
				const lp = {
					row,
					x: ct.clientX,
					y: ct.clientY,
					timer: null,
					triggered: false
				};
				lp.timer = window.setTimeout(() => {
					if (longPress !== lp) return;
					lp.triggered = true;
					openSessionMenu(lp.row);
					try {
						navigator.vibrate?.(10);
					} catch {}
				}, LONG_PRESS_MS);
				longPress = lp;
			}, {
				capture: true,
				passive: true
			});
			document.addEventListener("touchmove", (e) => {
				if (!active || longPress === null) return;
				const ct = e.changedTouches[0];
				if (ct === void 0) return;
				if (Math.abs(ct.clientX - longPress.x) > LONG_PRESS_MOVE || Math.abs(ct.clientY - longPress.y) > LONG_PRESS_MOVE) clearLongPress();
			}, {
				capture: true,
				passive: true
			});
			document.addEventListener("touchend", (e) => {
				if (!active || longPress === null) return;
				if (e.changedTouches[0] === void 0) return;
				const lp = longPress;
				clearLongPress();
				if (lp.triggered) {
					e.preventDefault();
					suppressSessionClickUntil = Date.now() + 800;
					suppressSessionClickRow = lp.row;
				}
			}, {
				capture: true,
				passive: false
			});
			document.addEventListener("touchcancel", () => {
				clearLongPress();
			}, true);
			window.addEventListener("click", (e) => {
				if (!active || Date.now() > suppressSessionClickUntil) return;
				const t = e.target;
				if (t instanceof Element && suppressSessionClickRow !== null && (t === suppressSessionClickRow || suppressSessionClickRow.contains(t))) {
					e.stopPropagation();
					e.preventDefault();
					suppressSessionClickUntil = 0;
					suppressSessionClickRow = null;
				}
			}, true);
			document.addEventListener("contextmenu", (e) => {
				if (!active) return;
				const t = e.target;
				if (!(t instanceof Element)) return;
				if (t.closest("[class*=\"_sessionRow\"]") !== null && (longPress !== null && longPress.triggered || Date.now() <= suppressSessionClickUntil)) e.preventDefault();
			}, true);
			document.addEventListener("pointerleave", (e) => {
				if (!active || Date.now() > longPressMenuGuardUntil) return;
				const t = e.target;
				if (t instanceof Element && (t.closest("[class*=\"_rowActions\"]") !== null || t.closest("[class*=\"_sessionRow\"]") !== null || t.closest("[class*=\"_projectRow\"]") !== null)) e.stopPropagation();
			}, true);
			const isComposerField = (el) => {
				if (!(el instanceof HTMLElement)) return false;
				if (el.closest(COMPOSER_SELECTOR) === null) return false;
				if (el.matches("[data-composer-input]")) return true;
				if (el.tagName === "TEXTAREA") return true;
				return el.tagName === "INPUT" && el.matches("[class*=\"_input\"]");
			};
			/** The composer field that owns an event target, if any. */
			const composerFieldOf = (target) => {
				const el = target instanceof Element ? target.closest("[data-composer-input], [class*=\"_input\"], textarea") : null;
				return isComposerField(el) ? el : null;
			};
			const lanOrigFocus = HTMLElement.prototype.focus;
			const patchedFocus = function(options) {
				if (active && isComposerField(this) && Date.now() - lastComposerTap >= 800) return;
				lanOrigFocus.call(this, options);
			};
			/** (Re-)install the composer-focus guard (see setEnabled). */
			const installFocusPatch = () => {
				HTMLElement.prototype.focus = patchedFocus;
			};
			/**
			* Remove the guard when the layer is disabled. A patch another plugin
			* installed after ours is left alone (identity check), so disabling this
			* layer never removes someone else's behavior.
			*/
			const restoreFocusPatch = () => {
				if (HTMLElement.prototype.focus === patchedFocus) HTMLElement.prototype.focus = lanOrigFocus;
			};
			installFocusPatch();
			document.addEventListener("pointerdown", (e) => {
				if (!active) return;
				if (composerFieldOf(e.target) !== null) lastComposerTap = Date.now();
			}, true);
			w.__dshRemoteAdapt = {
				evaluate,
				toggleSidebar: null,
				closeDetails: null,
				translate: null,
				setEnabled(on) {
					adaptEnabled = on;
					if (on) {
						installFocusPatch();
						evaluate();
					} else {
						revert();
						restoreFocusPatch();
					}
				},
				flushCloseDetails() {
					if (active) w.__dshRemoteAdapt?.closeDetails?.();
				}
			};
		}
		//#endregion
		//#region src/client/plugin-card-seat.ts
		/**
		* Family plugin-card seat.
		*
		* A family plugin contributes its settings card to whichever plugin-card seat
		* the running host actually renders:
		*
		* - `web-ui.plugin.item` — the list seat declared by the dsh-web-settings
		*   group section (this family's own first-level "Web UI plugins" section);
		* - `plugins.bundle.config` — the official keyed seat of the harness's plugin
		*   manager page, keyed by the bundle's package name and rendered on that
		*   bundle's page. alpha.2 removed the `settings.plugin.item` keyed seat of the
		*   `ui-settings-plugins` tab that this helper used before, so a card keyed by
		*   its settings namespace has no seat to land in any more.
		*
		* SEAT SELECTION IS NOT A DECLARATION PROBE. The official plugin surface
		* belongs to the harness bundle and declares its seats before any external
		* plugin's `apply()` runs, so "is the official seat declared?" answers yes even
		* in the deployment whose whole point is the family group. Choosing on that
		* probe sends every family card to the official page and leaves the group's own
		* section permanently empty — the family of reports where the section renders
		* its heading and zero cards.
		*
		* The signal that actually distinguishes the two deployments is whether
		* dsh-web-settings is loaded: it is the package that owns the group section and
		* it publishes the `webUiSettings` service during `apply()`, which every
		* family plugin already reads for its settings form. Group loaded -> the family
		* seat; group absent -> the official seat.
		*
		* The decision is re-evaluated on every `slots/changed` because the group may
		* apply after this plugin (the family aggregate orders it first, a profile that
		* installs the group separately need not): the initial contribution goes to the
		* official seat, then moves to the family seat the moment the group's section
		* registers. The entry is disposed before the replacement is registered, so a
		* card is never in two seats at once.
		*
		* The shared tree has no client-SDK dependency, so this module reads its
		* context through the structural shape below; callers pass the plugin's own
		* `ctx`.
		*/
		/** The family list seat key. */
		const FAMILY_PLUGIN_CARD_SEAT = "web-ui.plugin.item";
		/** The official keyed plugin-card seat key (the alpha.2 bundle-configuration seat). */
		const OFFICIAL_PLUGIN_CARD_SEAT = "plugins.bundle.config";
		/** The service dsh-web-settings publishes while it is loaded. */
		const FAMILY_GROUP_SERVICE = "webUiSettings";
		/**
		* Whether the family group (dsh-web-settings) is loaded in this page. The
		* service is the group package's own contract, so the probe cannot be fooled
		* by a harness release that starts declaring the official seat differently.
		*/
		function familyGroupLoaded(ctx) {
			const get = ctx.get;
			if (typeof get !== "function") return false;
			try {
				return get.call(ctx, FAMILY_GROUP_SERVICE) !== void 0;
			} catch {
				return false;
			}
		}
		/** Report a refused registration instead of leaving the user with no card. */
		function warnRefusedSeat(seat, error) {
			try {
				console.warn(`[dsh-web] plugin card registration into "${seat}" was refused; the card will not render`, error);
			} catch {}
		}
		/**
		* Contribute one family plugin card to the seat this host renders, following
		* the group if it loads later. The entry is disposed and re-registered on a
		* seat change, never duplicated.
		* @param ctx - client context (its slot registry decides the seat).
		* @param seat - the card contribution.
		*/
		function installPluginCard(ctx, seat) {
			const slots = ctx.slots;
			const component = seat.component;
			const inject = seat.inject;
			let dispose;
			let current;
			/**
			* Re-entrancy latch. The registry emits a change event synchronously from
			* inside both `register` and the previous entry's disposer, so an unguarded
			* reconcile would re-enter itself mid-move and register the card twice into
			* the seat it is leaving ("already has an entry for key ...").
			*/
			let reconciling = false;
			/** Reconcile the contribution with the currently live seat (no-op when unchanged). */
			const reconcile = () => {
				if (reconciling) return;
				const target = familyGroupLoaded(ctx) ? FAMILY_PLUGIN_CARD_SEAT : OFFICIAL_PLUGIN_CARD_SEAT;
				if (current === target) return;
				reconciling = true;
				const previous = dispose;
				dispose = void 0;
				current = void 0;
				previous?.();
				try {
					dispose = slots.register(target === "web-ui.plugin.item" ? {
						name: FAMILY_PLUGIN_CARD_SEAT,
						id: seat.id,
						...seat.order === void 0 ? {} : { order: seat.order },
						...seat.label === void 0 ? {} : { label: seat.label },
						locale: seat.locale,
						...seat.inject === void 0 ? {} : { inject }
					} : {
						name: OFFICIAL_PLUGIN_CARD_SEAT,
						key: seat.bundle,
						locale: seat.locale,
						...seat.inject === void 0 ? {} : { inject }
					}, component);
					current = target;
				} catch (error) {
					warnRefusedSeat(target, error);
				} finally {
					reconciling = false;
				}
			};
			if (typeof ctx.on === "function") try {
				ctx.on("slots/changed", () => {
					reconcile();
				});
			} catch {}
			reconcile();
		}
		//#endregion
		//#region src/client/settings-entry-form.ts
		/** The snapshot a form reports before the Host has answered with this entry. */
		function pendingSnapshot() {
			return {
				status: "loading",
				value: void 0,
				base: void 0,
				user: void 0,
				revision: void 0,
				writable: false,
				mode: "host"
			};
		}
		/**
		* Create a settings form bound to the profile entry id this Host serves, and
		* rebound whenever the shared describe mirror names a different one of this
		* package's rows.
		* @param options - the shared forms service and this package's candidate row ids.
		* @returns a form delegating to the currently resolved entry's own form.
		*/
		function createServedEntryForm(options) {
			const { forms, entryIds } = options;
			const fallbackId = entryIds[0];
			const namespaceId = entryIds[entryIds.length - 1];
			const listeners = /* @__PURE__ */ new Set();
			let boundId;
			let bound;
			let offBound;
			let snapshot = pendingSnapshot();
			/** Republish: the delegated snapshot when one is bound, the pending one otherwise. */
			const publish = () => {
				if (bound !== void 0) snapshot = bound.getSnapshot();
				for (const listener of [...listeners]) listener();
			};
			/**
			* The entry id the mirror currently justifies. An unanswered or empty mirror
			* is not evidence of absence, so it keeps the first candidate; a mirror that
			* answers without any of this package's rows leaves the namespace itself.
			* @returns the entry id to bind.
			*/
			const resolve = () => {
				let served;
				try {
					served = forms.describe().getSnapshot().view?.namespaces.map((row) => row.ns);
				} catch {
					served = void 0;
				}
				if (served === void 0 || served.length === 0) return fallbackId;
				return entryIds.find((id) => served.includes(id)) ?? namespaceId;
			};
			/** Bind (or rebind) the resolved entry's form; a no-op while it is unchanged. */
			const bind = () => {
				const target = resolve();
				if (target === boundId) return;
				offBound?.();
				offBound = void 0;
				let form;
				try {
					form = forms.get(target);
				} catch {
					boundId = void 0;
					return;
				}
				boundId = target;
				bound = form;
				offBound = form.subscribe(() => {
					publish();
				});
				publish();
			};
			try {
				forms.describe().subscribe(() => {
					bind();
				});
			} catch {}
			bind();
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set: (field, value) => bound?.set(field, value) ?? Promise.resolve(false),
				unset: (field) => bound?.unset(field) ?? Promise.resolve(false),
				mutate: (ops, expectedRevision) => bound?.mutate(ops, expectedRevision) ?? Promise.resolve(false)
			};
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* Remote control — browser half. Registers the `remote` dictionaries, the
		* sidebar-foot entry (phone trigger + pairing panel + update trigger), and
		* the pair boot flow (accept + presence heartbeats) plus the one-time
		* failed-pair notice. The portrait-touch adaptation of the official UI
		* starts under the plugin lifecycle (startMobileAdapt inside apply) and reverts
		* on dispose, so disabled plugin entries stay inert. Export discipline: packages/client/AGENTS.md — the
		* /client surface carries only what cordis loading needs plus types.
		*/
		/** Dictionary namespace owned by this plugin. */
		const NS = "remote";
		/**
		* Settings namespace the remote-control card edits: the family identity of
		* this plugin's own settings form, and the row id a standalone bundle install
		* carries.
		*/
		const REMOTE_WEB_UI_NS = "remote-web-ui";
		/** Profile entry id the family aggregate's generated row carries. */
		const AGGREGATE_ENTRY_ID = "web-ui-remote-web-ui";
		/** Profile entry ids this package's patch rows carry, most specific first. */
		const REMOTE_WEB_UI_ENTRY_IDS = [
			AGGREGATE_ENTRY_ID,
			"ui-remote-web-ui",
			REMOTE_WEB_UI_NS
		];
		/**
		* The profile entry id this package's own row carries, for a page that serves
		* no family binder.
		*
		* The shared describe mirror answers asynchronously, so at plugin activation it
		* usually holds nothing yet — and an unanswered or empty mirror is not evidence
		* of absence. Binding the bare namespace there left the card bound to an entry
		* the Host does not serve, and the form is bound once per session, so the card
		* never recovered (every save answered `No configurable plugin entry`). The
		* aggregate row id matches nearly every deployment; only a mirror that answers
		* with OTHER plugins' rows falls back to the namespace itself (the pre-0.1.7
		* keying shape), because that answer is the one that actually proves this
		* package's own row is not served.
		* @param forms - the shared configuration forms service.
		* @returns the entry id to bind.
		*/
		function servedEntryId(forms) {
			let served;
			try {
				served = forms.describe().getSnapshot().view?.namespaces.map((view) => view.ns);
			} catch {
				served = void 0;
			}
			if (served === void 0 || served.length === 0) return AGGREGATE_ENTRY_ID;
			return REMOTE_WEB_UI_ENTRY_IDS.find((id) => served.includes(id)) ?? REMOTE_WEB_UI_NS;
		}
		/**
		* Bind the settings form the remote-control card reads and writes.
		*
		* The family binder comes first: it resolves this package's family namespace
		* onto the profile entry id the Host serves the form under, and keeps the
		* loopback bridge as its own fallback. A page without that group (or one where
		* its client half has not applied yet) binds through the shared forms service,
		* on the entry id the describe mirror justifies and rebound as soon as the
		* mirror answers — see {@link createServedEntryForm}.
		* @param ctx - client context carrying the family binder and/or the shared forms service.
		* @returns the form the card stages and saves through.
		*/
		function bindSettingsForm(ctx) {
			const family = ctx.get("webUiSettings");
			if (family !== void 0 && typeof family.bind === "function") return family.bind({ namespace: REMOTE_WEB_UI_NS });
			return createServedEntryForm({
				forms: ctx.configForms,
				entryIds: REMOTE_WEB_UI_ENTRY_IDS
			});
		}
		/** Heartbeat cadence from a paired phone (presence + revocation liveness). */
		const HEARTBEAT_INTERVAL_MS = 1e4;
		/** Services required by this plugin. */
		const inject = [
			"slots",
			"locale",
			"connection",
			"configForms",
			"remote"
		];
		/**
		* Register the remote-control surface.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			startMobileAdapt();
			ctx.effect(() => () => {
				window.__dshRemoteAdapt?.setEnabled?.(false);
			}, "remote-web-ui: mobile-adapt");
			reportDailyHeartbeat([{ name: "@linxin666/dsh-remote-web-ui" }]);
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, {
						zh,
						en
					});
				} catch {
					return () => {};
				}
			}, "remote-web-ui: dictionaries");
			const layout = ctx.get("layout");
			const adapt = window.__dshRemoteAdapt;
			const layoutCall = (call) => {
				try {
					call?.();
				} catch {}
			};
			if (layout !== void 0 && adapt !== void 0) {
				if (typeof layout.toggleSidebar === "function") adapt.toggleSidebar = () => {
					layoutCall(layout.toggleSidebar);
				};
				if (typeof layout.closeDetails === "function") adapt.closeDetails = () => {
					layoutCall(layout.closeDetails);
				};
			}
			if (adapt !== void 0 && adapt.toggleSidebar === null) adapt.toggleSidebar = () => {
				document.querySelector("[class$=\"_railFish\"] button, [class$=\"_logoRow\"] [class*=\"_iconButton\"]")?.click();
			};
			const t = ctx.locale.bind(NS);
			if (adapt !== void 0) adapt.translate = t;
			const settingsForm = bindSettingsForm(ctx);
			const enabled = () => {
				const snapshot = settingsForm.getSnapshot();
				return snapshot.status === "ready" ? snapshot.value?.enabled ?? true : snapshot.status === "unavailable";
			};
			const syncAdaptEnabled = () => {
				window.__dshRemoteAdapt?.setEnabled?.(enabled());
			};
			settingsForm.subscribe(syncAdaptEnabled);
			syncAdaptEnabled();
			try {
				adapt?.flushCloseDetails?.();
			} catch {}
			ctx.slots.inject("sidebar.footer.action", () => {
				let disposeEntry;
				const syncEntry = () => {
					if (enabled() && disposeEntry === void 0) try {
						disposeEntry = ctx.slots.register({
							name: "sidebar.footer.action",
							id: "remote-web-ui",
							locale: NS
						}, FooterRemoteEntry);
					} catch {}
					else if (!enabled() && disposeEntry !== void 0) {
						disposeEntry();
						disposeEntry = void 0;
					}
				};
				const unsubscribe = settingsForm.subscribe(syncEntry);
				syncEntry();
				return () => {
					unsubscribe();
					disposeEntry?.();
				};
			});
			const remoteSettings = new RemoteSettingsCardController(settingsForm);
			installPluginCard(ctx, {
				bundle: "@linxin666/dsh-remote-web-ui",
				id: "remote-web-ui",
				order: 90,
				locale: NS,
				inject: () => remoteSettings.inject(),
				component: RemoteSettingsCard
			});
			ctx.effect(() => () => {
				remoteSettings.dispose();
			}, "remote-web-ui: settings card");
			let disposeRuntime;
			const syncRuntime = () => {
				if (enabled() && disposeRuntime === void 0) disposeRuntime = ctx.effect(() => {
					const loopback = ctx.get("connection")?.isLoopback ?? true;
					runPairBootFlow(ctx, window.location.search);
					if (loopback) return () => {};
					const timer = window.setInterval(() => {
						sendHeartbeat().then((status) => {
							if (shouldStopHeartbeat(status)) window.clearInterval(timer);
						}).catch(() => {});
					}, HEARTBEAT_INTERVAL_MS);
					return () => {
						window.clearInterval(timer);
					};
				}, "remote-web-ui: pair flow + heartbeats");
				else if (!enabled() && disposeRuntime !== void 0) {
					disposeRuntime();
					disposeRuntime = void 0;
				}
			};
			settingsForm.subscribe(syncRuntime);
			syncRuntime();
			let disposeChannel;
			let hostPairingPolicy;
			let unpairedWhilePolicyPending = false;
			let fenceNotice;
			const showFenceNotice = () => {
				if (fenceNotice !== void 0) return;
				const node = document.createElement("div");
				document.body.appendChild(node);
				const root = (0, react_dom_client.createRoot)(node);
				root.render((0, react.createElement)(FenceNotice, {
					t,
					onRetry: () => {
						window.location.reload();
					}
				}));
				fenceNotice = {
					unmount: () => {
						root.unmount();
						node.remove();
					},
					node
				};
			};
			const hideFenceNotice = () => {
				fenceNotice?.unmount();
				fenceNotice = void 0;
			};
			const handleUnpaired = () => {
				if (settingsForm.getSnapshot().status !== "ready" && hostPairingPolicy === void 0) {
					unpairedWhilePolicyPending = true;
					return;
				}
				showFenceNotice();
			};
			const channelActive = () => remoteChannelRequired(pageOriginFacts(window), settingsForm.getSnapshot(), hostPairingPolicy);
			const bootSeat = () => window[REMOTE_CHANNEL_BOOT_GLOBAL];
			const syncChannel = () => {
				const transition = channelTransition(channelActive(), disposeChannel !== void 0);
				if (transition === "install") {
					const seat = bootSeat();
					if (seat !== void 0) {
						seat.onUnpaired = handleUnpaired;
						seat.onPaired = hideFenceNotice;
						if (seat.pendingUnpaired) {
							seat.pendingUnpaired = false;
							handleUnpaired();
						}
						disposeChannel = ctx.effect(() => () => {
							seat.onUnpaired = null;
							seat.onPaired = null;
						}, "remote-web-ui: remote desktop channel (boot patch)");
					} else disposeChannel = ctx.effect(() => {
						return installRemoteChannel(window, {
							onUnpaired: handleUnpaired,
							onPaired: hideFenceNotice
						});
					}, "remote-web-ui: remote desktop channel");
				} else if (transition === "retire" && disposeChannel !== void 0) {
					disposeChannel();
					disposeChannel = void 0;
					bootSeat()?.restore();
					hideFenceNotice();
				} else if (transition === "none" && !channelActive()) bootSeat()?.restore();
			};
			settingsForm.subscribe(syncChannel);
			syncChannel();
			const pageOrigin = pageOriginFacts(window);
			if (!isLocalPage(pageOrigin.hostname, pageOrigin.protocol, pageOrigin.transportOwnsHost) && settingsForm.getSnapshot().status !== "ready") readPairGatePolicy().then((policy) => {
				hostPairingPolicy = policy.requirePairingForLan;
				syncChannel();
				if (hostPairingPolicy && unpairedWhilePolicyPending) showFenceNotice();
				unpairedWhilePolicyPending = false;
			}).catch(() => {
				hostPairingPolicy = true;
				syncChannel();
				if (unpairedWhilePolicyPending) showFenceNotice();
				unpairedWhilePolicyPending = false;
			});
			ctx.effect(() => {
				const timer = window.setTimeout(() => {
					if (sessionStorage.getItem("dsh-remote-pair-failed") === null) return;
					sessionStorage.removeItem(PAIR_FAILED_MARKER);
					const mount = document.createElement("div");
					document.body.appendChild(mount);
					(0, react_dom_client.createRoot)(mount).render((0, react.createElement)(PairFailedNotice, { t }));
				}, 1500);
				return () => {
					window.clearTimeout(timer);
				};
			}, "remote-web-ui: failed-pair notice");
		}
		//#endregion
		exports.apply = apply;
		exports.bindSettingsForm = bindSettingsForm;
		exports.inject = inject;
		exports.servedEntryId = servedEntryId;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map