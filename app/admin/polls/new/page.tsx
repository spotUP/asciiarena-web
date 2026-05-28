import PollFormClient from "../PollFormClient";

export default function NewPollPage() {
  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">NEW POLL</h2>
      </div>
      <PollFormClient />
    </>
  );
}
