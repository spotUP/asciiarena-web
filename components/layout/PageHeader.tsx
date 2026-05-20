import Script from "next/script";

export type PageHeaderProps = {
  title: string | string[];
};

export default function PageHeader({ title }: PageHeaderProps) {
  const isArray = Array.isArray(title);

  return (
    <>
      <div className="page-header">
        <div className="row ml-0 pl-0 mr-0 pr-0">
          <div className="col-12">
            <h1
              className={`bg-header ap-1${isArray ? " switcher" : ""}`}
              style={{ minHeight: "16px" }}
            >
              {isArray
                ? (title as string[]).map((t, i) => (
                    <span key={i} style={i > 0 ? { display: "none" } : {}}>
                      {t}
                    </span>
                  ))
                : <span>{title as string}</span>}
            </h1>
          </div>
        </div>
      </div>
      {isArray && (
        <Script id="page-header-switcher" strategy="afterInteractive">{`
          (function poll() {
            if (typeof window.switcharoo === "function") {
              window.switcharoo(".switcher > span", 2890);
            } else {
              setTimeout(poll, 50);
            }
          })();
        `}</Script>
      )}
    </>
  );
}
