import React from "react";

function Header() {
  const currentYear = new Date().getFullYear();

  return (
    <header style={styles.header}>
      {/* Top row (mobile) / Left (desktop) */}
      <div style={styles.left}>
        <span style={styles.tagline}>
          Where Intelligence Shapes Smarter Media Planning.
        </span>
      </div>

      {/* Center: Logo + Name */}
      <div style={styles.center}>
        <img src="/company-logo.png" alt="MTM Logo" style={styles.logo} />
        <h1 style={styles.title}>MTM Group </h1>
      </div>

      {/* Right */}
      <div style={styles.right}>
        <span style={styles.environment}>SOV/SOM Based Budget Planning tool</span>
        <span style={styles.year}>{currentYear}</span>
      </div>
    </header>
  );
}

/* ========== STYLES ========== */
const styles = {
  header: {
    backgroundColor: "#f7fafc",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap",           // ✅ allows wrapping
    gap: "12px",
  },

  left: {
    flex: "1 1 250px",
    fontSize: "14px",
    color: "#4a5568",
    fontStyle: "italic",
  },

  center: {
    flex: "1 1 300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    textAlign: "center",
  },

  right: {
    flex: "1 1 200px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#4a5568",
  },

  logo: {
    height: "36px",
    width: "auto",
    objectFit: "contain",
  },

  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
    margin: 0,
    whiteSpace: "nowrap",
  },

  tagline: {
    lineHeight: 1.4,
  },

  environment: {
    backgroundColor: "#edf2f7",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },

  year: {
    fontWeight: "500",
  },
};

export default Header;
