const { app, initialize } = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 3001;

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Gagal inisialisasi:", err);
  process.exit(1);
});
