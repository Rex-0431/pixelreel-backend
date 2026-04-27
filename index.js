import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/generate-video", upload.single("image"), (req, res) => {
  try {
    const inputPath = req.file.path;
    const duration = parseInt(req.body.duration) || 3;
    const instructions = (req.body.instructions || "").toLowerCase();

    const outputPath = "output.mp4";

    // 🎯 Build filters from instructions
    let filters = [];

    if (instructions.includes("zoom")) {
      filters.push("zoompan=z='min(zoom+0.0015,1.5)':d=125");
    }

    if (instructions.includes("black and white")) {
      filters.push("hue=s=0");
    }

    if (instructions.includes("bright")) {
      filters.push("eq=brightness=0.1");
    }

    const filterString = filters.length ? filters.join(",") : null;

    // 🎬 FFmpeg command
    let command = ffmpeg()
      .input(inputPath)
      .inputOptions(["-loop 1"])
      .outputOptions([
        `-t ${duration}`,
        "-vf scale=640:480",
        "-pix_fmt yuv420p"
      ]);

    if (filterString) {
      command = command.videoFilters(filterString);
    }

    command
      .output(outputPath)
      .on("end", () => {
        res.download(outputPath, () => {
          // cleanup files after sending
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .on("error", (err) => {
        console.log("FFMPEG ERROR:", err);
        res.status(500).send("Video generation failed");
      })
      .run();

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

app.listen(5000, () => console.log("Server running on 5000"));
