import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Shield, Search, Users, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const { connectDB } = await import("@/lib/db");
    const { Spammer } = await import("@/lib/models/spammer");
    const { User } = await import("@/lib/models/user");
    await connectDB();
    const [totalSpammers, totalConfirmed, totalUsers] = await Promise.all([
      Spammer.countDocuments(),
      Spammer.aggregate([
        { $group: { _id: null, total: { $sum: "$confirmedCount" } } },
      ]),
      User.countDocuments(),
    ]);
    return {
      totalSpammers,
      totalConfirmed: totalConfirmed[0]?.total || 0,
      totalUsers,
    };
  } catch {
    return { totalSpammers: 0, totalConfirmed: 0, totalUsers: 0 };
  }
}

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/listings");
  }

  const stats = await getStats();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Shield className="mr-2 h-4 w-4 text-red-600" />
              Community-Driven Protection
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Protect Your Community from{" "}
              <span className="text-red-600">Phone Spammers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Spammer Listings is a community-driven platform where users like
              you can report and identify phone spammers. Together, we can build
              a safer communication environment for everyone.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/listings">
                <Button size="lg" className="text-base">
                  Browse Listings
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="text-base">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <Search className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold">{stats.totalSpammers}</span>
              <span className="text-sm text-muted-foreground">
                Spammers Reported
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <BadgeCheck className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold">
                {stats.totalConfirmed}
              </span>
              <span className="text-sm text-muted-foreground">
                Reports Confirmed
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold">{stats.totalUsers}</span>
              <span className="text-sm text-muted-foreground">
                Community Members
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold">How It Works</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-lg border p-6 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
              1
            </div>
            <h3 className="mb-2 font-semibold">Report a Spammer</h3>
            <p className="text-sm text-muted-foreground">
              Found a suspicious number? Report it with details and screenshots
              to warn others.
            </p>
          </div>
          <div className="rounded-lg border p-6 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              2
            </div>
            <h3 className="mb-2 font-semibold">Confirm Reports</h3>
            <p className="text-sm text-muted-foreground">
              See a number you recognize as a spammer? Confirm the report to
              help the community.
            </p>
          </div>
          <div className="rounded-lg border p-6 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
              3
            </div>
            <h3 className="mb-2 font-semibold">Stay Protected</h3>
            <p className="text-sm text-muted-foreground">
              Search before answering unknown calls and stay safe from phone
              scams.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}