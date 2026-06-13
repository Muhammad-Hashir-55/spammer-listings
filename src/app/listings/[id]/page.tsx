"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Shield,
  Loader2,
  Phone,
  Building,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SpammerDetail {
  _id: string;
  phone: string;
  name?: string;
  organization?: string;
  description?: string;
  screenshots: string[];
  confirmedCount: number;
  confirmedBy: string[];
  status: string;
  reportedBy: { _id: string; name: string } | null;
  createdAt: string;
}

export default function SpammerDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [spammer, setSpammer] = useState<SpammerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/spammers/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSpammer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleConfirm = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`/api/spammers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();
      setSpammer(updated);
      toast.success(
        updated.confirmedBy.includes(session.user.id)
          ? "Report confirmed!"
          : "Confirmation removed"
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setConfirming(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!spammer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Report not found</h2>
        <Link href="/listings">
          <Button variant="link">Back to listings</Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = session?.user?.id
    ? spammer.confirmedBy.includes(session.user.id)
    : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/listings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="rounded-lg border p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{spammer.phone}</h1>
            </div>
            {spammer.name && (
              <p className="mt-1 ml-8 text-lg text-muted-foreground">
                {spammer.name}
              </p>
            )}
          </div>
          <Badge
            variant={
              spammer.confirmedCount > 0 ? "default" : "secondary"
            }
            className={
              spammer.confirmedCount > 0
                ? "bg-red-600 text-white text-sm px-3 py-1"
                : "text-sm px-3 py-1"
            }
          >
            <Shield className="mr-1 h-4 w-4" />
            Confirmed by {spammer.confirmedCount} user
            {spammer.confirmedCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-3">
          {spammer.organization && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{spammer.organization}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              Reported by{" "}
              <span className="font-medium">
                {spammer.reportedBy?.name || "Deleted account"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Reported on{" "}
              {new Date(spammer.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Description */}
        {spammer.description && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground">
              {spammer.description}
            </p>
          </div>
        )}

        {/* Screenshots */}
        {spammer.screenshots && spammer.screenshots.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold">Screenshots</h3>
            <div className="flex flex-wrap gap-2">
              {spammer.screenshots.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="overflow-hidden rounded-md border transition-opacity hover:opacity-80"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="h-24 w-24 object-cover sm:h-32 sm:w-32"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            variant={isConfirmed ? "outline" : "default"}
            className={
              isConfirmed
                ? ""
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          >
            {confirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isConfirmed ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            {isConfirmed
              ? "Remove Confirmation"
              : "Confirm this Report"}
          </Button>

          {/* Admin actions */}
          {session?.user?.role === "admin" && (
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/spammers/${params.id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) throw new Error();
                  toast.success("Report deleted!");
                  router.push("/listings");
                } catch {
                  toast.error("Failed to delete");
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Report
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && spammer.screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-4 top-4 text-white hover:text-gray-300"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          {spammer.screenshots.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev === 0
                      ? spammer.screenshots.length - 1
                      : prev - 1
                  );
                }}
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                className="absolute right-16 text-white hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev === spammer.screenshots.length - 1
                      ? 0
                      : prev + 1
                  );
                }}
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}
          <img
            src={spammer.screenshots[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-sm text-white">
            {lightboxIndex + 1} / {spammer.screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
