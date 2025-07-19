"use client";

import { Clock } from "lucide-react";

export default function PendingApproval() {
    return (
        <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-yellow-100 rounded-full">
                        <Clock className="h-12 w-12 text-yellow-600" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Verification Pending
                </h1>
                <p className="text-gray-600 mb-6">
                    Your account is under review. Please wait for admin
                    approval.
                </p>
                <div className="text-sm text-gray-500">
                    This process typically takes 1-2 hours.
                </div>
            </div>
        </div>
    );
}
