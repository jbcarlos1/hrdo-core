import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import os from "os";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || !file.name.endsWith(".pdf")) {
        return NextResponse.json(
            { error: "Only PDF files are allowed" },
            { status: 400 }
        );
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const tempPath = path.join(os.tmpdir(), file.name);

        await fs.writeFile(tempPath, new Uint8Array(arrayBuffer));

        const result = await cloudinary.uploader.upload(tempPath, {
            resource_type: "auto",
            folder: "documents",
            public_id: file.name.replace(/\.pdf$/, ""),
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        });

        await fs.unlink(tempPath);

        return NextResponse.json({ url: result.secure_url });
    } catch (error: any) {
        console.error("[UPLOAD ERROR]", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
