import SiteLayout from "@/components/layout/SiteLayout";

export default function NotFound() {
  return (
    <SiteLayout>
      <div className="row">
        <div className="col-lg-12">
          <div className="bs-component aml-1 amb-1">
            <div className="alert alert-danger">404 - Page not found</div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
