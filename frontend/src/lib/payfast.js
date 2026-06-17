import api from "./api";

/** Submit hidden form POST to PayFast */
export function redirectToPayFast(url, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

/**
 * Request signed PayFast fields from the API and redirect (tutorial-style flow).
 * POST /api/pay or /api/payfast/pay — body must include amount, item_name, name_first, email_address.
 */
export async function handlePayment(payment, endpoint = "/pay") {
  const { data } = await api.post(endpoint, payment);
  if (!data?.url || !data?.fields) {
    throw new Error("Invalid PayFast response from server");
  }
  redirectToPayFast(data.url, data.fields);
}
