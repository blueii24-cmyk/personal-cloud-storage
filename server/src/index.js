import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Listening on 0.0.0.0 (instead of the default localhost-only binding)
// is what lets other devices on your home network — like your phone —
// reach the server at http://<your-laptop-LAN-IP>:PORT. See the README
// for the security implications before doing this on an untrusted network.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
