import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3001;
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(rootDir, "output");
const uploadDir = path.resolve(rootDir, "file");
const uploadPath = path.join(uploadDir, "MBA68-BA650.xlsx");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function clearOutput() {
  await fs.rm(outputDir, { recursive: true, force: true });
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      cwd: rootDir,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject({ error, stdout, stderr });
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject({ error: new Error(`Command failed: ${command}`), stdout, stderr });
      }
    });
  });
}

app.use(
  "/output",
  express.static(outputDir, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, _file, cb) => {
    cb(null, path.basename(uploadPath));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".xlsx") {
      cb(new Error("Only .xlsx files are supported."));
      return;
    }
    cb(null, true);
  },
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  try {
    console.log(
      `Uploaded file: ${req.file.originalname} (${req.file.size} bytes) -> ${req.file.path}`
    );
    await clearOutput();

    const parseResult = await runCommand("npm run parse");
    const analyzeResult = await runCommand("npm run analyze");

    const logs = [
      "=== Parse Output ===",
      parseResult.stdout || "(no stdout)",
      parseResult.stderr,
      "=== Analyze Output ===",
      analyzeResult.stdout || "(no stdout)",
      analyzeResult.stderr,
    ]
      .filter(Boolean)
      .join("\n");

    res.json({
      success: true,
      logs,
      outputFile: "output/frontend/bottleneck_dashboard.json",
    });
  } catch (err) {
    await clearOutput();

    const logs = [err?.stdout, err?.stderr].filter(Boolean).join("\n");
    res.status(500).json({
      error: err?.error?.message || err?.message || "Pipeline failed.",
      logs,
    });
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err?.message || "Upload failed." });
});

app.listen(port, () => {
  console.log(`Upload server listening on http://localhost:${port}`);
});
