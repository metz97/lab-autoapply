/** PostHog event names for AutoApply funnel (client-side capture). */
export const AUTOAPPLY_EVENTS = {
  signup: "autoapply_signup",
  tokenIssued: "autoapply_token_issued",
  firstApplication: "autoapply_first_application",
  applicationFailed: "autoapply_application_failed",
} as const;

export type AutoApplyEventName =
  (typeof AUTOAPPLY_EVENTS)[keyof typeof AUTOAPPLY_EVENTS];
