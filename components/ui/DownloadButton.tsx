"use client";

interface Props {
  fileUrl: string;
  filename: string;
  apiUrl: string;
}

export default function DownloadButton({ fileUrl, filename, apiUrl }: Props) {
  function handleDownload() {
    fetch(apiUrl, { method: "POST" }).catch(() => {});
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <input
      type="button"
      className="btn-big"
      value="Download"
      onClick={handleDownload}
    />
  );
}
