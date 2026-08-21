import { Search, LayoutGrid, List } from "lucide-react";
import "./Header.css";

export default function Header({ viewMode, onViewModeChange, onCreateFolder, currentFolderId }) {
  return (
    <header className="app-header">
      {/* Backend search is a later phase — left visibly disabled rather
          than wired to a fake client-side filter. */}
      <div className="app-header__search" title="Search — coming in a later phase">
        <Search size={16} />
        <input type="text" placeholder="Search in Drive" disabled />
      </div>

      <div className="app-header__view-actions">
        <button
          type="button"
          className="app-header__new-folder"
          onClick={async () => {
            const name = prompt("Folder name:");
            if (!name) return;
            try {
              if (onCreateFolder) await onCreateFolder(name, currentFolderId || null);
            } catch (err) {
              alert(err.message);
            }
          }}
        >
          New folder
        </button>
      </div>

      <div className="app-header__view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={viewMode === "grid" ? "is-active" : ""}
          onClick={() => onViewModeChange("grid")}
          title="Grid view"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          className={viewMode === "list" ? "is-active" : ""}
          onClick={() => onViewModeChange("list")}
          title="List view"
        >
          <List size={16} />
        </button>
      </div>
    </header>
  );
}
