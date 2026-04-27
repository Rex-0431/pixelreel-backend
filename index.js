import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/generate-video", upload.single("image"), (req, res) => {
  const inputPath = req.file.path;
  const duration = parseInt(req.body.duration) || 3;
  const instructions = (req.body.instructions || "").toLowerCase();

  const outputPath = "output.mp4";

  // 🎯 Apply simple effects based on instructions
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

  let command = ffmpeg(inputPath)
    .loop(duration)
    .outputOptions("-pix_fmt yuv420p");

  if (filterString) {
    command = command.videoFilters(filterString);
  }

  command
    .output(outputPath)
    .on("end", () => {
      res.download(outputPath);
    })
    .on("error", (err) => {
      console.log(err);
      res.status(500).send("Error generating video");
    })
    .run();
});

app.listen(5000, () => console.log("Server running on 5000"));
