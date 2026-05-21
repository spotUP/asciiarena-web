"use client";

interface Props {
  collyId: number;
}

export default function UnfaveButton({ collyId }: Props) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const res = await fetch(`/api/collys/${collyId}/favourites`, { method: "DELETE" });
    const d = await res.json();
    if (d.status === true) {
      (e.currentTarget.closest(".row") as HTMLElement | null)?.style.setProperty("display", "none");
    }
  };

  return (
    <button className="btn-big" onClick={handleClick}>
      Remove
    </button>
  );
}
