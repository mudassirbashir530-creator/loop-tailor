import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/app/layouts/AppLayout";
import { WebsiteLayout } from "@/app/layouts/WebsiteLayout";
import { LoginPage } from "@/app/pages/auth/LoginPage";
import { SignupPage } from "@/app/pages/auth/SignupPage";
import { NotFound } from "@/app/pages/NotFound";
import { AboutPage } from "@/app/pages/website/AboutPage";
import { ContactPage } from "@/app/pages/website/ContactPage";
import { LandingPage } from "@/app/pages/website/LandingPage";
import { PricingPage } from "@/app/pages/website/PricingPage";
import { Clients } from "@/app/screens/Clients";
import { Home } from "@/app/screens/Home";
import { NewOrder } from "@/app/screens/NewOrder";
import { Orders } from "@/app/screens/Orders";
import { Settings } from "@/app/screens/Settings";

export const router = createBrowserRouter([
  {
    element: <WebsiteLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
    ],
  },
  { path: "/auth/login", element: <LoginPage /> },
  { path: "/auth/signup", element: <SignupPage /> },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "clients", element: <Clients /> },
      { path: "orders", element: <Orders /> },
      { path: "new-order", element: <NewOrder /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
