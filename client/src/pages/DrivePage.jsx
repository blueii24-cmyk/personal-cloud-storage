import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Header from "../components/Header.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import FileGrid from "../components/FileGrid.jsx";
import { useFiles } from "../hooks/useFiles.js";
import * as filesApi from "../services/filesApi.js";
import "./DrivePage.css";

export default function DrivePage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const { files, loading, error, refresh } = useFiles(folderId || null);

  const handleCreateFolder = useCallback(
    async (name, parentId) => {
      try {
        await filesApi.createFolder(name, parentId);
        refresh();
      } catch (err) {
        throw err;
      }
    },
    [refresh]
  );

  const handleRename = useCallback(
    async (file) => {
      const newName = prompt("New name:", file.name);
      if (!newName) return;
      try {
        await filesApi.renameFile(file.id, newName);
        refresh();
      } catch (err) {
        alert(err.message);
      }
    },
    [refresh]
  );

  const handleMove = useCallback(
    async (file) => {
      // Ask the user for a destination folder id (blank = root). This is a
      // minimal UI; it could be replaced by a proper folder picker later.
      const dest = prompt("Destination folder id (leave empty for root):");
      if (dest === null) return; // cancelled
      const destinationParentId = dest === "" ? null : dest;
      try {
        await filesApi.moveFile(file.id, destinationParentId);
        refresh();
      } catch (err) {
        alert(err.message);
      }
    },
    [refresh]
  );

  const handleOpenFolder = useCallback(
    (file) => navigate(`/drive/${file.id}`),
    [navigate]
  );

  const handleBreadcrumbNavigate = useCallback(
    (id) => navigate(id ? `/drive/${id}` : "/drive"),
    [navigate]
  );

  const handleUpload = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);
      try {
        await filesApi.uploadFiles(fileList, folderId || null);
        refresh();
      } catch (err) {
        // A proper toast/notification system can replace this later —
        // for now, surfacing the real error beats hiding a failed upload.
        alert(err.message);
      } finally {
        setUploading(false);
      }
    },
    [folderId, refresh]
  );

  const handleDelete = useCallback(
    async (file) => {
      try {
        await filesApi.deleteFile(file.id);
        refresh();
      } catch (err) {
        alert(err.message);
      }
    },
    [refresh]
  );

  return (
    <div className="drive-shell">
      <Sidebar onUpload={handleUpload} uploading={uploading} />
      <div className="drive-main">
        <Header viewMode={viewMode} onViewModeChange={setViewMode} onCreateFolder={handleCreateFolder} currentFolderId={folderId || null} />
        <Breadcrumbs folderId={folderId || null} onNavigate={handleBreadcrumbNavigate} />
        <FileGrid
          files={files}
          loading={loading}
          error={error}
          viewMode={viewMode}
          onOpenFolder={handleOpenFolder}
          onDelete={handleDelete}
          onUploadFiles={handleUpload}
          onRename={handleRename}
          onMove={handleMove}
        />
      </div>
    </div>
  );
}
