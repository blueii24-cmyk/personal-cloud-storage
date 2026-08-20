// Builds a Content-Disposition header that works for both plain-ASCII
// and Unicode filenames, without letting a crafted filename break the
// header (e.g. via quotes or newlines).
export function contentDispositionHeader(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
