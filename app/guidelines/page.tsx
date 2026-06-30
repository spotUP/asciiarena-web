import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";

export const metadata: Metadata = {
  title: "Colly Guidelines | aSCIIaRENA",
  description: "How to format your colly so asciiarena reads every logo, requester, index and soundtrack — while keeping full artistic freedom.",
};

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="ap-1 bg-header amt-1">{children}</h2>;
}

export default function GuidelinesPage() {
  return (
    <SiteLayout title="GUIDELINES">
      <div className="container-fluid apb-1">
        <div className="row apt-1"><div className="col-lg-12">
          <h2 className="ap-1 bg-header">cOLLY gUIDELINES</h2>
        </div></div>

        <div className="col-lg-12 apt-1" style={{ maxWidth: "920px" }}>
          <p className="white">Style your art however you like.</p>
          <p className="lightgrey">
            None of this is required and there is no template. asciiarena already reads
            free-form collys — these notes just help us pick out your logo names, who they
            were for, the index, and let you set a font, colours and a soundtrack. The more
            you follow, the more our features light up; ignore all of it and your colly still
            works.
          </p>
          <p className="lightgrey">
            Want to see exactly how we read yours? Run it through the{" "}
            <Link href="/submit/test" className="magenta">colly tester</Link> — it shows the
            detected logos, requesters, index, colours and soundtrack, and flags anything we
            missed. Nothing is uploaded.{" "}
            <a href="/example-arena-colly.txt" className="magenta" download>Download the example colly</a>{" "}
            to poke at.
          </p>

          <H>Naming a logo</H>
          <p className="lightgrey">
            Put the logo&apos;s name on its own line in the blank gap above the art —{" "}
            <span className="white">uP rOUGH</span>, or <span className="white">NAME : artist</span>.
            Leave a blank line between the caption and the art. Uncaptioned logos still render,
            but show as &quot;Logo N&quot; and aren&apos;t searchable.
          </p>

          <H>Who it was for (requesters / dedications)</H>
          <p className="lightgrey">
            Write <span className="white">LOGO for SPOT</span> (or <span className="white">4</span>,{" "}
            <span className="white">2</span>, <span className="white">to</span>). The logo is
            indexed under its own name; the name after &quot;for&quot; is recorded as the
            recipient, not as a second logo.
          </p>

          <H>A clickable index</H>
          <p className="lightgrey">
            If you draw a table of contents, use <span className="white">o1&gt; NAME</span> entries
            (the &quot;o&quot; doubles as zero; two columns are fine):
          </p>
          <pre className="cyan ap-1" style={{ background: "#000", lineHeight: "16px" }}>{`  o1> STATiC DESC        o4> REMEDY
  o2> ATTENTiON          o5> MYSTiC
  o3> REViSiON           o6> TWiLiGHT`}</pre>
          <p className="lightgrey">Those entries become links that scroll straight to each logo.</p>

          <H>Wild art? Map your logos exactly</H>
          <p className="lightgrey">
            If your colly is too freeform for auto-detection, pin each logo to a line yourself
            in the tester (click the line numbers) — autoplay, the index, the minimap and jumps
            then land perfectly, no matter how chaotic the art. Everyone else can just let
            detection do it.
          </p>

          <H>Font, colours &amp; a soundtrack</H>
          <p className="lightgrey">
            You can set a preferred font, text/background colours, and a{" "}
            <span className="white">soundtrack</span> (any tune from Modland) for your colly.
            Set them in the tester or on the submit form. Your choices are the colly&apos;s
            initial look — a viewer can still recolour it live. The soundtrack starts on the
            viewer&apos;s first click (and never interrupts music they already have playing).
          </p>

          <H>Invisible tags (optional, never in your art)</H>
          <p className="lightgrey">
            All of the above (font / colours / soundtrack / logo map) can travel inside the
            file itself, carried <span className="white">after a Ctrl-Z (EOF)</span> byte so it
            is invisible in every viewer — exactly how the scene&apos;s SAUCE records work. We
            read a <span className="white">SAUCE</span> record if your tool wrote one, or simple{" "}
            <span className="white">key: value</span> lines. The tester&apos;s &quot;Download
            tagged colly&quot; writes them for you. We also still read an embedded{" "}
            <span className="white">@BEGIN_FILE_ID.DIZ … @END_FILE_ID.DIZ</span> block.
          </p>
          <pre className="lightgrey ap-1" style={{ background: "#000", lineHeight: "16px" }}>{`(after a Ctrl-Z at the very end of the file:)
font: A1200 Topaz+
fg: #55ff55
soundtrack: Protracker/4-Mat/madness.mod
logo: 8 STATiC for NEXUS
logo: 22 up rough`}</pre>

          <p className="lightgrey amt-1">
            That&apos;s it. <Link href="/submit/test" className="magenta">Test your colly</Link>{" "}
            or <Link href="/submit" className="magenta">submit one</Link>.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
