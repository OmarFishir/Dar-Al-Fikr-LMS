import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Crown, Medal, TrendingUp, Plus, Minus, Zap } from "lucide-react";

const RANK_ICONS = [
  <Crown className="h-5 w-5 text-amber-500" />,
  <Medal className="h-5 w-5 text-slate-400" />,
  <Medal className="h-5 w-5 text-amber-700" />,
];

export default function StudentPoints() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard">("overview");

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: leaderboard } = trpc.points.leaderboard.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );
  const { data: myHistory } = trpc.points.history.useQuery(
    { classId: selectedClassId!, studentId: user?.id! },
    { enabled: !!selectedClassId && !!user?.id }
  );

  const myEntry = leaderboard?.find((e) => e.studentId === user?.id);
  const myRank = leaderboard ? leaderboard.findIndex((e) => e.studentId === user?.id) + 1 : null;



  return (
    <SchoolLayout role="student">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-bold">My Points</h1>
          <p className="text-muted-foreground mt-1">Track your progress and compete with classmates</p>
        </div>

        {/* Class selector */}
        <div className="flex gap-2 flex-wrap">
          {classes?.map((c) => (
            <Badge
              key={c.id}
              variant={selectedClassId === c.id ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setSelectedClassId(c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>

        {!selectedClassId && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">Select a class to view your points</p>
          </div>
        )}

        {selectedClassId && (
          <div className="space-y-6">
            {/* ClassDojo-style Hero Card */}
            <Card className="border-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  {/* Total Points */}
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-8 w-8" />
                      <span className="text-5xl font-bold">{(myEntry?.total ?? 0) > 0 ? "+" : ""}{myEntry?.total ?? 0}</span>
                    </div>
                    <p className="text-sm opacity-90">Total Points</p>
                  </div>

                  {/* Rank */}
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {myRank && myRank <= 3 ? RANK_ICONS[myRank - 1] : <Trophy className="h-8 w-8" />}
                      <span className="text-5xl font-bold">#{myRank ?? "—"}</span>
                    </div>
                    <p className="text-sm opacity-90">Your Rank</p>
                  </div>

                  {/* Streak or Recent */}
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="h-8 w-8" />
                      <span className="text-5xl font-bold">{myHistory?.length ?? 0}</span>
                    </div>
                    <p className="text-sm opacity-90">Recent Awards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                onClick={() => setActiveTab("overview")}
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              >
                Overview
              </Button>
              <Button
                variant={activeTab === "leaderboard" ? "default" : "ghost"}
                onClick={() => setActiveTab("leaderboard")}
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              >
                Leaderboard
              </Button>

            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <div className="space-y-4">
                  <h2 className="font-semibold text-lg">Recent Activity</h2>
                  {myHistory?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No points awarded yet.</p>
                  )}
                  <div className="space-y-2">
                    {myHistory?.map((entry: any) => (
                      <Card key={entry.id} className="border border-border hover:shadow-md transition">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${entry.points > 0 ? "bg-green-100" : "bg-red-100"}`}>
                              {entry.points > 0
                                ? <Plus className="h-4 w-4 text-green-600" />
                                : <Minus className="h-4 w-4 text-red-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{entry.comment ?? "Points awarded"}</p>
                              <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-bold text-sm ${entry.points > 0 ? "text-green-600" : "text-red-500"}`}>
                              {entry.points > 0 ? "+" : ""}{entry.points}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <h2 className="font-semibold text-lg">Your Stats</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{myHistory?.filter((e: any) => e.points > 0).length ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Positive Awards</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">{myHistory?.filter((e: any) => e.points < 0).length ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Deductions</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Class Leaderboard
                </h2>
                {leaderboard?.length === 0 && (
                  <p className="text-muted-foreground text-sm">No points awarded yet.</p>
                )}
                <div className="space-y-2">
                  {leaderboard?.map((entry, idx) => {
                    const isMe = entry.studentId === user?.id;
                    return (
                      <Card key={entry.studentId} className={`${isMe ? "border-2 border-primary bg-primary/5" : ""} ${idx === 0 ? "border-amber-300 bg-amber-50" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 flex justify-center shrink-0 font-bold">
                              {idx < 3 ? RANK_ICONS[idx] : <span className="text-muted-foreground">#{idx + 1}</span>}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-sm font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                                {(entry.name ?? "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`flex-1 font-medium ${isMe ? "font-bold" : ""}`}>
                              {entry.name}{isMe ? " (You)" : ""}
                            </span>
                            <span className={`font-bold text-lg ${entry.total >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {entry.total > 0 ? "+" : ""}{entry.total}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}


          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
