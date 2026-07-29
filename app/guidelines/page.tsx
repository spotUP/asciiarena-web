import type { Metadata } from "next";
import ContentLink from "@/components/ui/ContentLink";
import SiteLayout from "@/components/layout/SiteLayout";

export const metadata: Metadata = {
  title: "Colly Guidelines | aSCIIaRENA",
  description: "There are no rules — make your colly however you want. Optional ways to help asciiarena read your logos, index and add a soundtrack.",
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
          <p className="white" style={{ fontSize: "18px" }}>There are no rules. Make your colly however you want.</p>
          <p className="lightgrey">
            Draw your logos, indexes and dividers in whatever style you like — that&apos;s the
            whole point of the scene, and a world where every colly looked the same would be a
            boring one. None of this page is required. It just explains how asciiarena tries to
            be helpful, and how you can make it perfect when you care to.
          </p>

          <H>Two ways it works</H>
          <p className="lightgrey">
            <span className="cyan">1. We read it for you.</span> asciiarena auto-detects logos,
            dedications and indexes in many common scene styles, so most collys just work with
            zero effort — upload and go.
          </p>
          <p className="lightgrey">
            <span className="cyan">2. You point at it.</span> If your art is unusual, or you
            want everything pixel-perfect, open the{" "}
            <ContentLink href="/submit" className="magenta">colly tester</ContentLink>, drop your file,
            and click the line of each logo. That works no matter how wild the layout is — you
            are never forced into a format. The tester shows exactly what we detected and flags
            anything we missed. Nothing is uploaded.
          </p>

          <H>What auto-detection happens to recognise</H>
          <p className="lightgrey">
            These are <span className="white">examples</span>, not requirements — handy if you
            want detection to do the work, ignorable if you&apos;d rather just tag in the tester:
          </p>
          <ul className="lightgrey">
            <li>A logo with its name on a nearby line (a caption / signature) is detected and
              named. No caption? It still renders — it just shows as &quot;Logo N&quot; and won&apos;t
              be searchable unless you name it in the tester.</li>
            <li>A name after <span className="white">for</span> / <span className="white">4</span> /{" "}
              <span className="white">2</span> / <span className="white">to</span> (e.g.{" "}
              <span className="white">myLogo for spot</span>) is read as the recipient, so the
              logo isn&apos;t mistaken for two.</li>
            <li>A numbered index in the classic <span className="white">o1&gt; NAME</span> style
              becomes clickable jump links. Drew your contents some other way? Map those logos
              in the tester instead — your index, your style.</li>
          </ul>

          <H>Make it yours: font, colours &amp; a soundtrack</H>
          <p className="lightgrey">
            Optionally give your colly a preferred font, text/background colours, and a{" "}
            <span className="white">soundtrack</span> — any tune from Modland plays while people
            view it. Set these in the tester or on the submit form. Your choices are the
            colly&apos;s initial look (a viewer can still recolour it live); the soundtrack starts
            on the viewer&apos;s first click and never interrupts music they&apos;re already playing.
          </p>

          <H>Where the settings live (invisible, never in your art)</H>
          <p className="lightgrey">
            Font / colours / soundtrack / an exact logo map can ride <span className="white">inside
            the file, after a Ctrl-Z (EOF) byte</span> — invisible in every viewer, the same trick
            the scene&apos;s SAUCE records use. We read a <span className="white">SAUCE</span> record
            if your editor wrote one, or simple <span className="white">key: value</span> lines.
            The submit form writes them for you when you save, so you never touch a byte by
            hand. (We also still read an embedded{" "}
            <span className="white">@BEGIN_FILE_ID.DIZ … @END_FILE_ID.DIZ</span> block.) Or skip
            the file entirely and just set everything on the submit form — your call.
          </p>

          <p className="lightgrey amt-1">
            <a href="/example-arena-colly.txt" className="magenta" download>Download an example</a>{" "}
            to poke at, <ContentLink href="/submit" className="magenta">test your colly</ContentLink>, or{" "}
            <ContentLink href="/submit" className="magenta">submit one</ContentLink>.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
