import { GATEWAY_RESEND_DELAYS_MS, isResendableGatewayStatus } from '../lib/gateway-retry.js';

if (GATEWAY_RESEND_DELAYS_MS.length !== 3) throw new Error('a 502 is resent three times');
if (GATEWAY_RESEND_DELAYS_MS.some((delay) => delay < 1000 || delay > 10_000)) {
  throw new Error('resend gaps stay inside 1s..10s');
}
for (const status of [502, 503, 504]) {
  if (!isResendableGatewayStatus(status)) throw new Error(`${status} must be resent`);
}
for (const status of [400, 401, 429, 500]) {
  if (isResendableGatewayStatus(status)) throw new Error(`${status} must not be resent`);
}

console.log('gateway retry ok');
