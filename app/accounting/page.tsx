import SiteLayout from "@/components/layout/SiteLayout";

export default function AccountingPage() {
  const rows = [
    ["1/88",  "1,000.00", "88.85", "10.00", "78.85",  "921.15"],
    ["2/88",  "921.15",   "88.85", "9.21",  "79.64",  "841.51"],
    ["3/88",  "841.51",   "88.85", "8.42",  "80.43",  "761.08"],
    ["4/88",  "761.08",   "88.85", "7.61",  "81.24",  "679.84"],
    ["5/88",  "679.84",   "88.85", "6.80",  "82.05",  "597.79"],
    ["6/88",  "597.79",   "88.85", "5.98",  "82.87",  "514.92"],
    ["7/88",  "514.92",   "88.85", "5.15",  "83.70",  "431.22"],
    ["8/88",  "431.22",   "88.85", "4.31",  "84.54",  "346.68"],
    ["9/88",  "346.68",   "88.85", "3.47",  "85.38",  "261.30"],
    ["10/88", "261.30",   "88.85", "2.61",  "86.24",  "175.07"],
    ["11/88", "175.07",   "88.85", "1.75",  "87.10",  "87.97"],
    ["12/88", "87.97",    "88.85", "0.88",  "87.97",  "0.00"],
  ];

  const cell = "col-2";
  const s: React.CSSProperties = { color: "white" };
  const shover: React.CSSProperties = { color: "white", cursor: "text" };

  return (
    <SiteLayout title="ACCOUNTiNG">
      <style>{`
        .ss-cell { color: white; }
        .ss-cell:hover { color: black; background: #aaaaaa; }
        .ss-cell:focus { color: black; background: #aaaaaa; outline: none; }
      `}</style>

      {/* Column headers */}
      <div className="row" style={{ paddingBottom: "8px" }}>
        {["A","B","C","D","E","F"].map(h => (
          <div key={h} className={cell} style={{ color: "#eeee44", textAlign: "center" }}>{h}</div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        {/* Row numbers */}
        <div style={{ color: "#eeee44", whiteSpace: "pre", marginRight: "4px", minWidth: "32px", textAlign: "right" }}>
          {[...Array(21)].map((_, i) => `${i + 1}\n`).join("")}{"F12\n"}
        </div>

        {/* Spreadsheet */}
        <div className="container" style={{ background: "#1c00b0", padding: "16px", flex: 1 }}>
          <div className="row">
            <div className={`${cell} ss-cell`}>Loan Amount</div>
            <div className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning>1,000.00</div>
          </div>
          <div className="row">
            <div className={`${cell} ss-cell`}>Interest</div>
            <div className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning>12.00%</div>
          </div>
          <div className="row">
            <div className={`${cell} ss-cell`}>Term (months)</div>
            <div className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning>12</div>
          </div>
          <div className="row">
            <div className={`${cell} ss-cell`}>Starting</div>
            <div className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning>1/88</div>
          </div>

          <div className="row" style={{ paddingTop: "16px" }}>
            {["Month","Balance","Payment","Interest","Principal","New Balance"].map(h => (
              <div key={h} className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning style={s}>{h}</div>
            ))}
          </div>

          {rows.map((row, ri) => (
            <div key={ri} className="row" style={ri === 0 ? { paddingTop: "16px" } : {}}>
              {row.map((val, ci) => (
                <div key={ci} className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning style={shover}>{val}</div>
              ))}
            </div>
          ))}

          <div className="row" style={{ paddingTop: "16px" }}>
            {["Totals","","1,066.19","66.19","",""].map((val, ci) => (
              <div key={ci} className={`${cell} ss-cell`} contentEditable suppressContentEditableWarning style={s}>{val}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="fixed-bottom d-flex justify-content-between bg-secondary" style={{ height: "22px", padding: "0 32px" }}>
        <span style={{ color: "black" }}>Press ALT to choose commands.</span>
        <span style={{ color: "black" }}>SS 00.WKS</span>
      </div>
    </SiteLayout>
  );
}
