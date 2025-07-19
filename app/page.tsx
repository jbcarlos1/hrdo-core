import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import { LogIn, Ellipsis, SearchIcon } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { HashLoader } from "react-spinners";

const font = Poppins({
    subsets: ["latin"],
    weight: "700",
    display: "swap",
    preload: true,
});

function LoadingState() {
    return (
        <div className="flex h-screen items-center justify-center">
            <HashLoader color="#ff9e9e" size={50} />
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<LoadingState />}>
            <main className="flex h-full flex-col items-center justify-start bg-gradient-to-b from-[#2a0b0b] via-[#5a0f11] to-[#7b1113] relative overflow-auto">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-[#ff9e9e] opacity-[0.12] blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[20%] w-[800px] h-[800px] rounded-full bg-[#4a0e0e] opacity-[0.12] blur-[120px] animate-pulse delay-1000" />
                </div>
                <div className="space-y-6 flex flex-col items-center justify-center mt-20 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center gap-4 group relative z-20">
                        <Image
                            src="https://res.cloudinary.com/diedm9ddd/image/upload/v1750940289/HRDO_Logo_avvvsw.png"
                            alt="HRDO Logo"
                            width={80}
                            height={80}
                            priority
                            className="drop-shadow-xl group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out"
                        />
                        <h1
                            className={cn(
                                "text-4xl sm:text-5xl md:text-6xl text-white tracking-tight font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 transform group-hover:scale-105 transition-all duration-500",
                                font.className
                            )}
                        >
                            HRDO Supply Hub
                        </h1>
                    </div>
                    <p className="text-white/90 text-2xl sm:text-3xl md:text-4xl font-extrabold text-center whitespace-nowrap">
                        A streamlined inventory management system
                    </p>

                    <div className="relative w-full max-w-[850px] h-auto transform hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[750px] h-[750px] rounded-full bg-[#ff9e9e] opacity-[0.45] blur-[85px] -z-10" />
                        <div className="bg-[#7e1f1f] w-full h-12 rounded-t-xl flex justify-between items-center px-3 shadow-lg border-b border-[#4a0e0e]/30">
                            <Ellipsis className="w-16 h-16 text-[#4a0e0e]" />
                            <div className="bg-[#4a0e0e] h-6 w-[400px] rounded-md text-[#a6adbb] flex items-center px-2 gap-3 shadow-inner">
                                <SearchIcon className="w-4 h-4" />
                                <div className="text-sm font-medium">
                                    https://supply-hub.hrdo.upd.edu.ph
                                </div>
                            </div>
                            <div className="w-14 opacity-0" />
                        </div>
                        <Image
                            src="https://res.cloudinary.com/diedm9ddd/image/upload/v1750942836/hrdo_supply_hub_ka8hlg.png"
                            alt="Landing Page"
                            layout="intrinsic"
                            width={850}
                            height={600}
                            className="rounded-b-xl relative z-0 shadow-2xl border border-[#4a0e0e]/20"
                        />
                    </div>

                    <div>
                        <LoginButton>
                            <Button
                                variant="secondary"
                                size="xl"
                                className="bg-[#ff9e9e] hover:bg-[#ff9e9e] hover:opacity-80 flex items-center gap-3 transform hover:scale-105 hover:translate-y-[-2px] transition-all duration-300"
                            >
                                Sign in
                                <LogIn className="w-4 h-4" />
                            </Button>
                        </LoginButton>
                    </div>
                </div>
            </main>
        </Suspense>
    );
}
