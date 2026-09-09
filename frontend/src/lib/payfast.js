import api from "./api";

/** Submit hidden form POST to PayFast (once-off shop / donation). */
export function redirectToPayFast(url, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "UTF-8";

  // Same attribute order PayFast uses when regenerating the signature
  const order = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "signature",
  ];

  const used = new Set();
  const append = (name, value) => {
    if (value === null || value === undefined || value === "") return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = typeof value === "string" ? value : String(value);
    form.appendChild(input);
    used.add(name);
  };

  order.forEach((name) => append(name, fields[name]));
  Object.entries(fields).forEach(([name, value]) => {
    if (!used.has(name) && name !== "signature") append(name, value);
  });
  if (!used.has("signature") && fields.signature != null) {
    append("signature", fields.signature);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Request signed PayFast fields from the API and redirect.
 */
export async function handlePayment(payment, endpoint = "/pay") {
  const { data } = await api.post(endpoint, payment);
  if (!data?.url || !data?.fields) {
    throw new Error("Invalid PayFast response from server");
  }
  redirectToPayFast(data.url, data.fields);
}
