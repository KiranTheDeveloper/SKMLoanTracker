export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserCog, Phone, Mail } from "lucide-react";
import { TeamActions } from "@/components/team/TeamActions";

export default async function TeamPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true,
      _count: { select: { assignedApplications: true, createdApplications: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <Header
        title="Team Management"
        subtitle={`${users.filter((u) => u.isActive).length} active members`}
        actions={<TeamActions mode="add" userId="" />}
      />
      <div className="p-4 sm:p-6 space-y-3">
        {users.map((user) => (
          <Card key={user.id} className={!user.isActive ? "opacity-50" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{user.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-100">{user.name}</p>
                      <Badge className={user.role === "ADMIN" ? "bg-purple-900/40 text-purple-300" : "bg-blue-900/40 text-blue-300"}>
                        {user.role}
                      </Badge>
                      {!user.isActive && <Badge className="bg-gray-700/40 text-gray-400">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                      {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>{user._count.createdApplications} created</span>
                      <span>{user._count.assignedApplications} assigned</span>
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TeamActions mode="edit" userId={user.id} user={user} currentUserId={session.user.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
