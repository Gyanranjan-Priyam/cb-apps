"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Sparkles, Mail, Hash, BookOpen, Layers } from "lucide-react";
import { CoAdminMemberData } from "@/app/admin/members/actions";

interface CoAdminMembersTableProps {
  members: CoAdminMemberData[];
}

export function CoAdminMembersTable({ members }: CoAdminMembersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");

  // Extract unique branches
  const branches = useMemo(() => {
    const list = new Set<string>();
    members.forEach((m) => {
      if (m.branch) list.add(m.branch.trim());
    });
    return Array.from(list).sort();
  }, [members]);

  // Extract unique batches
  const batches = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      if (m.batch?.id) {
        map.set(m.batch.id, m.batch.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [members]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.cbUserId && m.cbUserId.toLowerCase().includes(q)) ||
        (m.specializedDomain && m.specializedDomain.toLowerCase().includes(q));

      const matchesBranch =
        selectedBranch === "all" || m.branch === selectedBranch;

      const matchesBatch =
        selectedBatch === "all" ||
        (selectedBatch === "unassigned" && !m.batch) ||
        m.batch?.id === selectedBatch;

      return matchesSearch && matchesBranch && matchesBatch;
    });
  }, [members, search, selectedBranch, selectedBatch]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-indigo-500" />
              Member Directory ({filteredMembers.length} / {members.length})
            </CardTitle>
            <CardDescription className="mt-1">
              Scoped view of member identity, academic branch, batch, and specialized domain.
            </CardDescription>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, user ID, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-44 text-xs">
              <SelectValue placeholder="Branch: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-full sm:w-44 text-xs">
              <SelectValue placeholder="Batch: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Member Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No members match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member, index) => (
                  <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {member.name}
                    </TableCell>
                    <TableCell>
                      {member.cbUserId ? (
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          {member.cbUserId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      {member.branch ? (
                        <Badge variant="secondary" className="text-xs uppercase font-medium">
                          {member.branch}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.batch ? (
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs">
                          {member.batch.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
