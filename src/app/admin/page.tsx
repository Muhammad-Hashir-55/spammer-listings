"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Phone,
  Building,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
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
  reportedBy: { _id: string; name: string } | null;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
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
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchSpammers();
    }
  }, [tab, session]);

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
      const res = await fetch(`/api/admin/spammers?status=${tab}`);
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

  const handleStatusChange = async (
    id: string,
    newStatus: string,
    index: number
  ) => {
    try {
      const res = await fetch(`/api/spammers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();
      setSpammers((prev) =>
        prev.map((s) => (s._id === id ? updated : s))
      );

      setSpammers((prev) => prev.filter((s) => s._id !== id));
      toast.success(
        `Report ${newStatus === "approved" ? "approved" : "rejected"}!`
      );
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
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-2xl font-bold">
              {stats?.totalPending || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold">
              {stats?.totalApproved || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Approved</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold">
              {stats?.totalRejected || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Rejected</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">
              {stats?.totalUsers || 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className="capitalize"
          >
            {t}
            {t === "pending" && stats && stats.totalPending > 0 && (
              <Badge variant="warning" className="ml-2">
                {stats.totalPending}
              </Badge>
            )}
          </Button>
        ))}
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
            No {tab} reports
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {spammers.map((spammer, index) => (
            <div
              key={spammer._id}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between">
                <div>
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
                      Reported by {spammer.reportedBy?.name || "Deleted account"} on{" "}
                      {new Date(spammer.createdAt).toLocaleDateString()}
                    </span>
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
                <Badge
                  variant={
                    spammer.status === "pending"
                      ? "warning"
                      : spammer.status === "approved"
                      ? "success"
                      : "error"
                  }
                  className="capitalize"
                >
                  {spammer.status}
                </Badge>
              </div>

              {tab === "pending" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      handleStatusChange(spammer._id, "approved", index)
                    }
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handleStatusChange(spammer._id, "rejected", index)
                    }
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
