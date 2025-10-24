import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// rota de teste
app.get("/", (req, res) => {
  res.send("✅ Servidor PassKit rodando com sucesso!");
});

// porta dinâmica para Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
