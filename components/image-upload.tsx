import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ImageUploadProps {
    onUpload: (file: File) => Promise<void>;
    loading?: boolean;
}

export function ImageUpload({ onUpload, loading }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            await onUpload(file);
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            await onUpload(file);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-lg p-4 ${
                dragActive ? "border-primary" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <Input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className={
                    loading
                        ? "hidden"
                        : "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                }
                disabled={loading}
            />
            <div className="text-center">
                <p className="text-sm text-gray-600">
                    {loading
                        ? "Uploading..."
                        : "Drag and drop or click to upload"}
                </p>
            </div>
        </div>
    );
}
