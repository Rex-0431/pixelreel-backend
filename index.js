import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const REPLICATE_API_TOKEN = "r8_1Sg1ZABHpD2xO57osbfXhCJ6MhuN9bj3Cm6zx";

app.post("/generate-video", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.instructions || "cinematic video";
    const duration = parseInt(req.body.duration) || 5;

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    // STEP 1: Start prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a40e0c5f4e3d2e0cbbf0e6a6c5c4c3b2e1f0d9c8b7a6", 
        input: {
          image: `data:image/png;base64,${base64Image}`,
          prompt: prompt,
          num_frames: duration * 8
        }
      })
    });

    let prediction = await response.json();

    // STEP 2: Poll until ready
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(r => setTimeout(r, 3000));

      const poll = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`
        }
      });

      prediction = await poll.json();
    }

    if (prediction.status === "succeeded") {
      res.json({ video: prediction.output[0] });
    } else {
      res.status(500).json({ error: "Video generation failed" });
    }

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.listen(5000, () => console.log("AI video backend running"));
