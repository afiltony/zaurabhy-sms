import { createHash } from "crypto";

export function isPayuConfigured() {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
}

export function getPayuBaseUrl() {
  return process.env.PAYU_BASE_URL || "https://test.payu.in/_payment";
}

type PayuTxnFields = {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
};

/** PayU's documented forward hash sequence, with all udf1-10 slots left empty. */
export function buildPayuHash(fields: PayuTxnFields) {
  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_MERCHANT_SALT!;
  const { txnid, amount, productinfo, firstname, email } = fields;

  const sequence = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    salt,
  ];

  return createHash("sha512").update(sequence.join("|")).digest("hex");
}

/** PayU's documented reverse hash sequence, used to verify the surl/furl callback. */
export function verifyPayuResponseHash(
  fields: PayuTxnFields & { status: string; hash: string },
) {
  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_MERCHANT_SALT!;
  const { txnid, amount, productinfo, firstname, email, status, hash } = fields;

  const sequence = [
    salt,
    status,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ];

  const expected = createHash("sha512").update(sequence.join("|")).digest("hex");
  return expected === hash;
}
