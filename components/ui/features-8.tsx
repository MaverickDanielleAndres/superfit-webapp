import { Shield, Users, Dumbbell, LineChart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function Features() {
  return (
    <section className="bg-transparent py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:max-w-5xl">
        <div className="relative">
          <div className="relative z-10 grid grid-cols-6 gap-3">
            <Card className="relative col-span-full flex overflow-hidden border-lime-500/20 bg-zinc-900 lg:col-span-2">
              <CardContent className="relative m-auto size-fit pt-6 text-center">
                <div className="mx-auto flex h-24 w-56 items-center justify-center rounded-xl border border-lime-500/20 bg-zinc-950">
                  <span className="text-5xl font-semibold text-lime-300">100%</span>
                </div>
                <h2 className="mt-6 text-3xl font-semibold text-zinc-100">Coach-Controlled</h2>
              </CardContent>
            </Card>

            <Card className="relative col-span-full overflow-hidden border-lime-500/20 bg-zinc-900 sm:col-span-3 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="mx-auto flex aspect-square size-32 rounded-full border border-lime-500/25" />
                <div className="relative z-10 mt-6 space-y-2 text-center">
                  <h2 className="text-lg font-medium text-zinc-100">Secure by default</h2>
                  <p className="text-zinc-400">Athlete data, client programs, and coach workflows stay protected with role-based access.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative col-span-full overflow-hidden border-lime-500/20 bg-zinc-900 sm:col-span-3 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="pt-6 lg:px-6">
                  <div className="h-32 w-full rounded-xl border border-lime-500/20 bg-zinc-950" />
                </div>
                <div className="relative z-10 mt-8 space-y-2 text-center">
                  <h2 className="text-lg font-medium text-zinc-100">Faster than fragmented tools</h2>
                  <p className="text-zinc-400">One platform for training, nutrition, messaging, and analytics with less context switching.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative col-span-full overflow-hidden border-lime-500/20 bg-zinc-900 lg:col-span-3">
              <CardContent className="grid pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border border-lime-500/25">
                    <Dumbbell className="m-auto size-5 text-lime-300" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-zinc-100">Athlete progression tracking</h2>
                    <p className="text-zinc-400">From session logs to macro adherence, athletes and coaches see progress in one timeline.</p>
                  </div>
                </div>
                <div className="relative mt-6 border-l border-lime-500/20 pl-6 sm:-my-6 sm:-mr-6">
                  <div className="h-full min-h-40 rounded-xl border border-lime-500/20 bg-zinc-950 p-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative col-span-full overflow-hidden border-lime-500/20 bg-zinc-900 lg:col-span-3">
              <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border border-lime-500/25">
                    <Users className="m-auto size-6 text-lime-300" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-zinc-100">Coach and athlete sync</h2>
                    <p className="text-zinc-400">Coaches assign plans, athletes execute, and both stay aligned through built-in communication.</p>
                  </div>
                </div>
                <div className="relative mt-6 border-l border-lime-500/20 pl-6 sm:-my-6 sm:-mr-6">
                  <div className="space-y-4 py-2">
                    {["Athlete A", "Athlete B", "Athlete C"].map((name) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border border-lime-500/20 bg-zinc-950 px-3 py-2">
                        <span className="text-xs text-zinc-300">{name}</span>
                        <LineChart className="h-3.5 w-3.5 text-lime-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
