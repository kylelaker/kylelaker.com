import { ReportToHeader } from "./report-to-header";

export enum CspShaType {
  SHA256 = "sha256",
  SHA384 = "sha384",
  SHA512 = "sha512",
}

/**
 * Represents the value of a Content Security Policy header directive.
 */
export class CspValue {
  /**
   * The 'none' keyword for a CSP directive.
   */
  public static readonly NONE = CspValue.keyword("none");
  /**
   * The 'self' keyword for a CSP directive.
   */
  public static readonly SELF = CspValue.keyword("self");
  /**
   * The 'unsafe-eval' keyword for a CSP directive.
   */
  public static readonly UNSAFE_EVAL = CspValue.keyword("unsafe-eval");
  /**
   * The 'unsafe-inline' keyword for a CSP directtive.
   */
  public static readonly UNSAFE_INLINE = CspValue.keyword("unsafe-inline");

  /**
   * The http: protocol.
   */
  public static readonly HTTP = CspValue.protocol("http");
  /**
   * The https: protocol.
   */
  public static readonly HTTPS = CspValue.protocol("https");
  /**
   * The data: protocol.
   */
  public static readonly DATA = CspValue.protocol("data");

  public readonly value: string;
  constructor(value: string) {
    this.value = value;
  }

  public toString(): string {
    return this.value;
  }

  /**
   * An arbitrary host.
   * @param name The host value
   * @returns
   */
  public static host(name: string): CspValue {
    return new CspValue(name);
  }

  /**
   * Any keyword in a CSP directive.
   *
   * @example
   * const self = CspValue.keyword("self");
   * console.log(self); // Prints 'self'
   *
   * @param name The keyword name
   * @returns The keyword wrapped in single quotes
   */
  public static keyword(name: string): CspValue {
    return new CspValue(`'${name}'`);
  }

  /**
   * A protocol in a CSP directive.
   *
   * This handles appending the colon (`:`) at the end of the protocol
   * name.
   *
   * @param name The protocol name for the directive
   * @returns The protocol value for the header
   */
  public static protocol(name: string): CspValue {
    return new CspValue(`${name}:`);
  }

  /**
   * Given a value generates the nonce value for a CSP directive.
   *
   * @example
   *
   * ```typescript
   * const sampleNonce = CspValue.nonce("foo");
   * console.log(sampleNonce); // nonce-foo
   * ```
   *
   * @param value The nonce value
   * @returns The properly-formatted nonce value for the CSP directive.
   */
  public static nonce(value: string): CspValue {
    return new CspValue(`nonce-${value}`);
  }

  /**
   * Given a SHA algorithm and hash, creates the CSP directive value.
   *
   * @param alg The SHA algorithm (SHA256, SHA384, SHA512)
   * @param hash The actual hash value
   * @returns The CSP directive value for the SHA
   */
  public static sha(alg: CspShaType, hash: string) {
    return new CspValue(`${alg}-${hash}`);
  }
}

export interface ContentSecurityPolicyProps {
  childSrc?: CspValue[];
  connectSrc?: CspValue[];
  defaultSrc?: CspValue[];
  fontSrc?: CspValue[];
  frameSrc?: CspValue[];
  imgSrc?: CspValue[];
  manifestSrc?: CspValue[];
  mediaSrc?: CspValue[];
  objectSrc?: CspValue[];
  prefetchSrc?: CspValue[];
  scriptSrc?: CspValue[];
  styleSrc?: CspValue[];

  reportUri?: string;
  reportTo?: ReportToHeader;

  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * A Content Security Policy header value.
 */
export class ContentSecurityPolicy {
  readonly #props: ContentSecurityPolicyProps;
  constructor(props: ContentSecurityPolicyProps) {
    this.#props = props;
  }

  get value(): string {
    return [
      {
        name: "child-src",
        values: this.#props.childSrc,
      },
      {
        name: "connect-src",
        values: this.#props.connectSrc,
      },
      {
        name: "default-src",
        values: this.#props.defaultSrc,
      },
      {
        name: "font-src",
        values: this.#props.fontSrc,
      },
      {
        name: "frame-src",
        values: this.#props.frameSrc,
      },
      {
        name: "img-src",
        values: this.#props.imgSrc,
      },
      {
        name: "manifest-src",
        values: this.#props.manifestSrc,
      },
      {
        name: "media-src",
        values: this.#props.mediaSrc,
      },
      {
        name: "object-src",
        values: this.#props.mediaSrc,
      },
      {
        name: "prefetch-src",
        values: this.#props.prefetchSrc,
      },
      {
        name: "script-src",
        values: this.#props.scriptSrc,
      },
      {
        name: "style-src",
        values: this.#props.styleSrc,
      },
    ]
      .filter((directive) => directive.values && directive.values.length !== 0)
      .map((directive) => `${directive.name} ${directive.values?.join(" ")}`)
      .concat(
        ...(this.#props.reportUri ? [`report-uri ${this.#props.reportUri}`] : []),
        ...(this.#props.reportTo ? [`report-to ${this.#props.reportTo.groupName}`] : []),
        ...(this.#props.upgradeInsecureRequests ? ["upgrade-insecure-requests"] : []),
        ...(this.#props.blockAllMixedContent ? ["block-all-mixed-content"] : [])
      )
      .join("; ");
  }
}
