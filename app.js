import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import "./cron/checkDueTasks.js";


import "dotenv/config";

import sequelize from "./config/database.js";
import helmet from "helmet";
import "./models/User.js";
import "./models/Task.js";
import logger from "./utils/logger.js";
import setupSwagger from "./swagger.js";


// Configuring the express app
const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(compression());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (15 minutes)
	standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: "Too many requests from this IP, please try again later.",
  });

  // Apply rate limiting globally
  app.use(limiter);


// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

setupSwagger(app); // Setup Swagger

app.use("/api/auth",  authRoutes);
app.use("/api/tasks",  taskRoutes);
app.use("/api/profile", profileRoutes);


const startServer = async () => {
	try {
		console.log("🔄 Connecting to PostgreSQL...");
		await sequelize.authenticate();
		console.log("✅ PostgreSQL connected!");

		console.log("🔄 Syncing models...");
		await sequelize.sync({ alter: true });
		console.log("✅ Models synced!");

		const PORT = process.env.PORT || 5000;
		app.listen(PORT, () => {
			console.log(`🚀 Server listening on http://localhost:${PORT}`);
			logger.info(`Server started on http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error("❌ Failed to connect to DB or sync models:", err);
		logger.error("❌ DB Connection Error", err);
		process.exit(1); // Exit if DB fails
	}
};

startServer();
