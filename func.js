/**
 * @template {Object} t
 * @param {t} object The object to be copied
 * @returns {t}
 */
export function copy_obj(object) {
	/** @type {t} */
	// @ts-ignore
	const result = {};
	for (const key in object) {
		// eslint-disable-next-line no-prototype-builtins
		if (object.hasOwnProperty(key)) {
			result[key] = object[key];
		}
	}
	return result;
}
