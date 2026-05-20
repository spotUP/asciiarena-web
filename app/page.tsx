import SiteLayout from "@/components/layout/SiteLayout";

export default async function HomePage() {
  return (
    <SiteLayout
      title={["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"]}
    >
      <div className="container-fluid apb-1">
        <p className="text-center cyan apt-1">The ASCII art archive.</p>
      </div>
    </SiteLayout>
  );
}
