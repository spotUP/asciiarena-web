import SiteLayout from "@/components/layout/SiteLayout";

export default function AboutPage() {
  return (
    <SiteLayout title="ABOUT">
      <div className="container-fluid apb-1">
        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">aSCIIaRENA</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <p>
            <span className="white">Code by</span>{" "}
            <span className="cyan">Burps, Nicomen, Phantasm, Spot, Ziphoid</span>
          </p>
          <p>
            <span className="white">Concept/UI/HTML/CSS by</span>{" "}
            <span className="cyan">Spot</span>
          </p>
          <p>
            <span className="cyan">
              aSCIIaRENA is using a modified BOOTSTRA.386 bootstrap theme by Kristopolous
            </span>
          </p>
          <p>
            <span className="cyan">Thanks to TZ and Hamlet for their contributions</span>
          </p>
        </div>

        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">HiPPOPLAYER ONLiNE</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <span className="cyan">Code by Mike-TAWS</span>
        </div>

        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">ADMiNS</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <span className="cyan">Dino, Dipswitch, dMG, h7, Ne7, Skope, Spot, Yonx, Zito</span>
        </div>

        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">FOLLOW</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <span className="white bg-blue ap-1">
            <a href="https://www.facebook.com/asciiarena" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </span>
        </div>

        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">CHAT</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <span className="white bg-lightblue ap-1">
            <a href="https://discord.gg/gwHPVHZXAz" target="_blank" rel="noreferrer">
              Discord
            </a>
          </span>
          <p className="apt-1">
            <span className="cyan">You can also reach us on IRCNet in #asciiarena</span>
          </p>
        </div>

        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">SOURCE</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <p>
            GitHub:{" "}
            <a
              href="https://github.com/spotUP/asciiarena"
              target="_blank"
              rel="noreferrer"
            >
              spotUP/asciiarena
            </a>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
