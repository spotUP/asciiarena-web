// Pure helpers for HippoPlayer playlist files. Kept free of any DB import so it
// stays unit-testable without a database connection.

// hippo_playlists.filedata is stored as a data URL
// ("data:application/octet-stream;base64,<...>"). Strip the prefix and return
// the raw file bytes.
export function decodePlaylistData(filedata: string): Buffer {
  const base64 = filedata.replace("data:application/octet-stream;base64,", "");
  return Buffer.from(base64, "base64");
}
