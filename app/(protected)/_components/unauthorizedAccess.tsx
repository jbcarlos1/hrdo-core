import Link from "next/link";

export default function UnauthorizedAccess() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="text-center max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-600 mb-6">
                    You don&apos;t have permission to access this page. Please
                    contact your administrator if you think this is a mistake.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-gradient-to-b from-[#1a237e] via-[#273574] to-[#1a237e] text-white"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
}
