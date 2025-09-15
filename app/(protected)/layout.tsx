import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import Sidebar from "./_components/sidebar";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className="h-full flex bg-[#eaeaea]">
        <Sidebar />
        <div className="flex-grow">{children}</div>
      </div>
    </SessionProvider>
  );
}
