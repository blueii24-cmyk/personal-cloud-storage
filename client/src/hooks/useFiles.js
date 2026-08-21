import { useState, useEffect, useCallback } from "react";
import * as filesApi from "../services/filesApi.js";

export function useFiles(parentFolderId) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    filesApi
      .listFiles(parentFolderId)
      .then((data) => setFiles(data.files))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parentFolderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { files, loading, error, refresh };
}
