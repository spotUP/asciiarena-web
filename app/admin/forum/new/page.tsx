import BoardFormClient from "@/app/admin/forum/BoardFormClient";

export const dynamic = "force-dynamic";

export default function AdminNewBoard() {
  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">NEW BOARD</h2>
      </div>
      <BoardFormClient />
    </>
  );
}
