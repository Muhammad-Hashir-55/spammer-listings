"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import {
  Search,
  Plus,
  Shield,
  Loader2,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Spammer {
  _id: string;
  phone: string;
  name?: string;
  organization?: string;
  description?: string;
  screenshots: string[];
  confirmedCount: number;
  confirmedBy: string[];
  reportedBy: { _id: string; name: string } | null;
  createdAt: string;
}

export default function ListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 200);
  const [searchResults, setSearchResults] = useState<Spammer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Paginated listing state
  const [spammers, setSpammers] = useState<Spammer[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterOrg, setFilterOrg] = useState("");
  const [filterMinConfirmed, setFilterMinConfirmed] = useState(0);
  const [filterSort, setFilterSort] = useState("newest");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Live search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    fetch(`/api/spammers/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, [debouncedQuery]);

  // Fetch paginated listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (filterOrg) params.set("org", filterOrg);
    if (filterMinConfirmed > 0)
      params.set("minConfirmed", filterMinConfirmed.toString());
    params.set("sort", filterSort);

    try {
      const res = await fetch(`/api/spammers?${params}`);
      const data = await res.json();
      setSpammers(data.spammers);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.organizations) setOrganizations(data.organizations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterOrg, filterMinConfirmed, filterSort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const hasActiveFilters = filterOrg || filterMinConfirmed > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by phone number, name, or organization..."
            className="pl-10 pr-12 h-12 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search results dropdown */}
        {debouncedQuery && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
            {searchResults.length > 0 ? (
              searchResults.map((spammer) => (
                <Link
                  key={spammer._id}
                  href={`/listings/${spammer._id}`}
                  className="flex items-center justify-between border-b px-4 py-3 last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{spammer.phone}</span>
                    </div>
                    {spammer.name && (
                      <span className="text-sm text-muted-foreground">
                        {spammer.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {spammer.organization && (
                      <Badge variant="secondary">{spammer.organization}</Badge>
                    )}
                    <Badge
                      variant={
                        spammer.confirmedCount > 0 ? "default" : "secondary"
                      }
                      className={
                        spammer.confirmedCount > 0
                          ? "bg-red-600 text-white"
                          : ""
                      }
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {spammer.confirmedCount}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No results found for &ldquo;{debouncedQuery}&rdquo;
                </p>
                <Link href="/listings/new">
                  <Button variant="link" className="mt-2">
                    Be the first to report this number
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 rounded-lg border p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">
                Organization
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterOrg}
                onChange={(e) => {
                  setFilterOrg(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[180px]">
              <label className="mb-1 block text-sm font-medium">
                Min Confirmations
              </label>
              <Input
                type="number"
                min={0}
                value={filterMinConfirmed}
                onChange={(e) => {
                  setFilterMinConfirmed(Number(e.target.value));
                  setPage(1);
                }}
              />
            </div>
            <div className="w-[160px]">
              <label className="mb-1 block text-sm font-medium">Sort</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterSort}
                onChange={(e) => {
                  setFilterSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterOrg("");
                  setFilterMinConfirmed(0);
                  setFilterSort("newest");
                  setPage(1);
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Listings header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spammer Listings</h1>
          <p className="text-sm text-muted-foreground">
            {total} report{total !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : spammers.length === 0 ? (
        <div className="py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to report a spammer
          </p>
          <Link href="/listings/new">
            <Button className="mt-4">Report a Spammer</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spammers.map((spammer) => (
            <Link
              key={spammer._id}
              href={`/listings/${spammer._id}`}
              className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-semibold truncate">
                      {spammer.phone}
                    </span>
                  </div>
                  {spammer.name && (
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {spammer.name}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    spammer.confirmedCount > 0 ? "default" : "secondary"
                  }
                  className={`shrink-0 ml-2 ${
                    spammer.confirmedCount > 0
                      ? "bg-red-600 text-white"
                      : ""
                  }`}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {spammer.confirmedCount}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {spammer.organization && (
                  <Badge variant="secondary" className="text-xs">
                    <Building className="mr-1 h-3 w-3" />
                    {spammer.organization}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(spammer.createdAt).toLocaleDateString()}
                </span>
              </div>
              {spammer.screenshots && spammer.screenshots.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {spammer.screenshots.length} screenshot
                  {spammer.screenshots.length !== 1 ? "s" : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Floating add button */}
      <Link href="/listings/new">
        <button className="fixed bottom-8 right-8 z-10 flex h-14 items-center gap-2 rounded-full bg-red-600 px-6 text-white shadow-xl transition-colors hover:bg-red-700">
          <Plus className="h-6 w-6" />
          <span className="text-sm font-semibold">Report</span>
        </button>
      </Link>
    </div>
  );
}
