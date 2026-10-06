/**
 * cli-chat-proxy sometimes holds a request for about a minute, then returns
 * HTTP 502 with Retry-After: 60. DSH treats that header as "wait longer than
 * the 10s budget" and abandons the whole turn, so text and tool calls from
 * earlier steps stop on "本轮运行失败". These statuses are resent here, a few
 * times, before that failure is allowed to surface.
 */
export const GATEWAY_RESEND_DELAYS_MS = Object.freeze([1000, 3000, 8000]);

export function isResendableGatewayStatus(status) {
  return status === 502 || status === 503 || status === 504;
}
