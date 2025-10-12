import express, { Application, Request, Response } from "express";
import cors from "cors";
// import { UserRoutes } from "./modules/user/userRoutes";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewears/globalErrorHandler";
import { authRoutes } from "./modules/auth/authRoutes";
// import { UserRoutes } from "./modules/users/userRoutes";
// import { CategoryRoutes } from "./modules/category/categoryRoutes";
// import { BookRoutes } from "./modules/books/bookRoutes";
// import { OrderRoutes } from "./modules/orders/orderRoutes";
const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", authRoutes);
// app.use("/api/v1", UserRoutes);
// app.use("/api/v1", CategoryRoutes);
// app.use("/api/v1", BookRoutes);
// app.use("/api/v1", OrderRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
// error handler
app.use(globalErrorHandler);

export default app;
