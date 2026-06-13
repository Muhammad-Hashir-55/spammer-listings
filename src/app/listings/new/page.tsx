"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import toast from "react-hot-toast";
import { Shield, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    cloudinary?: any;
  }
}

export default function NewReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [descLength, setDescLength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
    }
  }, []);

  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      toast.error("Cloudinary widget is still loading");
      return;
    }

    if (!cloudinaryCloudName || !cloudinaryApiKey) {
      toast.error(
        "Cloudinary upload settings are missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY."
      );
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudinaryCloudName,
        apiKey: cloudinaryApiKey,
        uploadSignature: async (
          callback: (signature: string) => void,
          paramsToSign: Record<string, string | number | boolean>
        ) => {
          try {
            const res = await fetch("/api/cloudinary/signature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paramsToSign }),
            });

            if (!res.ok) {
              throw new Error("Failed to generate Cloudinary signature");
            }

            const data = (await res.json()) as { signature: string };
            callback(data.signature);
          } catch {
            toast.error("Could not authorize Cloudinary upload");
            callback("");
          }
        },
        maxFiles: 5,
        maxFileSize: 5000000,
        sources: ["local", "url", "camera"],
        multiple: true,
        showAdvancedOptions: false,
        cropping: false,
        folder: "spammer-listings",
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setScreenshots((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, result.info.secure_url];
          });
        }
      }
    );

    widget.open();
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      phone: formData.get("phone") as string,
      name: formData.get("name") as string,
      organization: formData.get("organization") as string,
      description: formData.get("description") as string,
    };

    const newErrors: Record<string, string> = {};
    if (!data.phone.trim()) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/spammers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone,
          name: data.name || undefined,
          organization: data.organization || undefined,
          description: data.description || undefined,
          screenshots,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success(
        "Your report has been submitted and is under review by our team."
      );
      router.push("/listings");
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="afterInteractive"
        onLoad={() => setCloudinaryReady(true)}
        onError={() => toast.error("Failed to load the Cloudinary widget")}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report a Spammer</h1>
        <p className="mt-2 text-muted-foreground">
          Help protect the community by reporting suspicious phone numbers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            placeholder="+92 300 1234567"
            required
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name (if known)</Label>
          <Input
            id="name"
            name="name"
            placeholder="Scammer's name or alias"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">
            Organization / WhatsApp Group / Platform
          </Label>
          <Input
            id="organization"
            name="organization"
            placeholder="e.g. WhatsApp group, Facebook, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <div className="relative">
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={500}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe how this number was used for spam..."
              onChange={(e) => setDescLength(e.target.value.length)}
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {descLength}/500
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Screenshots (optional, max 5)</Label>
          <div className="flex flex-wrap gap-2">
            {screenshots.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  className="h-20 w-20 rounded-md border object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                  onClick={() =>
                    setScreenshots((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {screenshots.length < 5 && (
              <button
                type="button"
                onClick={openCloudinaryWidget}
                disabled={!cloudinaryReady || !cloudinaryCloudName || !cloudinaryApiKey}
                className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed transition-colors hover:bg-muted/50"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {cloudinaryReady ? "Upload" : "Loading..."}
                  </span>
                </div>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {screenshots.length}/5 images uploaded
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting report...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Submit Report
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
