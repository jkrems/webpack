"use strict";

const {
	parseVersion,
	versionToString,
	versionLt,
	parseRange,
	rangeToString,
	satisfy
} = require("../lib/util/semver");

describe("SemVer", () => {
	it("should parseVersion correctly", () => {
		expect(parseVersion("1")).toEqual([1]);
		expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
		expect(parseVersion("1.2.3.4.999")).toEqual([1, 2, 3, 4, 999]);
		// eslint-disable-next-line no-sparse-arrays
		expect(parseVersion("1.2.3-beta")).toEqual([1, 2, 3, , "beta"]);
		// eslint-disable-next-line no-sparse-arrays
		expect(parseVersion("1.2.3-beta.1.2")).toEqual([1, 2, 3, , "beta", 1, 2]);
		// eslint-disable-next-line no-sparse-arrays
		expect(parseVersion("1.2.3-alpha.beta-42")).toEqual([
			1,
			2,
			3,
			,
			"alpha",
			"beta-42"
		]);
		// eslint-disable-next-line no-sparse-arrays
		expect(parseVersion("1.2.3-beta.1.alpha.0+5343")).toEqual([
			1,
			2,
			3,
			,
			"beta",
			1,
			"alpha",
			0,
			[],
			5343
		]);
		expect(parseVersion("1.2.3+5343.beta+1")).toEqual([
			1,
			2,
			3,
			[],
			5343,
			"beta+1"
		]);
		expect(parseVersion("1.2.3+5343.beta+1")).toEqual([
			1,
			2,
			3,
			[],
			5343,
			"beta+1"
		]);
	});

	describe("versionToString", () => {
		const cases = [
			"0.0.0",
			"0.0.1",
			"0.1.2",
			"1.2.3",
			"1.0.0",
			"1.2.3.4.5.6.7.8",
			"1.2",
			"1",
			"1.2.3-beta",
			"1.2.3-beta.15",
			"1.2.3-beta.15+45",
			"1.2.3-beta.15+45.67",
			"1.2.3+45",
			"1.2.3+45.67",
			"1.2.3-beta-gamma-test+x+y+z"
		];
		for (const key of cases) {
			it(`should ${key} stringify correctly`, () => {
				expect(versionToString(parseVersion(key))).toEqual(key);
			});
		}
	});

	describe("versionLt", () => {
		const cases = [
			"1 < 2",
			"99 < 100",
			"1 < 1.2",
			"1 < 1.2.3",
			"1.2 < 1.2.3",
			"1.2.2 < 1.2.3",
			"1.1.3 < 1.2.0",
			"1.1.3 < 2.0.0",
			"1.1.3 < 2",
			"1.1.3 < 2.0",
			"1.2.3 < 1.2.3+0",
			"1.2.3+23 < 1.2.3+123",
			"1.2+2 < 1.2.3+1",
			"1.2.3-beta < 1.2.3",
			"1.2.3 < 1.2.4-beta",
			"1.2.3 < 1.3.0-beta",
			"1.2.3 < 2.0.0-beta",
			"1.2.3-alpha < 1.2.3-beta",
			"1.2.3-beta < 1.2.3.1",
			"1.2.3-beta < 1.2.3-beta.0",
			"1.2.3-beta.0 < 1.2.3-beta.1",
			"1.2.3-0 < 1.2.3-beta",
			"1.2.3-beta < 1.2.3-beta+123",
			"1.2.3-beta+123 < 1.2.3-beta+234",
			"1.2.3-beta+99 < 1.2.3-beta+111"
		];
		for (const c of cases) {
			it(c, () => {
				const parts = c.split(" < ");
				const a = parseVersion(parts[0]);
				const b = parseVersion(parts[1]);
				expect(versionLt(a, a)).toBe(false);
				expect(versionLt(b, b)).toBe(false);
				expect(versionLt(a, b)).toBe(true);
				expect(versionLt(b, a)).toBe(false);
			});
		}
	});

	describe("parseRange", () => {
		const cases = {
			"=3": ["3", "v3", "3.x", "3.X", "3.x.x", "3.*", "3.*.*", "^3", "^3.x"],
			"=3.0": ["3.0", "v3.0", "3.0.x", "3.0.X", "3.0.*", "~3.0"],
			"^3.4": ["^3.4.*"],
			"3.4 - 6.5": [">=3.4 <=6.5"],
			"<=3.4": ["<3.4 || =3.4"],
			">3.4": [">=3.4 !3.4"]
		};
		for (const key of Object.keys(cases)) {
			describe(key, () => {
				for (const c of cases[key])
					it(`should be equal ${c}`, () => {
						expect(parseRange(c)).toEqual(parseRange(key));
					});
			});
		}
	});

	describe("rangeToString", () => {
		const cases = {
			"1": "^1",
			"1.2": "~1.2",
			"1.2.3": "=1.2.3",
			"^1.2.3": "^1.2.3",
			"~1.2.3": "~1.2.3",
			"0.0.1": "=0.0.1",
			"^0.0.1": "=0.0.1",
			"^0.1.2": "~0.1.2",
			"~0.0.1": "~0.0.1",
			"~0.1.2": "~0.1.2",
			">=1.2.3": ">=1.2.3",
			"1.2.3-beta.25": "=1.2.3-beta.25",
			"1.2.3-beta.25+12.34": "=1.2.3-beta.25+12.34",
			"1.2.3+12.34": "=1.2.3+12.34",
			">=1.2.3-beta.25": ">=1.2.3-beta.25",
			">=1.2.3-beta.25+12.34": ">=1.2.3-beta.25+12.34",
			">=1.2.3+12.34": ">=1.2.3+12.34",
			"<1.2.3-beta.25": "<1.2.3-beta.25",
			"<1.2.3-beta.25+12.34": "<1.2.3-beta.25+12.34",
			"<1.2.3+12.34": "<1.2.3+12.34",
			"1.2.3 - 3.2.1": ">=1.2.3 (<3.2.1 || =3.2.1)",
			">3.4": ">=3.4 not(~3.4)",
			"1 || 2 || 3": "^1 || ^2 || ^3",
			"1.2.3 - 3.2.1 || >3 <=4 || 1":
				">=1.2.3 (<3.2.1 || =3.2.1) || >=3 not(^3) (<4 || ^4) || ^1"
		};
		for (const key of Object.keys(cases)) {
			const expected = cases[key];
			it(`should ${key} stringify to ${expected}`, () => {
				expect(rangeToString(parseRange(key))).toEqual(expected);
			});
		}
	});

	describe("satisfies", () => {
		const cases = {
			// table cases
			">=1": [
				"1",
				"2",
				"!1-beta",
				"!2-beta",
				"1.2",
				"!1.2-beta",
				"2.2",
				"!2.2-beta",
				"1.beta",
				"!1.beta-beta",
				"!2.beta-beta"
			],
			">=1-beta": [
				"1",
				"2",
				"1-beta",
				"!1-gamma",
				"!1-alpha",
				"!2-beta",
				"1.2",
				"!1.2-beta",
				"2.2",
				"!2.2-beta",
				"1.beta",
				"!1.beta-beta",
				"2.beta",
				"!2.beta-beta"
			],
			">=1.2": [
				"!1",
				"2",
				"!1-beta",
				"!2-beta",
				"!1.1",
				"1.2",
				"1.3",
				"2.1",
				"2.2",
				"2.3",
				"!1.beta",
				"2.beta"
			],
			"~1.2": [
				"!1",
				"!2",
				"!10",
				"!1-beta",
				"!2-beta",
				"!1.1",
				"1.2",
				"!1.3",
				"!1.20"
			],
			">=1.beta": [
				"!1",
				"2",
				"!1-beta",
				"!2-beta",
				"!1.2",
				"2.2",
				"!1.alpha",
				"1.beta",
				"!1.gamma",
				"2.beta"
			],
			// fixed cases
			"2": [
				"2",
				"2.0.0",
				"2.99.99",
				"!2.3.4-beta",
				"!2.3.4-beta.1",
				"!2.3.4-beta+123",
				"2.3.4+123",
				"!1",
				"!1.2.3",
				"!3",
				"!3.4.5"
			],
			"1.2.3-beta.1.2+33.44": [
				"1.2.3-beta.1.2+33.44",
				"!1.2.3-beta.1.2+33.44.55",
				"!1.2.3-beta.1.2.3+33.44",
				"!1.2.3.4-beta.1.2+33.44",
				"!1.2.3-beta.1.2+33",
				"!1.2.3-beta.1.2",
				"!1.2.3-beta",
				"!1.2-beta.1.2+33.44",
				"!1.2.3+33.44",
				"!1.2.3",
				"!1"
			],
			"1.2.3+33.44": [
				"1.2.3+33.44",
				"!1.2.4+33.44",
				"!1.2.3+33.55",
				"!1.2.3-beta+33.44",
				"!1.2.3+33.44.55",
				"!1.2.3+33",
				"!1.2+33.44",
				"!1.2.3.4+33.44",
				"!1.2.3",
				"!1.2.4",
				"!1.3",
				"!1",
				"!2"
			],
			"1.2.3-beta.1.2": [
				"1.2.3-beta.1.2",
				"!1.2.3-beta.1.2+33",
				"!1.2.3-beta.1.2.3",
				"!1.2.3.4-beta.1.2",
				"!1.2.3-beta",
				"!1.2-beta.1.2",
				"!1.2.3+33",
				"!1.2.3",
				"!1"
			],
			"^2.3.4": [
				"2.3.4",
				"2.3.5",
				"2.4.0",
				"!3.3.4",
				"!1.5.6",
				"!2.3.3",
				"!2.3.4-beta",
				"!2.3.5-beta",
				"2.3.4.test",
				"!2.3.test",
				"2.3.4+33",
				"2.3.5+33",
				"2.4.0+33",
				"2.3.4.5"
			],
			"~2.3.4": [
				"2.3.4",
				"2.3.5",
				"!2.4.0",
				"!3.3.4",
				"!1.5.6",
				"!2.3.3",
				"!2.3.4-beta",
				"!2.3.5-beta",
				"2.3.4.test",
				"!2.3.test",
				"2.3.4+33",
				"2.3.5+33",
				"!2.4.0+33",
				"2.3.4.5"
			],
			"!2.3": [
				"!2.3",
				"!2.3.4",
				"2.2",
				"2.2.2",
				"2.4",
				"2.4.4",
				"2.3-beta",
				"2.3.4-beta"
			],
			"<2.3": [
				"!2.3",
				"!2.3.4",
				"2",
				"2.2",
				"2.2.1",
				"1.5",
				"0.1",
				"!2.2-beta",
				"!2.3-beta"
			],
			"<4.5-beta.14": [
				"4.5-beta.13",
				"!4.5-beta.14",
				"!4.5-beta.15",
				"!4.5-beta.14.1",
				"4.5-beta.13.1",
				"4.5-beta.13+15",
				"!4.5-beta.14+15",
				"!4.5-alpha",
				"!4.5-gamma"
			],
			"2.3 - 4.5": [
				"2.3",
				"2.4",
				"!2.3-beta",
				"4.5",
				"3.0.0",
				"!3.5.7-beta.1",
				"4.4",
				"4.5",
				"4.5.1",
				"!4.5.2-beta",
				"4.5+123"
			],
			">7.8-beta.4": [
				"!7.8-beta.3",
				"!7.8-beta.4",
				"7.8-beta.4+55",
				"7.8-beta.4.1",
				"7.8-beta.5",
				"7.8-beta.5.1",
				"!7.8-gamma",
				"7.8",
				"7.8.0",
				"7.8.1",
				"7.9",
				"8.1",
				"10"
			],
			"^0.0.3": [
				"!0.0.2",
				"0.0.3",
				"!0.0.4",
				"!0.1.0",
				"!0.1.3",
				"!1.1.3",
				"!1.0.0"
			],
			"^0.3.3": [
				"!0.0.3",
				"!0.3.2",
				"0.3.3",
				"0.3.4",
				"!0.4.0",
				"!0.4.3",
				"!0.5.10",
				"!1.0.0",
				"!1.3.3"
			],
			">=1.0.0+42": [
				"1.0.0+42",
				"!1.0+42",
				"!1.0+43",
				"1.0.0+43",
				"!1.0.0+5",
				"1.0.0+100",
				"2.0.0+10",
				"!1.0.0",
				"!1.0.0-beta"
			],
			"<1.0.0+42": [
				"!1.0.0+42",
				"!1.0.0+43",
				"1.0.0+9",
				"1.0.0+5",
				"!1.0.0+100",
				"!2.0.0+10",
				"1.0.0",
				"0.5.0",
				"!1.0.0-beta"
			],
			"=1.0.0+42": [
				"1.0.0+42",
				"!1.0+42",
				"!1.0.0+43",
				"!1.0.0+9",
				"!1.0.0+5",
				"!1.0.0+100",
				"!2.0.0+10",
				"!1.0.0",
				"!0.5.0",
				"!1.0.0-beta"
			],
			"!1.0.0+42": [
				"!1.0.0+42",
				"1.0.0+43",
				"1.0.0+9",
				"1.0.0+5",
				"1.0.0+100",
				"2.0.0+10",
				"1.0.0",
				"0.5.0",
				"1.0.0-beta"
			],
			"*": [
				"0.0.0",
				"0.0.1",
				"0.1.0",
				"1.0.0",
				"!1.0.0-beta",
				"!1.0.0-beta.1",
				"1.0.0+55"
			]
		};
		for (const name of Object.keys(cases)) {
			describe(name, () => {
				it(`should be able to parse ${name}`, () => {
					parseRange(name);
				});
				for (const item of cases[name]) {
					if (item.startsWith("!")) {
						it(`should not be satisfied by ${item.slice(1)}`, () => {
							expect(
								satisfy(parseRange(name), parseVersion(item.slice(1)))
							).toBe(false);
						});
					} else {
						it(`should be satisfied by ${item}`, () => {
							expect(satisfy(parseRange(name), parseVersion(item))).toBe(true);
						});
					}
				}
			});
		}
	});
});
