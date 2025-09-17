import express from "express";
import cors from "cors";
import os from "os";

import { config } from "./config.js";
import authRoute from "./router/auth-router.js";
import contactRoute from "./router/contact-router.js";
import adminRoute from "./router/admin-router.js";
import usersRoute from "./router/users-router.js";
import connectDB from "./utils/db.js";
import errorMiddleware from "./middlewares/error-middleware.js";
import { startQuizCron } from './utils/cronJobs.js';
import { checkWithdrawalAccountExists } from "./controllers/admin-controller.js";

const PORT = config.port;

const app = express();

// Updated CORS configuration to allow requests from both local development and production
const corsOptions = {
  origin: [
    'http://localhost:3000',         // Next.js development server
    'http://127.0.0.1:3000',         // Alternative localhost format
    'https://mlm-sigma.vercel.app',         // Alternative localhost format
    'https://www.leveluptrade.us',         // Alternative localhost format
    'https://leveluptrade.us',         // Alternative localhost format
    config.frontendUrl,              // Production URL from config
    'https://uptradelevel.com'
  ],
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/server-stats", (req, res) => {
  res.json({
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    usedMemory: os.totalmem() - os.freemem(),
    cpuCount: os.cpus().length,
    platform: os.platform(),
    arch: os.arch(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    networkInterfaces: os.networkInterfaces(),
    loadavg: os.loadavg(),
    release: os.release(),
    version: os.version(),
  });
});

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/form", contactRoute);
app.use("/api/admin", adminRoute);
app.use("/api/users", usersRoute);
app.use(errorMiddleware);

connectDB()
.then(() => {
  startQuizCron();
  checkWithdrawalAccountExists()
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});