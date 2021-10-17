interface String {
  /**
   * Creates a byte string from an array of octets or an encoded string. The string encoding options are hex, base64, and base64url.
   */
  bytesFrom(str: Uint8Array | string, encoding: "hex" | "base64" | "base64url"): string;

  /**
   * Creates a Unicode string from a byte string where each byte is replaced with the corresponding Unicode code point.
   */
  fromBytes(start: number, end?: number): string;

  /**
   * Creates a Unicode string from a UTF-8 encoded byte string. If the encoding is incorrect, it returns null.
   */
  fromUTF8(start: number, end?: number): string;

  /**
   * Creates a byte string from a Unicode string. All characters must be in the [0,255] range. If not, it returns null.
   */
  toBytes(start: number, end?: number): string;

  /**
   * Creates a UTF-8 encoded byte string from a Unicode string.
   */
  toUTF8(start: number, end?: number): string;
}
