const REPORT_URI = "https://kylelaker.report-uri.com/r/d/csp/enforce";

/**
 * The CloudFront Functions handler.
 *
 * @param event The CloudFront Function event.
 * @return The Response object
 */
// @ts-expect-error The name handler must be used for all files
function handler(event: AWSCloudFrontFunction.Event): AWSCloudFrontFunction.Response {
  const { response } = event;
  addSecurity(response);
  addHeader(response, "Report-To", reportToValue());
  return response;
}

/**
 * Adds a header to the event response
 * @param response The CloudFront Response object
 * @param name The name of the header
 * @param value The header value
 */
function addHeader(response: AWSCloudFrontFunction.Response, name: string, value: string) {
  if (!response.headers) {
    response.headers = {};
  }

  response.headers[name.toLowerCase()] = { value };
}

/**
 * Generates the Report-To header value.
 *
 * @returns The value of the Report-To header
 */
function reportToValue(): string {
  return JSON.stringify({
    group: "default",
    max_age: 31536000,
    endpoints: [
      {
        url: "https://kylelaker.report-uri.com/a/d/g",
      },
    ],
    include_subdomains: true,
  });
}

function specialWord(word: string): string {
  return `'${word}'`;
}

function buildContentSecurityPolicy(): string {
  const jsdelivr = "https://cdn.jsdelivr.net";
  const fontawesome = "https://*.fontawesome.com";
  const policy = [
    {
      name: "default-src",
      values: [specialWord("none")],
    },
    {
      name: "script-src",
      values: [
        specialWord("self"),
        specialWord("unsafe-inline"), // required for Font Awesome
        jsdelivr,
        fontawesome,
      ],
    },
    {
      name: "style-src",
      values: [
        specialWord("self"),
        specialWord("unsafe-inline"), // required for Font Awesome
        jsdelivr,
        fontawesome,
      ],
    },
    {
      name: "img-src",
      values: [
        specialWord("self"),
        fontawesome,
        "data:", // seems necessary for Font Awesome
      ],
    },
    {
      name: "font-src",
      values: [fontawesome],
    },
    {
      name: "connect-src",
      values: [
        specialWord("self"), // Reports show issues accessing favicon.ico without this
        fontawesome,
      ],
    },
    {
      name: "report-uri",
      values: [REPORT_URI],
    },
  ];
  const staticValues = ["upgrade-insecure-requests", "block-all-mixed-content"];
  return policy
    .map((policy) => `${policy.name} ${policy.values.join(" ")}`)
    .concat(staticValues)
    .join("; ");
}

function addSecurity(response: AWSCloudFrontFunction.Response): void {
  addHeader(response, "Strict-Transport-Security", "max-age=63072000; includeSubdomains; preload");
  addHeader(response, "Content-Security-Policy", buildContentSecurityPolicy());
  addHeader(response, "X-Content-Type-Options", "nosniff");
  addHeader(response, "X-Frame-Options", "DENY");
  addHeader(response, "X-XSS-Protection", "1; mode=block");
  addHeader(response, "Referrer-Policy", "strict-origin-when-cross-origin");
  addHeader(response, "Cross-Origin-Embedder-Policy", 'require-corp; report-to"=default"');
  addHeader(response, "Cross-Origin-Opener-Policy", 'same-origin; report-to="default"');
  addHeader(response, "Cross-Origin-Resource-Policy", "same-origin");
}
