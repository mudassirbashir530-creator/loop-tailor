import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/app/routes";

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}
