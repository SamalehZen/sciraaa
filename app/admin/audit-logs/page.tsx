"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminAuditLogsPage() {
  const { data } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const r = await fetch("/api/admin/audit-logs");
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    refetchInterval: 15000,
  });
  const items = data?.items || [];

  async function exportFile(type: "csv" | "pdf") {
    const r = await fetch("/api/admin/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, resource: "audit" }),
    });
    if (!r.ok) return;
    if (type === "csv") {
      const b = await r.text();
      const blob = new Blob([b], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const b = await r.arrayBuffer();
      const blob = new Blob([b], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit.pdf";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Journal d’audit</CardTitle>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => exportFile("csv")}>Exporter CSV</Button>
          <Button variant="outline" onClick={() => exportFile("pdf")}>Exporter PDF</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Resource ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it: any) => (
                <TableRow key={it.id}>
                  <TableCell>{it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}</TableCell>
                  <TableCell>{it.userId}</TableCell>
                  <TableCell>{it.action}</TableCell>
                  <TableCell>{it.resourceType}</TableCell>
                  <TableCell>{it.resourceId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
