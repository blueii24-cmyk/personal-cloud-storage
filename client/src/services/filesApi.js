import { api, API_BASE_URL } from "./api.js";

export function listFiles(parentFolderId) {
  const query = parentFolderId ? `?parentFolderId=${encodeURIComponent(parentFolderId)}` : "";
  return api.get(`/files${query}`);
}

export function getFile(id) {
  return api.get(`/files/${id}`);
}

export function deleteFile(id) {
  return api.delete(`/files/${id}`);
}

export function uploadFiles(fileList, parentFolderId) {
  const formData = new FormData();
  Array.from(fileList).forEach((file) => formData.append("files", file));
  if (parentFolderId) formData.append("parentFolderId", parentFolderId);
  return api.post("/files/upload", formData);
}

export function createFolder(name, parentFolderId) {
  return api.post("/files/folders", { name, parentFolderId: parentFolderId || null });
}

export function renameFile(id, newName) {
  return api.patch(`/files/${encodeURIComponent(id)}/rename`, { name: newName });
}

export function moveFile(id, destinationParentId) {
  return api.post(`/files/${encodeURIComponent(id)}/move`, { destinationParentId: destinationParentId || null });
}

// Not a fetch call — this is a direct URL for an <a> tag. The browser's
// normal navigation includes the auth cookie (sameSite: "lax" allows
// it on top-level GETs), so the server's Content-Disposition header
// drives a real download with the right filename.
export function getDownloadUrl(id) {
  return `${API_BASE_URL}/files/${id}/download`;
}
