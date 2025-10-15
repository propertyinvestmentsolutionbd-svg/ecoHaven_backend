import express, { Application, Request, Response } from "express";
import cors from "cors";
// import { UserRoutes } from "./modules/user/userRoutes";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewears/globalErrorHandler";
import { authRoutes } from "./modules/auth/authRoutes";
import { menuRoutes } from "./modules/menu/menuRoutes";
import { permissionRoutes } from "./modules/menu/permissionRoutes";

const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", authRoutes);
app.use("/api/v1", menuRoutes);
app.use("/api/v1", permissionRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
// error handler
app.use(globalErrorHandler);

export default app;
