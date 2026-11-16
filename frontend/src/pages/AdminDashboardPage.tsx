import React, { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, FolderKanban, Layers, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { DesignCategory, Project } from "../types";

export const AdminDashboardPage: React.FC = () => {
  const { user, login } = useAuth();
  const [tab, setTab] = useState<"analytics" | "users" | "categories" | "projects" | "logs">("analytics");

  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<DesignCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatGroup, setNewCatGroup] = useState("Interior");

  const loadAdminData = async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [ov, us, ct, pr, lg] = await Promise.all([
        api.get<any>("/api/admin/overview"),
        api.get<{ users: any[] }>("/api/admin/users"),
        api.get<{ categories: DesignCategory[] }>("/api/admin/categories"),
        api.get<{ projects: Project[] }>("/api/admin/projects"),
        api.get<{ logs: any[] }>("/api/admin/error-logs"),
      ]);
      setOverview(ov);
      setUsers(us.users);
      setCategories(ct.categories);
      setProjects(pr.projects);
      setLogs(lg.logs);
    } catch {
      // handled
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-[#C87960]" />
        <h1 className="mt-4 font-editorial text-3xl font-semibold text-[#172B3A]">
          Administrator Console
        </h1>
        <p className="mt-2 text-sm text-[#252B2E]/75">
          This workspace requires administrator privileges to manage users, spatial categories, and system logs.
        </p>
        <button
          type="button"
          onClick={() => login("admin@formaspace.ai", "AdminForma2026!")}
          className="btn-primary mt-6"
        >
          Sign In as Seeded Demo Admin
        </button>
      </div>
    );
  }

  const updateUserRole = async (uid: string, role: string) => {
    await api.patch(`/api/admin/users/${uid}`, { role });
    setMsg("User account updated.");
    loadAdminData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await api.post("/api/admin/categories", {
      name: newCatName,
      slug,
      group_name: newCatGroup,
      description: "Custom admin-configured space typology",
      cover_image: "/images/hero-after.jpg",
    });
    setNewCatName("");
    loadAdminData();
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              Platform Governance
            </span>
            <h1 className="font-editorial text-3xl font-semibold text-[#172B3A]">
              FormaSpace Admin Console
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "categories", label: "Categories", icon: Layers },
              { id: "projects", label: "Projects", icon: FolderKanban },
              { id: "logs", label: "Error Logs", icon: AlertTriangle },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition ${
                  tab === t.id
                    ? "bg-[#172B3A] text-white"
                    : "border border-[#DCCBB5] bg-white text-[#172B3A]"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-[#9BAE9A] bg-[#9BAE9A]/20 px-4 py-2.5 text-xs font-medium text-[#172B3A]">
            {msg}
          </div>
        )}

        {/* Top KPI Cards */}
        {overview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Total Registered Users", val: overview.metrics.total_users },
              { label: "AI Spatial Generations", val: overview.metrics.ai_generations },
              { label: "Total Projects", val: overview.metrics.total_projects },
            ].map((m) => (
              <div key={m.label} className="editorial-card p-5">
                <div className="text-xs text-[#252B2E]/65">{m.label}</div>
                <div className="mt-1 font-editorial text-3xl font-semibold text-[#172B3A]">{m.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Views */}
        {tab === "analytics" && overview && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="editorial-card p-6">
              <h2 className="font-editorial text-xl font-semibold text-[#172B3A] mb-4">
                Generations by Architectural Style
              </h2>
              <div className="space-y-3">
                {overview.style_analytics.map((row: any) => (
                  <div key={row.style}>
                    <div className="flex justify-between text-xs font-medium text-[#172B3A]">
                      <span>{row.style}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#F7F4ED]">
                      <div
                        className="h-2 rounded-full bg-[#C87960]"
                        style={{ width: `${Math.min(100, row.count * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="editorial-card p-6">
              <h2 className="font-editorial text-xl font-semibold text-[#172B3A] mb-4">
                Generations by AI Feature
              </h2>
              <div className="space-y-3">
                {overview.feature_analytics.map((row: any) => (
                  <div key={row.feature_type}>
                    <div className="flex justify-between text-xs font-medium text-[#172B3A]">
                      <span>{row.feature_type}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#F7F4ED]">
                      <div
                        className="h-2 rounded-full bg-[#172B3A]"
                        style={{ width: `${Math.min(100, row.count * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="editorial-card overflow-x-auto p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#172B3A] mb-4">User Management</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCCBB5] text-[#252B2E]/65">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#DCCBB5]/40">
                    <td className="py-3 font-medium text-[#172B3A]">{u.full_name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3 uppercase">{u.role}</td>
                    <td className="py-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateUserRole(u.id, u.role === "admin" ? "user" : "admin")}
                        className="rounded-full border border-[#DCCBB5] px-3 py-1 hover:bg-[#F7F4ED]"
                      >
                        {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "categories" && (
          <div className="editorial-card p-6 space-y-5">
            <form onSubmit={handleCreateCategory} className="flex flex-wrap gap-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New design category name..."
                className="rounded-full border border-[#DCCBB5] px-4 py-2 text-xs"
              />
              <select
                value={newCatGroup}
                onChange={(e) => setNewCatGroup(e.target.value)}
                className="rounded-full border border-[#DCCBB5] px-4 py-2 text-xs"
              >
                <option>Interior</option>
                <option>Exterior</option>
                <option>Outdoor</option>
                <option>Commercial</option>
              </select>
              <button type="submit" className="btn-primary py-2 px-5 text-xs">
                Add Category
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 p-3">
                  <div>
                    <div className="font-semibold text-xs text-[#172B3A]">{c.name}</div>
                    <div className="text-[10px] text-[#252B2E]/65">{c.group_name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.patch(`/api/admin/categories/${c.id}/toggle`);
                      loadAdminData();
                    }}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                      c.is_active ? "bg-[#9BAE9A]/30 text-[#172B3A]" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {c.is_active ? "Active" : "Hidden"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "projects" && (
          <div className="editorial-card p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#172B3A] mb-4">All Platform Projects</h2>
            <div className="space-y-2 text-xs">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#DCCBB5]/60 p-3">
                  <div>
                    <span className="font-semibold text-[#172B3A]">{p.title}</span>
                    <span className="ml-2 text-[#252B2E]/65">({p.category} · {p.owner_email})</span>
                  </div>
                  <span className="rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-[10px] uppercase">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="editorial-card p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#172B3A] mb-4">System Error Logs</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-[#252B2E]/65">No server errors logged. All endpoints healthy.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {logs.map((l) => (
                  <div key={l.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="font-semibold text-red-900">{l.endpoint}</div>
                    <div className="text-red-700">{l.error_message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

