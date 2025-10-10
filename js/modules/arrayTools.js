/**
 * Shifts content of an array to the left by 1
 * @param {*} arr 
 * @returns 
 */
export function shiftArray(arr, index) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const n = arr.length;
  const i = ((index % n) + n) % n; // normalize
  return arr.slice(i).concat(arr.slice(0, i));
}

/**
 * Return array element at startIndex + offset, wrapped.
 * Works with negative startIndex or offset and empty arrays (returns undefined).
 *
 * @param {Array} arr
 * @param {number} startIndex
 * @param {number} offset
 * @returns {*}
 */
export function getOffsetIndexAt(arr, startIndex, offset) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const n = arr.length;
  // Normalize to integer indices
  const idx = ((Math.trunc(startIndex) + Math.trunc(offset)) % n + n) % n;
  return arr[idx];
}