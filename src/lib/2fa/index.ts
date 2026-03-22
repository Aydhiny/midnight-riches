import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "Midnight Riches";

/** Generate a new TOTP secret */
export function generateTotpSecret(): string {
  return generateSecret();
}

/** Generate the otpauth:// URI for QR code scanners */
export function getTotpUri(secret: string, email: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

/** Generate a base64 data URL for the QR code image */
export async function generateQrDataUrl(secret: string, email: string): Promise<string> {
  const uri = getTotpUri(secret, email);
  return QRCode.toDataURL(uri, { width: 200, margin: 2 });
}

/** Verify a 6-digit TOTP code against a secret */
export function verifyTotpCode(code: string, secret: string): boolean {
  try {
    const result = verifySync({ token: code.replace(/\s/g, ""), secret });
    return result.valid;
  } catch {
    return false;
  }
}
