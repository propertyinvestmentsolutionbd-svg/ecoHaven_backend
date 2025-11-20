import express, { Application, Request, Response } from "express";
import cors from "cors";
// import { UserRoutes } from "./modules/user/userRoutes";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewears/globalErrorHandler";
import { authRoutes } from "./modules/auth/authRoutes";
import { menuRoutes } from "./modules/menu/menuRoutes";
import { permissionRoutes } from "./modules/menu/permissionRoutes";
import { contactRoutes } from "./modules/contact/contactRoutes";
import { projectRoutes } from "./modules/projects/projectRoutes";
import path from "path";

const app: Application = express();

// app.use(cors());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "http://127.0.0.1:3000",
//       "http://localhost:3001", // if using different port
//     ],
//     credentials: true, // Important for cookies/auth
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "Accept",
//       "Origin",
//     ],
//   })
// );
// For development only - remove in production
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1", authRoutes);
app.use("/api/v1", projectRoutes);
app.use("/api/v1", menuRoutes);
app.use("/api/v1", permissionRoutes);
app.use("/api/v1", contactRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
// error handler
app.use(globalErrorHandler);

export default app;
