/**
 * Name of the cookie that remembers whether the admin sidebar is collapsed. Lives outside the
 * "use client" sidebar module so Server Components get the string itself (a constant exported from a
 * client module arrives on the server as a client reference, not its value).
 */
export const SIDEBAR_COOKIE_NAME = "alluvi_admin_sidebar";
