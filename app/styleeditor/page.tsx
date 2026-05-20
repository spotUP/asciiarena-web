import { auth } from "@/lib/auth";
import SiteLayout from "@/components/layout/SiteLayout";
import StyleEditorClient from "./StyleEditorClient";

export default async function StyleEditorPage() {
  const session = await auth();

  return (
    <SiteLayout title="ASCII STYLE DESIGNER">
      {session?.user ? (
        <StyleEditorClient userNick={session.user.name ?? ""} userId={parseInt(session.user.id ?? "0")} />
      ) : (
        <div className="col-lg-12">
          <div className="bs-component">
            <div className="animate__animated animate__shakeX alert alert-dismissible alert-primary">
              <button type="button" className="close" data-dismiss="alert">x</button>
              You need to be{" "}
              <a className="ascii" data-toggle="modal" style={{ paddingRight: "8px" }} href="#login">
                logged in
              </a>
              to use this feature.
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
