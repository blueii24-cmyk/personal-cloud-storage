import { Folder, FileText, Image as ImageIcon, Music, Video, File as FileIcon, Download, Trash2 } from "lucide-react";
import { getDownloadUrl } from "../services/filesApi.js";
import { formatBytes, formatDate } from "../utils/format.js";
import "./FileItem.css";

function TypeIcon({ isFolder, mimeType, size }) {
  if (isFolder) return <Folder size={size} />;
  if (!mimeType) return <FileIcon size={size} />;
  if (mimeType.startsWith("image/")) return <ImageIcon size={size} />;
  if (mimeType.startsWith("video/")) return <Video size={size} />;
  if (mimeType.startsWith("audio/")) return <Music size={size} />;
  if (mimeType === "application/pdf") return <FileText size={size} />;
  return <FileIcon size={size} />;
}

export default function FileItem({ file, viewMode, onOpen, onDelete, onRename, onMove }) {
  const isFolder = file.isFolder;
  const iconSize = viewMode === "grid" ? 26 : 18;

  return (
    <div
      className={`file-item file-item--${viewMode} ${isFolder ? "file-item--folder" : ""}`}
      role="button"
      tabIndex={0}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (isFolder && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
    >
      <div className="file-item__tab" aria-hidden="true" />

      <div className="file-item__icon">
        <TypeIcon isFolder={isFolder} mimeType={file.mimeType} size={iconSize} />
      </div>

      <div className="file-item__meta">
        <div className="file-item__name" title={file.name}>
          {file.name}
        </div>
        <div className="file-item__sub">
          {isFolder ? "Folder" : formatBytes(file.size)} · {formatDate(file.updatedAt)}
        </div>
      </div>

      <div className="file-item__actions">
        {!isFolder && (
          <a
            className="file-item__action"
            href={getDownloadUrl(file.id)}
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={15} />
          </a>
        )}

        <button
          type="button"
          className="file-item__action"
          title="Rename"
          onClick={(e) => {
            e.stopPropagation();
            onRename && onRename();
          }}
        >
          ✏️
        </button>

        <button
          type="button"
          className="file-item__action"
          title="Move"
          onClick={(e) => {
            e.stopPropagation();
            onMove && onMove();
          }}
        >
          ↪️
        </button>

        <button
          type="button"
          className="file-item__action file-item__action--danger"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
