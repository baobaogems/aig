export interface SiweFields {
  domain: string;
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}

/**
 * Build the exact text the wallet signs. Shared between client and server so they never drift.
 */
export function buildSiweMessage(f: SiweFields): string {
  return [
    `${f.domain} muốn bạn đăng nhập bằng ví Ethereum:`,
    f.address,
    "",
    "Ký để đăng nhập Arbiter. Thao tác này miễn phí và không chuyển bất kỳ khoản tiền nào.",
    "",
    `URI: https://${f.domain}`,
    "Version: 1",
    `Chain ID: ${f.chainId}`,
    `Nonce: ${f.nonce}`,
    `Issued At: ${f.issuedAt}`,
  ].join("\n");
}
