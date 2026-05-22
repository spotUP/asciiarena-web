import SiteLayout from "@/components/layout/SiteLayout";

export default function DialoguesPage() {
  return (
    <SiteLayout title="DiALOGUES">
      {/* Amiga-style dialog CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/dialogues.css" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding: "8px" }}>

        {/* HippoPrefs - Playback */}
        <div className="req-container hippo hip-dialogue-width">
          <div className="req-title-padding">HippoPrefs</div>
          <div className="req-close-button"></div>
          <div className="req-size-gadget"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <div className="req-button-container">
                <button className="hip-3-button">General</button>
                <button className="hip-3-button">Display</button>
                <button className="hip-3-button white">Playback</button>
              </div>
              <div className="hip-header">
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px" }}>Player</p>
                  <button className="hip-3-button">UADE</button>
                </div>
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px", whiteSpace: "nowrap" }}>Stereo Separation</p>
                  <button className="hip-3-button">None</button>
                </div>
              </div>
            </div>
          </div></div></div>
        </div>

        {/* HippoPrefs - Display */}
        <div className="req-container hippo hip-dialogue-width">
          <div className="req-title-padding">HippoPrefs</div>
          <div className="req-close-button"></div>
          <div className="req-size-gadget"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <div className="req-button-container">
                <button className="hip-3-button">General</button>
                <button className="hip-3-button white">Display</button>
                <button className="hip-3-button">Playback</button>
              </div>
              <div className="hip-header">
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px" }}>Show</p>
                  <button className="hip-3-button">Time, pos/len, song</button>
                </div>
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px" }}>Font</p>
                  <button className="hip-3-button">Topaz</button>
                </div>
                <label className="checkbox-hip"><span style={{ marginRight: "36px", marginLeft: "-8px" }}>Scope</span><input type="checkbox" defaultChecked /></label>
                <label className="checkbox-hip"><span style={{ marginRight: "36px", marginLeft: "-8px" }}>Scope bars</span><input type="checkbox" defaultChecked /></label>
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px" }}>Type</p>
                  <button className="hip-3-button">Patternscope</button>
                </div>
              </div>
            </div>
          </div></div></div>
        </div>

        {/* HippoPrefs - General */}
        <div className="req-container hippo hip-dialogue-width">
          <div className="req-title-padding">HippoPrefs</div>
          <div className="req-close-button"></div>
          <div className="req-size-gadget"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <div className="req-button-container">
                <button className="hip-3-button white">General</button>
                <button className="hip-3-button">Display</button>
                <button className="hip-3-button">Playback</button>
              </div>
              <div className="hip-header">
                <div className="req-button-container">
                  <p className="req" style={{ marginTop: "8px", marginRight: "4px" }}>Play</p>
                  <button className="hip-3-button">List Repeatedly</button>
                </div>
                <label className="checkbox-hip"><span style={{ marginRight: "36px", marginLeft: "-8px" }}>Divider / dir</span><input type="checkbox" defaultChecked /></label>
                <label className="checkbox-hip"><span style={{ marginRight: "36px", marginLeft: "-8px" }}>Auto sort</span><input type="checkbox" defaultChecked /></label>
              </div>
            </div>
          </div></div></div>
        </div>

        {/* Line # */}
        <div className="req-container standard-dialogue-width">
          <div className="req-title">Line #</div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <div className="req-tight-border" style={{ marginTop: "4px" }}><input className="tight" type="text" /></div>
              <p className="req" style={{ marginBottom: "13px", marginTop: "13px" }}>-1 .. 1</p>
              <div className="req-divider"></div>
              <div className="req-button-container">
                <div className="req-double-border"><input className="req" value="OK" type="button" /></div>
                <input className="req" value="Cancel" type="button" />
              </div>
            </div>
          </div></div></div>
        </div>

        {/* Quit */}
        <div className="req-container standard-dialogue-width">
          <div className="req-title">CygnusEdd</div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <p className="req">XXX changes have been made to this file.<br />They will be lost.<br />OK to quit?</p>
              <div className="req-divider"></div>
              <div className="req-button-container">
                <input className="req" value="OK" type="button" />
                <input className="req" value="Cancel" type="button" />
              </div>
            </div>
          </div></div></div>
        </div>

        {/* File */}
        <div className="req-container file-dialogue-width">
          <div className="req-title-padding">Open file(s)...</div>
          <div className="req-close-button"></div>
          <div className="req-size-gadget"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3 fat-2"><div className="req-border-2 fat-1"><div className="req-border-1 nobottomborder">
            <div className="req-content">
              <div className="req-filelist">
                <ul className="ced-filelist">
                  {["up-textr.txt","ds!-yeah.txt","ds!-spot.txt","ds!-warn.txt","ds!-bull.txt","lp-whome.txt","3ad-home.txt","3ad-wank.txt","3ad-ruff.txt","3ad-kill.txt","hos-none.txt","hos-bass.txt"].map(f => (
                    <li key={f}><a className="ced-filelist" href="#">{f}</a></li>
                  ))}
                </ul>
              </div>
              <div className="req-button-container">
                <div className="req-label">Drawer</div>
                <div className="req-tight-border"><input className="tight" type="text" placeholder="aSCIIaRENA:" /></div>
              </div>
              <div className="req-button-container">
                <div className="req-label">File</div>
                <div className="req-tight-border"><input className="tight" type="text" placeholder="SelectedFile.txt" /></div>
              </div>
              <div className="req-button-container req-footer-spacing">
                <input type="button" className="req" value="OK" />
                <input type="button" className="req" value="Cancel" />
              </div>
            </div>
          </div></div></div>
        </div>

        {/* Font */}
        <div className="req-container font-dialogue-width">
          <div className="req-title-padding">Select a font</div>
          <div className="req-close-button"></div>
          <div className="req-size-gadget"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3 fat-2"><div className="req-border-2 fat-1"><div className="req-border-1 nobottomborder">
            <div className="req-content">
              <div className="req-filelist" style={{ marginBottom: 0 }}>
                <ul className="ced-filelist">
                  {["MicroKnight","MicroKnight Plus","mO'sOul","P0T-NOoDLE","Topaz (Amiga 500)","Topaz (Amiga 1200)","TopazPlus (Amiga 500)","TopazPlus (Amiga 1200)"].map(f => (
                    <li key={f}><a className="ced-filelist" href="#">{f}</a></li>
                  ))}
                </ul>
              </div>
              <div className="req-button-container" style={{ marginBottom: "24px" }}>
                <div className="req-tight-border"><input className="tight" type="text" placeholder="SelectedFont" /></div>
              </div>
              <div className="req-button-container req-footer-spacing">
                <input type="button" className="req" value="OK" />
                <input type="button" className="req" value="Cancel" />
              </div>
            </div>
          </div></div></div>
        </div>

        {/* About */}
        <div className="req-container about-dialogue-width">
          <div className="req-title">CygnusEdd</div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <p className="req center-text">CygnusEdd Professional V4.20<br />Copyright 2016-2020 Up Rough &amp; Divine Stylers<br />Written by Fred, Origo and Spot<br /><br />Published by<br /><br />aSCIIaRENA<br />(www.asciiarena.se)</p>
              <div className="req-divider"></div>
              <div className="req-button-container">
                <div className="req-double-border center-align"><input className="req" value="Continue" type="button" /></div>
              </div>
            </div>
          </div></div></div>
        </div>

        {/* HippoScope */}
        <div className="req-container hipposcope-dialogue-width">
          <div className="req-title-padding">HippoScope</div>
          <div className="req-close-button"></div>
          <div className="req-cycle-gadget"></div>
          <div className="req-border-3"><div className="req-border-2"><div className="req-border-1">
            <div className="req-content nobottomborder">
              <div className="hipposcope">
                <div className="hippovu1"></div>
                <div className="hippovu2"></div>
                <div className="hippovu3"></div>
                <div className="hippovu4"></div>
                {[...Array(8)].map((_, i) => <pre key={i} className="black">28 E-2 1A02!B-2 1A02!C-2 1A02!D-3 1A02</pre>)}
              </div>
            </div>
          </div></div></div>
        </div>

      </div>
    </SiteLayout>
  );
}
