"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";

interface MembersStatsProps {
  stats: {
    totalMembers: number;
    verifiedMembers: number;
    bannedMembers: number;
  };
}

export default function MembersStats({ stats }: MembersStatsProps) {
  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      description: "Registered users",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Verified Members",
      value: stats.verifiedMembers,
      description: "Email verified",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Banned Members",
      value: stats.bannedMembers,
      description: "Restricted access",
      icon: UserX,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
