/**
 * Checks if a value is an instance of Uint8Array.
 *
 * @param value The value to check.
 * @returns True if the value is a Uint8Array, false otherwise.
 */
export function isBytes(value) {
    return value instanceof Uint8Array;
}
/**
 * Pads a Uint8Array with zeros on the left to a specified length, or truncates
 * it from the left if it's too long.
 *
 * @param bytes The Uint8Array to pad or truncate.
 * @param length The desired length of the Uint8Array.
 * @returns The padded or truncated Uint8Array.
 */
export function setLengthLeft(bytes, length) {
    if (bytes.length < length) {
        const padded = new Uint8Array(length);
        padded.set(bytes, length - bytes.length);
        return padded;
    }
    return bytes.subarray(-length);
}
/**
 * Checks if two Uint8Arrays are equal.
 *
 * @param x The first Uint8Array to compare.
 * @param y The second Uint8Array to compare.
 * @returns True if the Uint8Arrays are equal, false otherwise.
 */
export function equalsBytes(x, y) {
    return x.length === y.length && x.every((xVal, i) => xVal === y[i]);
}
/**
 * Converts a UTF-8 encoded string into a byte array.
 *
 * @param utf8String The UTF-8 encoded string to convert to bytes.
 * @returns A Uint8Array representing the byte sequence of the input UTF-8 string.
 */
export function utf8StringToBytes(utf8String) {
    return new TextEncoder().encode(utf8String);
}
export { bytesToBigInt, bytesToNumber, numberToBytes } from "./number.js";
export { bytesToHexString, hexStringToBytes } from "./hex.js";
//# sourceMappingURL=bytes.js.map