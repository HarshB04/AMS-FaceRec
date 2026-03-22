import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useSeeder } from "./hooks/useSeeder";

function AppInner() {
  useSeeder();
  return <RouterProvider router={router} />;
}

export default function App() {
  return <AppInner />;
}
