import React, { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

/**
 * Hard-coded ratio table
 * Developing & Emerging Markets
 */
const RATIO_TABLE = [
  { min: 1.0, large: 1.2, contender: 1.65 },           // 1% and above
  { min: 0.5, max: 0.99, large: 1.15, contender: 1.5 },// 0.5% – 0.99%
  { min: 0.0, max: 0.49, large: 1.1, contender: 1.35 },// 0 – 0.49%
  { min: -0.5, max: -0.01, large: 1.05, contender: 1.25 }, // 0 – -0.5%
  { max: -0.51, large: 0.8, contender: 0.9 },          // less than -0.5%
];

// --- Sub-components moved OUTSIDE the main component to prevent focus loss ---

const Tooltip = ({ text }) => (
  <span title={text} style={{ cursor: "help", color: "#4299e1", marginLeft: "4px" }}>
    ⓘ
  </span>
);

const InputField = ({ label, value, onChange, type = "text", tooltip }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(type === "text" ? e.target.value : +e.target.value)}
      style={styles.input}
    />
  </div>
);

const ResultField = ({ label, value, unit = "", highlight = false }) => (
  <div style={styles.resultGroup}>
    <label style={styles.resultLabel}>{label}</label>
    <div style={{
      ...styles.resultValue,
      ...(highlight ? styles.highlightResult : {})
    }}>
      {value}{unit}
    </div>
  </div>
);

