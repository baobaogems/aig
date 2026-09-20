// fetch-deliverable.test.ts — the SSRF guard is the point of this module, so that is what
// gets tested. No network: every blocked case must be refused BEFORE a request goes out,
// which is exactly what makes it testable offline.

import { describe, expect, it } from "vitest";
import { fetchDeliverable, htmlToText, DeliverableFetchError } from "./fetch-deliverable";

async function refuses(url: string) {
  await expect(fetchDeliverable(url)).rejects.toBeInstanceOf(DeliverableFetchError);
}

describe("blocked destinations", () => {
  it("refuses cloud metadata", async () => {
    await refuses("http://169.254.169.254/latest/meta-data/");
  });

  it("refuses loopback, by ip and by name", async () => {
    await refuses("http://127.0.0.1/");
    await refuses("http://localhost:3000/api/auth/me");
  });

  it("refuses the private ipv4 blocks", async () => {
    await refuses("http://10.0.0.5/");
    await refuses("http://172.16.4.1/");
    await refuses("http://192.168.1.1/");
  });

  it("refuses ipv6 loopback and ipv4-mapped private addresses", async () => {
    await refuses("http://[::1]/");
    await refuses("http://[::ffff:10.0.0.1]/");
  });

  it("refuses non-http schemes", async () => {
    await refuses("file:///etc/passwd");
    await refuses("ftp://example.com/x");
    await refuses("gopher://example.com/");
  });

  it("refuses a malformed url", async () => {
    await refuses("not a url");
  });

  it("refuses a hostname that does not resolve", async () => {
    await refuses("https://this-host-should-not-exist-aig-test.invalid/x");
  });
});

describe("htmlToText", () => {
  it("drops scripts and styles entirely", () => {
    const out = htmlToText("<style>p{color:red}</style><script>alert(1)</script><p>Xin chào</p>");
    expect(out).toBe("Xin chào");
    expect(out).not.toMatch(/alert|color/);
  });

  it("keeps block structure as line breaks", () => {
    expect(htmlToText("<p>một</p><p>hai</p>")).toBe("một\nhai");
  });

  it("decodes the entities that actually show up in prose", () => {
    expect(htmlToText("<p>A &amp; B &lt;tag&gt; &quot;q&quot; &#39;s&#39;</p>")).toBe(`A & B <tag> "q" 's'`);
  });

  it("caps runs of blank lines at one", () => {
    // One blank line between paragraphs is worth keeping — it is the paragraph break. Four
    // is just source formatting leaking into the text the arbiter reads.
    expect(htmlToText("<p>a</p>\n\n\n\n<p>b</p>")).toBe("a\n\nb");
    expect(htmlToText("<p>a</p><p>b</p>")).toBe("a\nb");
  });

  it("never leaves leading spaces on a line", () => {
    // Evidence quotes come straight out of this text; a stray indent would show up in them.
    const out = htmlToText("<div><p>một</p>   <p>hai</p></div>");
    expect(out.split("\n").every((l) => l === l.trimStart())).toBe(true);
  });
});
