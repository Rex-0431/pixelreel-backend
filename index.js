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
  const duration = req.body.duration || 3; // default 3 sec

  const outputPath = "output.mp4";

  ffmpeg(inputPath)
    .loop(duration)
    .outputOptions("-pix_fmt yuv420p")
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
