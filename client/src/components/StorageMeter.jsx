import "./StorageMeter.css";

// Storage usage isn't computed by the backend yet (that's a later
// phase). Rather than fake a number, this stays honest about what it
// is: a placeholder that shows where the real meter will go.
export default function StorageMeter() {
  return (
    <div className="storage-meter" title="Storage usage — coming in a later phase">
      <div className="storage-meter__track">
        <div className="storage-meter__fill" />
      </div>
      <span className="storage-meter__label">Storage usage coming soon</span>
    </div>
  );
}
