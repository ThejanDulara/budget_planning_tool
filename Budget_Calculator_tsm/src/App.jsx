// src/App.jsx
import React from "react";
import Calculator from "./components/Calculator";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Layout>
      <div style={{ background: "#f7f7f7", minHeight: "100%" }}>
        <Calculator />
      </div>
    </Layout>
  );
}
