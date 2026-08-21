import { useCallback, useState } from "react";
import FileItem from "./FileItem.jsx";
import "./FileGrid.css";

export default function FileGrid({
  files,
  loading,
  error,
  viewMode,
  onOpenFolder,
  onDelete,
  onUploadFiles,
  onRename,
  onMove,
}) {
  const [isDraggingOver, setDraggingOver] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDraggingOver(false);
      if (e.dataTransfer.files?.length) {
        onUploadFiles(e.dataTransfer.files);
      }
    },
    [onUploadFiles]
  );

  return (
    <div
      className={`file-grid-area ${isDraggingOver ? "file-grid-area--dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDraggingOver(true);
      }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={handleDrop}
    >
      {loading && <p className="file-grid-status">Loading…</p>}
      {error && <p className="file-grid-status file-grid-status--error">{error}</p>}

      {!loading && !error && files.length === 0 && (
        <div className="file-grid-empty">
          <p>Nothing here yet.</p>
          <p className="file-grid-empty__hint">Drag files in, or use Upload.</p>
        </div>
      )}

      {!loading && !error && files.length > 0 && (
        <div className={viewMode === "grid" ? "file-grid file-grid--grid" : "file-grid file-grid--list"}>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              onOpen={() => file.isFolder && onOpenFolder(file)}
              onDelete={() => onDelete(file)}
              onRename={() => onRename && onRename(file)}
              onMove={() => onMove && onMove(file)}
            />
          ))}
        </div>
      )}

      {isDraggingOver && <div className="file-grid-drop-overlay">Drop to upload</div>}
    </div>
  );
}
