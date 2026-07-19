import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, User, Mail, Lock, Shield, CheckCircle, XCircle, Feather } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import API from "@/utils/api";

const Signup = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    const strength = {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const score = Object.values(strength).filter(Boolean).length;
    setPasswordStrength({ score, ...strength });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Full name is required";
    } else if (formData.username.trim().length < 2) {
      newErrors.username = "Name must be at least 2 characters";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 3) {
      newErrors.password = "Password is too weak (use uppercase, lowercase, number, or special char)";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score <= 2) return "bg-gray-400";
    if (score === 3) return "bg-gray-600";
    if (score === 4) return "bg-gray-800";
    return "bg-black";
  };

  const getPasswordStrengthText = () => {
    const { score } = passwordStrength;
    if (score <= 2) return "Weak";
    if (score === 3) return "Fair";
    if (score === 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const res = await axios.post(
        `${API}/user/register`,
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Account created successfully!");
        navigate("/verify");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* ─── Brand Side (Left) ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_white,_transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xl font-black tracking-tight">
            <Feather className="h-8 w-8" />
            <span>
              <span className="font-light">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
              <span className="font-extrabold">NEWS</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-400">Multipurpose Magazine & Blog</p>
        </div>

        <div className="relative z-10 space-y-6 max-w-sm">
          <h2 className="text-4xl font-black leading-tight">
            Join the<br />
            <span className="text-gray-400">writing community.</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Start sharing your ideas, stories, and perspectives with a global
            audience. It's free, simple, and built for writers like you.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="w-8 h-px bg-gray-700" />
            <span>Already 15,000+ writers</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-600">
          © {new Date().getFullYear()} FeatheredNews. All rights reserved.
        </div>
      </div>

      {/* ─── Form Side (Right) ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-0">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand (visible only on small screens) */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight">
              <Feather className="h-6 w-6" />
              <span>
                <span className="font-light">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                <span className="font-extrabold">News</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Multipurpose Magazine & Blog</p>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
              Create account
            </h1>
            <p className="mt-2 text-gray-600">
              Join our community of writers and start publishing.
            </p>
          </div>

          <Card className="w-full border-none shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0 pb-6">
              <CardTitle className="text-2xl text-black">Sign up</CardTitle>
              <CardDescription className="text-gray-500">
                Create your account to get started
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit} noValidate>
              <CardContent className="space-y-5 px-0">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-9 border-gray-300 focus:border-black focus:ring-black/20 ${
                        errors.username ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      aria-invalid={!!errors.username}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-9 border-gray-300 focus:border-black focus:ring-black/20 ${
                        errors.email ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-9 pr-10 border-gray-300 focus:border-black focus:ring-black/20 ${
                        errors.password ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      aria-invalid={!!errors.password}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.score <= 2 ? "text-gray-600" :
                          passwordStrength.score === 3 ? "text-gray-700" :
                          passwordStrength.score === 4 ? "text-gray-800" :
                          "text-black"
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasMinLength ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className="text-gray-500">≥8 chars</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasUppercase ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className="text-gray-500">Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasLowercase ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className="text-gray-500">Lowercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasNumber ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className="text-gray-500">Number</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          {passwordStrength.hasSpecialChar ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className="text-gray-500">Special character (!@#$%...)</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-9 pr-10 border-gray-300 focus:border-black focus:ring-black/20 ${
                        errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 px-0 pt-8">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-black hover:text-gray-700 hover:underline transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;