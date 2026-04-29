// Tujuan      : Halaman login admin Happify (proteksi credential sederhana)
// Caller      : app router (/admin)
// Dependensi  : next/navigation (useRouter), next/image
// Main Exports: LoginPage (default)
// Side Effects: Client-side redirect ke /admin/dashboard setelah login berhasil

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Kredensial khusus
        if (username === "happifyindonesia" && password === "adminhappify123") {
            router.push("/admin/dashboard");
        } else {
            setError("Oops, your username or password is incorrect!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED] p-6 selection:bg-brand-primary selection:text-white">
            <div className="w-full max-w-md">
                <div className="relative group">

                    <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                        {/* Header Area */}
                        <div className="mb-10 text-center">
                            <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest text-brand-primary uppercase bg-brand-primary/10 rounded-full">
                                Admin Portal
                            </div>
                            <Image
                                src="/happify-text.webp"
                                alt="Happify Indonesia"
                                width={200}
                                height={200}
                                className="mx-auto"
                            />
                        </div>

                        {error && (
                            <div className="mb-6 p-3 text-xs font-bold text-red-500 bg-red-50 border-l-4 border-red-500 animate-pulse">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Username Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-brand-primary focus:bg-white outline-none transition-all duration-200 font-medium placeholder:text-gray-300"
                                    placeholder="Your Username"
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-brand-primary focus:bg-white outline-none transition-all duration-200 font-medium placeholder:text-gray-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-brand-primary font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_-10px_rgba(19,160,211,0.5)]"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-8 text-gray-400 text-xs">
                    All right reserved Happify Indonesia
                </p>
            </div>
        </div>
    );
}