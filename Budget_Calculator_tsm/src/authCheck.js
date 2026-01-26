// src/authCheck.js

export async function checkAuth() {
  const hostname = window.location.hostname;
  const isLocal =
    hostname.includes("localhost") || hostname.includes("127.");

  /**
   * ===============================
   * 🔧 LOCAL DEV AUTH BYPASS
   * ===============================
   * Used ONLY when mother app is not running locally
   */
  if (isLocal) {
    console.warn("⚠️ Using LOCAL DEV auth (mock user)");

    return {
      authorized: true,

      // hard-coded non-admin test user
      userId: 1,
      firstName: "Test",
      lastName: "User",

      email: "test.user@local.dev",

      isAdmin: true,
      canUpdateData: true,
    };
  }

  // ===============================
  // 🌐 PRODUCTION AUTH (REAL)
  // ===============================

  const apiBase = "https://tsmbackend-production.up.railway.app/api";
  const portalBase = "https://www.thirdshiftmedia.agency";

  try {
    const res = await fetch(`${apiBase}/auth/me`, {
      credentials: "include", // cookies/JWT from mother app
    });

    if (!res.ok) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `${portalBase}/signin?redirect=${current}`;
      return false;
    }

    const user = await res.json();

    console.log("✅ Authenticated user:", user);

    return {
      authorized: true,

      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,

      email: user.email || "",

      isAdmin: user.is_admin === 1 || user.is_admin === "1",
      canUpdateData: user.can_update_data === 1 || user.can_update_data === "1",
    };

  } catch (err) {
    console.error("❌ Auth check failed:", err);
    const current = encodeURIComponent(window.location.href);
    window.location.href = `${portalBase}/signin?redirect=${current}`;
    return false;
  }
}
