import express from "express";
import cors from "cors";
import pino from "pino";
import { createClient } from "@supabase/supabase-js";

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*"
}));
app.use(express.json());

// ---- Supabase (service role no Railway) ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Healthcheck
app.get("/", (_, res) => res.send("API Carteira 4.9 ✅"));

// Criar/atualizar template
app.post("/wallet/templates", async (req, res) => {
  try {
    const { projectId, name, type, fields = {}, design = {} } = req.body;
    if (!projectId || !name || !type) {
      return res.status(400).json({ error: "projectId, name e type são obrigatórios" });
    }
    const { data, error } = await supabase
      .from("wallet.templates")
      .insert({ project_id: projectId, name, type, fields, design })
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (e) {
    log.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// Listar templates (por projeto)
app.get("/wallet/templates", async (req, res) => {
  try {
    const { projectId } = req.query;
    const q = supabase.from("wallet.templates").select("*").order("created_at", { ascending: false });
    const { data, error } = projectId ? await q.eq("project_id", projectId) : await q;
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    log.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// Emitir "passe" (registro) – geração real de Apple/Google entra depois
app.post("/wallet/passes", async (req, res) => {
  try {
    const { projectId, templateId, memberId, fields = {} } = req.body;
    if (!projectId || !templateId) {
      return res.status(400).json({ error: "projectId e templateId são obrigatórios" });
    }
    const { data, error } = await supabase
      .from("wallet.issued_passes")
      .insert({ project_id: projectId, template_id: templateId, member_id: memberId, fields, status: "active" })
      .select()
      .single();

    if (error) throw error;

    // MOCK de “links” temporários (quando você integrar Apple/Google, substitua aqui)
    const mock = {
      appleWallet: `https://seu-dominio/passes/${data.id}/apple.pkpass`,
      googleWallet: `https://seu-dominio/passes/${data.id}/google-save`
    };

    return res.json({ ...data, links: mock });
  } catch (e) {
    log.error(e);
    return res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => log.info(`🚀 API up on :${port}`));