export default function Calculator() {
  // -----------------------------
  // Basic inputs
  // -----------------------------
  const [brand, setBrand] = useState("");
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentSOM, setCurrentSOM] = useState(0);
  const [nextSOM, setNextSOM] = useState(0);

  // Market structure
  const [leaderName, setLeaderName] = useState("");
  const [leaderSOM, setLeaderSOM] = useState(0);

  // GRP inputs
  const [brandGrp, setBrandGrp] = useState(0);

  const [compGrp, setCompGrp] = useState(0);
  const [compGrpIncrease, setCompGrpIncrease] = useState(0);

  // Cost
  const [cprp, setCprp] = useState(0);
  const [tvToAllMediaFactor, setTvToAllMediaFactor] = useState(1);


  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);

  const nextYear = currentYear + 1;

  // -----------------------------
  // Derived calculations
  // -----------------------------

     const growthPct = useMemo(
      () => nextSOM - currentSOM,
      [nextSOM, currentSOM]
    );


  const marketType = useMemo(() => {
    if (leaderSOM / 2 > currentSOM) return "Contender";
    return "Large";
  }, [leaderSOM, currentSOM]);

    const ratio = useMemo(() => {
      const row = RATIO_TABLE.find((r) => {
        if (r.min !== undefined && r.max !== undefined) {
          return growthPct >= r.min && growthPct <= r.max;
        }
        if (r.min !== undefined) return growthPct >= r.min;
        if (r.max !== undefined) return growthPct <= r.max;
        return false;
      });

      return row ? (marketType === "Large" ? row.large : row.contender) : 0;
    }, [growthPct, marketType]);


  const expectedSOV = useMemo(() => nextSOM * ratio, [nextSOM, ratio]);


    // Competitor next-year GRP
    const nextCompGrp = useMemo(
      () => compGrp * (1 + compGrpIncrease / 100),
      [compGrp, compGrpIncrease]
    );

    // Total market GRP (represents 100%)
    const totalMarketGrp = useMemo(() => {
      const compShare = 1 - expectedSOV / 100;
      if (compShare <= 0) return 0; // safety guard
      return nextCompGrp / compShare;
    }, [nextCompGrp, expectedSOV]);

    // Brand next-year GRP (derived, NOT input)
    const nextYearBrandGrp = useMemo(
      () => totalMarketGrp * (expectedSOV / 100),
      [totalMarketGrp, expectedSOV]
    );

  const nextYearTVBudget = useMemo(() => nextYearBrandGrp * cprp, [nextYearBrandGrp, cprp]);

  const totalBudget = useMemo(
      () => nextYearTVBudget * tvToAllMediaFactor,
      [nextYearTVBudget, tvToAllMediaFactor]
    );

  // -----------------------------
  // PDF Download Function
  // -----------------------------
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    const checkPageBreak = (needed) => {
      if (yPos + needed > pageHeight - 20) {
        doc.addPage();
        drawHeader();
        yPos = 40; // Reset Y after new page header
      }
    };

    const drawHeader = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("MTM Group", pageWidth - 20, 15, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 20, pageWidth - 20, 20);
    };

    const drawFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(160, 174, 192);
        doc.text(
          `© ${new Date().getFullYear()} MTM Group. Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }
    };

    drawHeader();

    // Title Section
    yPos = 35;
    doc.setFontSize(20);
    doc.setTextColor(45, 55, 72);
    doc.text("Budget Planning Report", 20, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Brand: ${brand || "Not specified"}`, 20, yPos);

    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(66, 153, 225);
    doc.text(
      `Total Projected Budget (All Media): ${totalBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      20,
      yPos
    );


    // Function to draw data sections
    const drawSection = (title, data) => {
      checkPageBreak(50);
      yPos += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(45, 55, 72);
      doc.text(title, 20, yPos);
      yPos += 5;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");

      data.forEach(([label, value]) => {
        doc.text(label.toString(), 20, yPos);
        doc.text(value.toString(), pageWidth - 60, yPos);
        yPos += 8;
      });
    };

    drawSection("Basic Information", [
      ["Current Year", currentYear],
      ["Current SOM (%)", currentSOM.toFixed(2)],
      [`${nextYear} SOM (%)`, nextSOM.toFixed(2)],
      ["SOM Growth", `${growthPct.toFixed(2)}%`]
    ]);

    drawSection("Market Structure", [
      ["Category Leader", leaderName || "Not specified"],
      ["Leader SOM (%)", leaderSOM.toFixed(2)],
      ["Market Type", marketType],
      ["Applied SOV/SOM Ratio", ratio.toFixed(2)]
    ]);

    drawSection("Share of Voice (SOV)", [
      [`Target SOM ${nextYear} (%)`, nextSOM.toFixed(2)],
      [`Required SOV ${nextYear} (%)`, expectedSOV.toFixed(2)]
    ]);

    drawSection("GRP Analysis", [
      [`${brand || "Brand"} GRP ${nextYear}`, nextYearBrandGrp.toFixed(2)],
      [`Competitor GRP ${nextYear}`, nextCompGrp.toFixed(0)],
      [`Total Market GRP (100%)`, totalMarketGrp.toFixed(0)]
    ]);

    drawSection("Financial Impact", [
    ["CPRP (TV)", cprp.toLocaleString('en-US')],
    ["TV → All Media Factor", tvToAllMediaFactor],
    [`TV Budget ${nextYear}`, nextYearTVBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })],
    [`Total Media Budget ${nextYear}`, totalBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })],
    ]);

    drawFooter();
    doc.save(`Budget_Plan_${brand || 'Report'}.pdf`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div style={styles.container}>
      {showSuccess && <div style={styles.successMessage}>✓ PDF successfully downloaded!</div>}

      <div style={styles.content}>
        <div style={styles.titleSection}>
          <h1 style={styles.mainTitle}>Developing & Emerging Markets Budget Calculator</h1>
          <p style={styles.subTitle}>SOV to SOM Ratio-based budget planning tool</p>
        </div>

{/* ================= ROW 1 ================= */}
<div style={styles.rowGrid}>
  {/* Brand & Market Inputs */}
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Brand & Market Inputs</h3>

    <div style={styles.grid2}>
      <InputField label="Brand Name" value={brand} onChange={setBrand} />
      <InputField
        label="Current Year"
        type="number"
        value={currentYear}
        onChange={setCurrentYear}
      />
      <InputField
        label="Current Year SOM (%)"
        type="number"
        value={currentSOM}
        onChange={setCurrentSOM}
        tooltip="Current Share of Market"
      />
      <InputField
        label={`${nextYear} SOM (%)`}
        type="number"
        value={nextSOM}
        onChange={setNextSOM}
        tooltip="Next year's Share of Market"
      />
    </div>

    <ResultField
      label="SOM Growth"
      value={growthPct.toFixed(2)}
      unit="%"
      highlight
    />
  </div>

  {/* Market Structure */}
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Market Structure</h3>

    <div style={styles.grid2}>
      <InputField
        label="Category Leader Name"
        value={leaderName}
        onChange={setLeaderName}
      />
      <InputField
        label="Leader SOM (%)"
        type="number"
        value={leaderSOM}
        onChange={setLeaderSOM}
        tooltip="Category Leader's Share of Market"
      />
    </div>

    <div style={styles.resultGrid}>
      <ResultField
        label="Market Type"
        value={marketType}
        highlight={marketType === "Contender"}
      />
      <ResultField
        label="Selected Ratio"
        value={ratio.toFixed(2)}
      />
      <ResultField
        label={`Expected SOV ${nextYear}`}
        value={expectedSOV.toFixed(2)}
        unit="%"
        highlight
      />
    </div>
  </div>
</div>

{/* ================= ROW 2 ================= */}
<div style={styles.rowGrid}>
  {/* GRP Calculation */}
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>GRP Calculation</h3>

    <div style={styles.grpTable}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th></th>
            <th>Current</th>
            <th>Increase %</th>
            <th>{nextYear}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.tableLabel}>{brand || "Brand"} GRP</td>
            <td>
              <input
                type="number"
                value={brandGrp}
                onChange={(e) => setBrandGrp(+e.target.value)}
                style={styles.tableInput}
              />
            </td>
            <td style={{ textAlign: "center", color: "#a0aec0" }}>—</td>
            <td style={styles.tableResult}>
              {nextYearBrandGrp.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td style={styles.tableLabel}>Competitor GRP</td>
            <td>
              <input
                type="number"
                value={compGrp}
                onChange={(e) => setCompGrp(+e.target.value)}
                style={styles.tableInput}
              />
            </td>
            <td>
              <input
                type="number"
                value={compGrpIncrease}
                onChange={(e) => setCompGrpIncrease(+e.target.value)}
                style={styles.tableInput}
              />
            </td>
            <td style={styles.tableResult}>
              {nextCompGrp.toFixed(2)}
            </td>
          </tr>

          <tr style={styles.totalRow}>
            <td style={styles.tableLabel}>
              <strong>Total Market GRP (100%)</strong>
            </td>
            <td></td>
            <td></td>
            <td style={styles.tableResult}>
              <strong>{totalMarketGrp.toFixed(2)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Budget Calculation */}
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Budget Calculation</h3>

<div style={styles.grid2}>
  <InputField
    label="CPRP (TV)"
    type="number"
    value={cprp}
    onChange={setCprp}
    tooltip="Cost per Rating Point for TV"
  />

  <InputField
    label="TV → All Media Factor"
    type="number"
    value={tvToAllMediaFactor}
    onChange={setTvToAllMediaFactor}
    tooltip="Multiplier to convert TV budget to total media budget"
  />
</div>

<div style={styles.finalBudgetRow}>
  <div style={styles.budgetResult}>
    <div style={styles.budgetResultLabel}>
      {nextYear} TV Budget
    </div>
    <div style={styles.budgetResultValue}>
      {nextYearTVBudget.toLocaleString("en-US", { maximumFractionDigits: 0 })}
    </div>
  </div>

  <div style={styles.budgetResult}>
    <div style={styles.budgetResultLabel}>
      {nextYear} Total Media Budget
    </div>
    <div style={styles.budgetResultValue}>
      {totalBudget.toLocaleString("en-US", { maximumFractionDigits: 0 })}
    </div>
  </div>
</div>

  </div>
</div>

        <div style={styles.actionSection}>
          <button onClick={downloadPDF} style={styles.downloadButton}>Download PDF Report</button>
        </div>
      </div>
    </div>
  );
}

// --- Styles moved OUTSIDE to prevent re-creation on every render ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#d5e9f7', padding: '0' },
  content: { maxWidth: '1400px', margin: '0 auto', padding: '20px' },
  titleSection: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  mainTitle: { margin: '0', color: '#2d3748', fontSize: '24px', fontWeight: '600' },
  subTitle: { margin: '8px 0 0 0', color: '#718096', fontSize: '14px', fontStyle: 'italic' },
    topContainer: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
      alignItems: "stretch",
      gridAutoRows: "1fr",   // 👈 THIS is the key
    },

  middleContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  bottomContainer: { marginBottom: '20px' },
card: {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
},

  wideCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  cardTitle: { margin: '0 0 20px 0', color: '#2d3748', fontSize: '18px', fontWeight: '600', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#4a5568', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  input: { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  resultGroup: { backgroundColor: '#f7fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  resultLabel: { color: '#718096', fontSize: '12px', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase' },
  resultValue: { color: '#2d3748', fontSize: '18px', fontWeight: '600' },
  highlightResult: { color: '#4299e1' },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  grpTable: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  tableLabel: { padding: '12px 8px', textAlign: 'left', color: '#4a5568', fontWeight: '500' },
  tableInput: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  tableResult: { padding: '12px 8px', textAlign: 'left', color: '#2d3748', fontWeight: '600' },
  totalRow: { backgroundColor: '#f7fafc', borderTop: '2px solid #e2e8f0' },
  budgetGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'center' },
  budgetInputSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  budgetResultSection: { display: 'flex', justifyContent: 'center' },
  budgetResult: { textAlign: 'center', padding: '30px', backgroundColor: '#4299e1', borderRadius: '8px', color: 'white',width: '100%',boxSizing: 'border-box', },
  budgetResultLabel: { fontSize: '14px', fontWeight: '500', marginBottom: '10px', opacity: 0.9 },
  budgetResultValue: { fontSize: '32px', fontWeight: '600' },
  actionSection: { display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '30px' },
  downloadButton: { padding: '12px 24px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  successMessage: { position: 'fixed', top: '20px', right: '20px', backgroundColor: '#48bb78', color: 'white', padding: '12px 20px', borderRadius: '6px', zIndex: 1000 },
  finalBudgetRow: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "20px",
},
rowGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
  alignItems: "stretch",
  gridAutoRows: "1fr",   // ✅ KEY LINE
},


};

