import { useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, FolderOpen, Star, Trash2, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import StorageMeter from "./StorageMeter.jsx";
import "./Sidebar.css";

export default function Sidebar({ onUpload, uploading }) {
  const inputRef = useRef(null);
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">Vault</span>
      </div>

      <button
        type="button"
        className="sidebar__upload"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload size={18} />
        {uploading ? "Uploading…" : "Upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          onUpload(e.target.files);
          e.target.value = "";
        }}
      />

      <nav className="sidebar__nav">
        <Link className="sidebar__nav-item is-active" to="/drive">
          <FolderOpen size={18} /> My Drive
        </Link>
        {/* Starred and Trash are UI-only for now — the endpoints they'd
            call don't exist yet, so these are deliberately non-interactive
            rather than pretending to work. */}
        <span className="sidebar__nav-item is-disabled" title="Coming in a later phase">
          <Star size={18} /> Starred
        </span>
        <span className="sidebar__nav-item is-disabled" title="Coming in a later phase">
          <Trash2 size={18} /> Trash
        </span>
      </nav>

      <div className="sidebar__footer">
        <StorageMeter />
        <div className="sidebar__user">
          <span className="sidebar__username">{user?.username}</span>
          <button type="button" className="sidebar__logout" onClick={logout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
