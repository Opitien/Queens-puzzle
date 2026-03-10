import { createBrowserRouter } from "react-router";
import { QueensGambitLab } from "./components/QueensGambitLab";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: QueensGambitLab,
  },
]);
