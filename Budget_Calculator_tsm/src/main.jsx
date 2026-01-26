import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { checkAuth } from "./authCheck";

document.body.style.margin = "0";
document.body.innerHTML = `
  <div id="pre-auth-screen"
    style="
      display:flex;
      align-items:center;
      justify-content:center;
      height:100vh;
      background:white;
      color:#3bb9af;
      font-family:Arial, sans-serif;
      font-size:18px;
    ">
    Authorization Processing...
  </div>
`;

async function bootstrap() {
  try {
    const result = await checkAuth();
    if (!result || !result.userId) return;

    window.__AUTH__ = {
      user_id: result.userId,
      first_name: result.firstName,
      last_name: result.lastName,
      is_admin: result.isAdmin,
      can_update_data: result.canUpdateData,
      email: result.email || "",
      designation: result.designation || ""
    };

    console.log("✅ Authenticated user:", window.__AUTH__);

    document.body.innerHTML = `<div id="root"></div>`;

    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Auth bootstrap error:", e);
  }
}

bootstrap();
