import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import * as filesApi from "../services/filesApi.js";
import "./Breadcrumbs.css";

// There's no dedicated "ancestors" endpoint yet, so this walks up the
// parent chain one request per level. Fine for a personal drive's
// folder depth; a single backend round trip could replace this later
// if it's ever worth it.
export default function Breadcrumbs({ folderId, onNavigate }) {
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function buildTrail() {
      if (!folderId) {
        setTrail([]);
        return;
      }
      setLoading(true);
      const chain = [];
      let currentId = folderId;
      while (currentId) {
        const { file } = await filesApi.getFile(currentId);
        chain.unshift(file);
        currentId = file.parentFolderId;
      }
      if (!cancelled) setTrail(chain);
    }

    buildTrail()
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <button type="button" className="breadcrumbs__crumb" onClick={() => onNavigate(null)}>
        My Drive
      </button>
      {trail.map((folder) => (
        <span key={folder.id} className="breadcrumbs__segment">
          <ChevronRight size={14} className="breadcrumbs__sep" />
          <button
            type="button"
            className="breadcrumbs__crumb"
            onClick={() => onNavigate(folder.id)}
          >
            {folder.name}
          </button>
        </span>
      ))}
      {loading && <span className="breadcrumbs__loading">…</span>}
    </nav>
  );
}
