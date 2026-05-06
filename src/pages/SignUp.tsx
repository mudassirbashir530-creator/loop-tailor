import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Star,
  Shield,
  Zap,
  BadgeCheck,
  Globe,
  Camera,
  MapPin,
  Store,
  X,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { useImageUpload } from "../hooks/useImageUpload";
import { normalizePlanStatus } from "../lib/planUtils";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const planParam = normalizePlanStatus(searchParams.get("plan"));

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "ur">("en");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileUpload = useImageUpload();
  const logoUpload = useImageUpload();

  const { signUp, user } = useAuth();
  const { t, isRTL, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleNext = () => {
    if (!name || !phone || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
      return;
    }

    if (!shopName) {
      setError("Shop name is required.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Generate a unique path ID for uploads since we don't have the UID yet.
      // We use the sanitized email prefix + timestamp.
      const pathUserId =
        email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + "_" + Date.now();

      let photoURL = "";
      if (profileUpload.file) {
        photoURL =
          (await profileUpload.uploadToStorage(
            `profiles/${pathUserId}/avatar_${Date.now()}.jpg`,
          )) || "";
      }

      let shopLogoUrl = "";
      if (logoUpload.file) {
        shopLogoUrl =
          (await logoUpload.uploadToStorage(
            `shops/${pathUserId}/logo_${Date.now()}.jpg`,
          )) || "";
      }

      await signUp(
        email,
        password,
        name,
        phone,
        selectedLanguage,
        photoURL,
        shopName,
        shopLogoUrl,
        shopAddress,
        selectedPlan || undefined
      );
      await setLanguage(selectedLanguage);
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isUploading = profileUpload.uploading || logoUpload.uploading;

  return (
    <div
      className={cn("auth-page", selectedLanguage === "ur" && "font-urdu")}
      dir={selectedLanguage === "ur" ? "rtl" : "ltr"}
    >
      {/* Language Toggle */}
      <button
        onClick={() => {
          const nextLang = selectedLanguage === 'en' ? 'ur' : 'en';
          setSelectedLanguage(nextLang);
          setLanguage(nextLang);
        }}
        className="lang-btn"
      >
        {selectedLanguage === 'en' ? 'اردو' : 'English'}
      </button>

      <div className="auth-card">
        <Link to="/">
          <img src="/logo.png" alt="Loop Tailor Logo" className="auth-logo" />
        </Link>

        {selectedPlan && step === 1 && (
          <div className="mb-4 w-full p-3 rounded-xl bg-[#2ECC71]/10 text-[#0D3D33] text-sm font-bold border border-[#2ECC71] text-center">
            You've selected the {selectedPlan.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())} plan
          </div>
        )}

        <h2 className="auth-title">
          {step === 1 ? t("auth.createAccount") : "Shop Info"}
        </h2>
        <p className="auth-subtitle">
          {step === 1 ? "Please log in or create an account to start your subscription." : "Tell us about your business"}
          <span className="block mt-1 text-xs text-[#2ECC71]">Step {step} of 2</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center justify-center mb-2">
                  <label className="relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && profileUpload.selectFile(e.target.files[0])}
                    />
                    <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-[#E2DDD6]">
                      {profileUpload.preview ? (
                        <img src={profileUpload.preview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-gray-400 h-6 w-6" />
                      )}
                    </div>
                  </label>
                  {profileUpload.error && (
                    <p className="text-red-500 text-xs mt-1">{profileUpload.error}</p>
                  )}
                  {profileUpload.uploading && (
                    <div className="w-20 h-1 bg-gray-200 rounded-full mt-2">
                      <div className="h-full bg-[#0D3D33] rounded-full" style={{ width: `${profileUpload.progress}%` }}></div>
                    </div>
                  )}
                </div>

                <div className="auth-field">
                  <label>{t("auth.fullName") || "Full Name"}</label>
                  <input
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label>{t("auth.phoneNumber") || "Phone Number"}</label>
                  <input
                    required
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="auth-field">
                  <label>{t("auth.emailAddress")}</label>
                  <input
                    required
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="auth-field">
                  <label>{t("auth.password")}</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="auth-field">
                  <label>{t("auth.shopName") || "Shop Name"}</label>
                  <input
                    required
                    placeholder="e.g. Royal Stitch"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label>Shop Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && logoUpload.selectFile(e.target.files[0])}
                  />
                  {logoUpload.preview ? (
                    <div className="w-full h-24 border border-[#E2DDD6] rounded-xl relative overflow-hidden bg-gray-50 flex items-center justify-center mt-1">
                      <img
                        src={logoUpload.preview}
                        alt="Logo"
                        className="h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); logoUpload.reset(); }}
                        className="absolute top-2 right-2 bg-white text-gray-600 rounded-full p-1 border border-gray-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="logo-upload"
                      className="w-full h-24 border border-[#E2DDD6] rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white mt-1 gap-1"
                    >
                      <Store className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload Shop Logo</span>
                    </label>
                  )}
                  {logoUpload.error && (
                    <p className="text-red-500 text-xs mt-1">{logoUpload.error}</p>
                  )}
                </div>

                <div className="auth-field">
                  <label>Shop Address (Optional)</label>
                  <textarea
                    placeholder="e.g. 123 Main St, City"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading || isUploading}
                    className="btn-outline flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="btn-primary flex-[2]"
                  >
                    {isLoading || isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="auth-footer">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/auth/login">{t("auth.logIn")}</Link>
        </div>

        <div className="mt-6 text-center text-xs text-[#888888]">
          {t("auth.bySigningUp")}{" "}
          <Link to="/terms" className="underline text-[#555555]">Terms</Link>
          {" "}{t("auth.and")}{" "}
          <Link to="/privacy" className="underline text-[#555555]">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
