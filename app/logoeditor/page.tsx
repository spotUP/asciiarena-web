import { redirect } from "next/navigation";
import Script from "next/script";
import { getSession as auth } from "@/lib/session";
import SiteLayout from "@/components/layout/SiteLayout";

export default async function LogoEditorPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <SiteLayout title="LOGO EDiTOR">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">LOGO EDiTOR</h2>
        </div>
      </div>

      <div className="col-lg-12" style={{ marginTop: "16px" }}>
        <span>
          <label htmlFor="fontList">Font:</label>
          <select className="form-select" id="fontList" style={{ width: "160px", marginLeft: "8px" }}>
            <option value="Graffiti.flf">Graffiti</option>
          </select>
        </span>
        <span style={{ marginLeft: "16px" }}>
          <label htmlFor="taagCharWidth">Character Width:</label>
          <select className="form-select" id="taagCharWidth" defaultValue="default" style={{ width: "180px", marginLeft: "8px" }}>
            <option value="full">Full</option>
            <option value="fitted">Fitted</option>
            <option value="controlled smushing">Smush (R)</option>
            <option value="universal smushing">Smush (U)</option>
            <option value="default">Default</option>
          </select>
        </span>
        <span style={{ marginLeft: "16px" }}>
          <label htmlFor="taagCharHeight">Character Height:</label>
          <select className="form-select" id="taagCharHeight" defaultValue="default" style={{ width: "180px", marginLeft: "8px" }}>
            <option value="full">Full</option>
            <option value="fitted">Fitted</option>
            <option value="controlled smushing">Smush (R)</option>
            <option value="universal smushing">Smush (U)</option>
            <option value="default">Default</option>
          </select>
        </span>
      </div>

      <div className="col-lg-12 d-flex justify-content-between" style={{ marginTop: "15px" }}>
        <textarea id="inputText" className="form-control" rows={3} style={{ fontFamily: "TopazPlus_a1200, monospace" }}>MY LOGO</textarea>
      </div>

      <div id="outputFigDisplay" style={{ marginTop: "16px", background: "#1a1a1a", padding: "16px", overflow: "hidden", fontFamily: "TopazPlus_a1200, monospace", color: "#ff55ff", whiteSpace: "pre" }}></div>

      <div className="col-lg-12 apt-1" style={{ display: "flex", gap: "8px" }}>
        <input type="button" className="btn-big" id="copy-logo" value="Copy to clipboard" />
        <a href="/submit#sitelogo">
          <input type="button" className="btn-big" value="Submit as site logo" readOnly />
        </a>
      </div>

      <Script src="/assets/js/logoeditor/figlet.js" strategy="afterInteractive" />
      <Script src="/assets/js/logoeditor/aolfont.js" strategy="afterInteractive" />
      <Script src="/assets/js/logoeditor/main.js" strategy="afterInteractive" />
      <Script id="logoeditor-copy" strategy="afterInteractive">{`
        document.getElementById("copy-logo").addEventListener("click", function() {
          const text = document.getElementById("outputFigDisplay").innerText;
          navigator.clipboard.writeText(text).then(() => {
            document.getElementById("copy-logo").value = "Copied!";
            setTimeout(() => { document.getElementById("copy-logo").value = "Copy to clipboard"; }, 1500);
          });
        });
      `}</Script>
    </SiteLayout>
  );
}
