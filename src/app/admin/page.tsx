"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Shield,
  Loader2,
  Trash2,
  Users,
  Phone,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalReports: number;
  totalUsers: number;
}

interface Spammer {
  _id: string;
  phone: string;
  name?: string;
  organization?: string;
  description?: string;
  screenshots: string[];
  confirmedCount: number;
  status: string;
  reportedBy: { _id: string; name: string };
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [spammers, setSpammers] = useState<Spammer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/listings");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchStats();
      fetchSpammers();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSpammers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/spammers");
      if (res.ok) {
        const data = await res.json();
        setSpammers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/spammers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setSpammers((prev) => prev.filter((s) => s._id !== id));
      toast.success("Report deleted!");
      fetchStats();
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (status === "loading" || (status === "authenticated" && !stats)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage spammer reports
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold">
              {stats?.totalReports || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Total Reports</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">
              {stats?.totalUsers || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Total Users</p>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : spammers.length === 0 ? (
        <div className="py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">
            No reports yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {spammers.map((spammer) => (
            <div
              key={spammer._id}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{spammer.phone}</span>
                  </div>
                  {spammer.name && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {spammer.name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {spammer.organization && (
                      <Badge variant="secondary">
                        <Building className="mr-1 h-3 w-3" />
                        {spammer.organization}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Reported by {spammer.reportedBy?.name} on{" "}
                      {new Date(spammer.createdAt).toLocaleDateString()}
                    </span>
                    {spammer.confirmedCount > 0 && (
                      <Badge variant="default" className="bg-red-600 text-white">
                        <Shield className="mr-1 h-3 w-3" />
                        {spammer.confirmedCount} confirmed
                      </Badge>
                    )}
                  </div>
                  {spammer.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {spammer.description}
                    </p>
                  )}
                  {spammer.screenshots && spammer.screenshots.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {spammer.screenshots.length} screenshot
                      {spammer.screenshots.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(spammer._id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}