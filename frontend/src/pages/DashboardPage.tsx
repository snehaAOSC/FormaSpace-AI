import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Calculator,
  Download,
  ExternalLink,
  FolderPlus,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getDirectRetailerUrl } from "../lib/retailerUrls";
import type {
  BudgetEstimateResult,
  DesignResult,
  Project,
  ProjectFolder,
} from "../types";

type TabId =
  | "overview"
  | "projects"
  | "history"
  | "saved"
  | "furniture"
  | "budgets"
  | "settings";

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");

  const [stats, setStats] = useState<any>({
    total_projects: 0,
    designs_generated: 0,
    saved_designs: 0,
    remaining_credits: 0,
    plan_id: "starter",
  });
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [designs, setDesigns] = useState<DesignResult[]>([]);
  const [furniture, setFurniture] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<BudgetEstimateResult[]>([]);

  const [newFolderName, setNewFolderName] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectCat, setNewProjectCat] = useState("Living Room");
  const [profileName, setProfileName] = useState(user?.full_name || "");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (user) setProfileName(user.full_name);
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    try {
      const [ov, fl, pr, ds, fn, bg] = await Promise.all([
        api.get<any>("/api/dashboard/overview"),
        api.get<{ folders: ProjectFolder[] }>("/api/dashboard/folders"),
        api.get<{ projects: Project[] }>("/api/dashboard/projects"),
        api.get<{ designs: DesignResult[] }>("/api/studio/history"),
        api.get<{ items: any[] }>("/api/modules/furniture/collection"),
        api.get<{ estimates: BudgetEstimateResult[] }>("/api/modules/budget/estimates"),
      ]);
      setStats(ov.stats || {});
      setFolders(fl.folders || []);
      setProjects(pr.projects || []);
      setDesigns(ds.designs || []);
      setFurniture(fn.items || []);
      setBudgets(bg.estimates || []);
    } catch {
      // handled gracefully
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-editorial text-3xl font-semibold text-[#172B3A]">
          Sign in to access your Dashboard
        </h1>
        <p className="mt-3 text-sm text-[#252B2E]/75">
          Manage your architectural projects, folders, saved designs, and furniture collections.
        </p>
        <Link to="/auth" className="btn-primary mt-6">
          Go to Login / Sign Up
        </Link>
      </div>
    );
  }

  // Focused, essential navigation items only
  const navItems: Array<{ id: TabId; label: string; icon: any; count?: number }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "projects", label: "My Projects", icon: FolderPlus, count: projects.length },
    { id: "history", label: "Design History", icon: History, count: designs.length },
    { id: "saved", label: "Saved Designs", icon: Bookmark, count: designs.filter((d) => d.is_saved).length },
    { id: "furniture", label: "Furniture Collection", icon: ShoppingBag, count: furniture.length },
    { id: "budgets", label: "Cost Estimates", icon: Calculator, count: budgets.length },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post<{ folder: ProjectFolder }>("/api/dashboard/folders", {
        name: newFolderName.trim(),
        color: "#C87960",
      });
      setFolders((prev) => [res.folder, ...prev]);
      setNewFolderName("");
      setStatusMsg("Folder created successfully.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to create folder.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/dashboard/folders/${folderId}`);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolder === folderId) {
        setSelectedFolder("");
      }
      setStatusMsg("Folder removed.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to delete folder.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    try {
      const res = await api.post<{ project: Project }>("/api/dashboard/projects", {
        title: newProjectTitle.trim(),
        category: newProjectCat,
        folder_id: selectedFolder || null,
      });
      setProjects((prev) => [res.project, ...prev]);
      setNewProjectTitle("");
      setStatusMsg("Project created successfully.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to create project.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.delete(`/api/dashboard/projects/${projectId}`);
      setProjects((prev) => prev.filter((x) => x.id !== projectId));
      setStatusMsg("Project deleted successfully.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to delete project.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      await api.delete(`/api/studio/designs/${designId}`);
      setDesigns((prev) => prev.filter((x) => x.id !== designId));
      setStatusMsg("Design removed from history.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to delete design.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleDeleteFurniture = async (furnitureId: string) => {
    try {
      await api.delete(`/api/modules/furniture/collection/${furnitureId}`);
      setFurniture((prev) => prev.filter((x) => x.id !== furnitureId));
      setStatusMsg("Furniture piece removed from collection.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to remove furniture.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleDeleteBudget = async (estimateId: string) => {
    try {
      await api.delete(`/api/modules/budget/estimates/${estimateId}`);
      setBudgets((prev) => prev.filter((b) => b.id !== estimateId));
      setStatusMsg("Cost estimate deleted.");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err: any) {
      setStatusMsg(err?.message || "Failed to delete estimate.");
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleToggleSave = async (designId: string) => {
    try {
      const res = await api.post<{ is_saved: boolean }>(`/api/studio/designs/${designId}/save`);
      setDesigns((prev) =>
        prev.map((d) => (d.id === designId ? { ...d, is_saved: res.is_saved } : d))
      );
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patch("/api/auth/profile", { full_name: profileName });
    await refreshUser();
    setStatusMsg("Account profile updated.");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const visibleProjects = selectedFolder
    ? projects.filter((p) => p.folder_id === selectedFolder)
    : projects;

  const savedDesigns = designs.filter((d) => d.is_saved);

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <div className="editorial-card p-4">
            <div className="mb-4 border-b border-[#DCCBB5]/70 pb-4">
              <div className="font-editorial text-lg font-semibold text-[#172B3A]">
                {user.full_name}
              </div>
              <div className="text-xs text-[#252B2E]/65">{user.email}</div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#172B3A] px-2.5 py-0.5 text-[11px] font-medium text-[#F7F4ED]">
                  <ShieldCheck className="h-3 w-3 text-[#9BAE9A]" />
                  {user.plan_id ? `${user.plan_id.charAt(0).toUpperCase() + user.plan_id.slice(1)} Plan` : "Architect"}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${active
                        ? "bg-[#172B3A] text-white"
                        : "text-[#252B2E] hover:bg-[#F7F4ED]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`h-4 w-4 ${active ? "text-[#C87960]" : "text-[#172B3A]/70"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20 text-white" : "bg-[#DCCBB5]/50 text-[#172B3A]"
                          }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Design CTA in Sidebar */}
            <div className="mt-6 border-t border-[#DCCBB5]/70 pt-4">
              <Link
                to="/studio"
                className="btn-primary w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start New AI Redesign</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="space-y-6 lg:col-span-9">
          {statusMsg && (
            <div className="rounded-2xl border border-[#9BAE9A] bg-[#9BAE9A]/20 px-4 py-3 text-xs font-medium text-[#172B3A]">
              {statusMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && (
            <>
              {/* Stat Cards Row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="editorial-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#252B2E]/65">Designs Generated</span>
                    <Sparkles className="h-4 w-4 text-[#C87960]" />
                  </div>
                  <div className="mt-1 font-editorial text-3xl font-semibold text-[#172B3A]">
                    {stats.designs_generated || designs.length}
                  </div>
                </div>

                <div className="editorial-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#252B2E]/65">Saved Designs</span>
                    <Bookmark className="h-4 w-4 text-[#172B3A]" />
                  </div>
                  <div className="mt-1 font-editorial text-3xl font-semibold text-[#172B3A]">
                    {savedDesigns.length}
                  </div>
                </div>

                <div className="editorial-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#252B2E]/65">Active Projects</span>
                    <FolderPlus className="h-4 w-4 text-[#9BAE9A]" />
                  </div>
                  <div className="mt-1 font-editorial text-3xl font-semibold text-[#172B3A]">
                    {projects.length}
                  </div>
                </div>
              </div>

              {/* Section 1: Recent AI Generated Designs */}
              <div className="editorial-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#172B3A]">
                      Recent AI Room Redesigns
                    </h2>
                    <p className="text-xs text-[#252B2E]/65 mt-0.5">
                      Your latest generated architectural spaces ({designs.length} total)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTab("history")}
                      className="text-xs font-semibold text-[#C87960] hover:underline"
                    >
                      View All ({designs.length})
                    </button>
                    <Link to="/studio" className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> New AI Design
                    </Link>
                  </div>
                </div>

                {designs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#DCCBB5] p-8 text-center bg-[#F7F4ED]/40">
                    <Sparkles className="mx-auto h-8 w-8 text-[#C87960]/60 mb-2" />
                    <p className="text-sm font-medium text-[#172B3A]">No designs generated yet</p>
                    <p className="text-xs text-[#252B2E]/65 mt-1">
                      Upload an interior or exterior room photo in the AI Studio to start.
                    </p>
                    <Link to="/studio" className="btn-primary mt-4 py-2 px-5 text-xs inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Open AI Design Studio
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {designs.slice(0, 3).map((d) => (
                      <div
                        key={d.id}
                        className="group flex flex-col justify-between rounded-2xl border border-[#DCCBB5] bg-white overflow-hidden shadow-sm transition hover:shadow-md"
                      >
                        <div className="relative aspect-[16/11] bg-black/5 overflow-hidden">
                          <img
                            src={d.generated_image_url}
                            alt={d.style}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="rounded-full bg-[#172B3A]/85 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
                              {d.category}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSave(d.id)}
                            className="absolute top-2.5 right-2.5 rounded-full bg-white/90 p-1.5 text-[#172B3A] shadow-sm backdrop-blur-sm transition hover:bg-white"
                            title={d.is_saved ? "Remove from Saved" : "Save Design"}
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${d.is_saved ? "fill-[#C87960] text-[#C87960]" : "text-[#172B3A]"}`}
                            />
                          </button>
                        </div>
                        <div className="p-3.5 flex flex-col flex-1 justify-between">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C87960]">
                              {d.feature_type.replace(/_/g, " ")}
                            </div>
                            <div className="font-editorial text-base font-semibold text-[#172B3A] mt-0.5">
                              {d.style}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-[#DCCBB5]/50 flex items-center justify-between gap-2">
                            <Link
                              to={`/budget-estimator?image=${encodeURIComponent(d.generated_image_url)}&style=${encodeURIComponent(d.style)}&room=${encodeURIComponent(d.category)}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#C87960]/10 px-2.5 py-1 text-[11px] font-medium text-[#C87960] hover:bg-[#C87960]/20 transition"
                            >
                              <Calculator className="h-3 w-3" /> Cost Estimator
                            </Link>
                            <a
                              href={d.generated_image_url}
                              download={`formaspace-${d.id}.jpg`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] bg-white px-2 py-1 text-[11px] text-[#172B3A] hover:bg-[#F7F4ED] transition"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Recently Edited Projects */}
              <div className="editorial-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#172B3A]">
                      Projects & Workspaces
                    </h2>
                    <p className="text-xs text-[#252B2E]/65 mt-0.5">
                      Organized architectural design folders ({projects.length} project{projects.length !== 1 ? "s" : ""})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("projects")}
                    className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1.5"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> Manage Projects
                  </button>
                </div>

                {projects.length === 0 ? (
                  <p className="text-xs text-[#252B2E]/65">No projects yet. Create one in My Projects.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="cursor-pointer rounded-2xl border border-[#DCCBB5] bg-white overflow-hidden shadow-sm transition hover:shadow-md"
                        onClick={() => setTab("projects")}
                      >
                        <img
                          src={p.cover_image || "/images/hero-after.jpg"}
                          alt={p.title}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-3.5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-[#C87960]">{p.category}</div>
                            <div className="font-medium text-sm text-[#172B3A] truncate">{p.title}</div>
                          </div>
                          <span className="text-xs text-[#172B3A]/60">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Direct Design Shortcuts */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Link
                  to="/studio"
                  className="editorial-card p-5 transition hover:border-[#C87960] hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-[#172B3A] p-2.5 text-white">
                      <Wand2 className="h-4 w-4 text-[#9BAE9A]" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#252B2E]/40 transition group-hover:translate-x-1 group-hover:text-[#C87960]" />
                  </div>
                  <h3 className="mt-3 font-editorial text-base font-semibold text-[#172B3A]">
                    AI Room Redesign Studio
                  </h3>
                  <p className="mt-1 text-xs text-[#252B2E]/65">
                    Generate instant architectural interiors, exteriors & gardens.
                  </p>
                </Link>

                <Link
                  to="/furniture-finder"
                  className="editorial-card p-5 transition hover:border-[#C87960] hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-[#C87960] p-2.5 text-white">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#252B2E]/40 transition group-hover:translate-x-1 group-hover:text-[#C87960]" />
                  </div>
                  <h3 className="mt-3 font-editorial text-base font-semibold text-[#172B3A]">
                    Smart Furniture Finder
                  </h3>
                  <p className="mt-1 text-xs text-[#252B2E]/65">
                    Detect visible furniture and discover purchasable matching items.
                  </p>
                </Link>

                <Link
                  to="/explore"
                  className="editorial-card p-5 transition hover:border-[#C87960] hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-[#9BAE9A] p-2.5 text-[#172B3A]">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#252B2E]/40 transition group-hover:translate-x-1 group-hover:text-[#C87960]" />
                  </div>
                  <h3 className="mt-3 font-editorial text-base font-semibold text-[#172B3A]">
                    Explore Styles & Inspiration
                  </h3>
                  <p className="mt-1 text-xs text-[#252B2E]/65">
                    Browse curated architectural aesthetics and color palettes.
                  </p>
                </Link>
              </div>
            </>
          )}

          {/* TAB 2: MY PROJECTS */}
          {tab === "projects" && (
            <div className="editorial-card p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                    Projects & Folders
                  </h2>
                  <p className="text-xs text-[#252B2E]/65 mt-0.5">
                    Organize your design projects and room transformations
                  </p>
                </div>
                <form onSubmit={handleCreateFolder} className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name..."
                    className="rounded-full border border-[#DCCBB5] bg-[#F7F4ED]/60 px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#C87960]"
                  />
                  <button type="submit" className="btn-secondary py-1.5 px-4 text-xs">
                    <FolderPlus className="h-3.5 w-3.5" /> Add Folder
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFolder("")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${selectedFolder === "" ? "bg-[#172B3A] text-white" : "bg-[#F7F4ED] text-[#252B2E] hover:bg-[#DCCBB5]/40"
                    }`}
                >
                  All Folders ({projects.length})
                </button>
                {folders.map((f) => {
                  const folderCount = projects.filter((p) => p.folder_id === f.id).length;
                  const isSelected = selectedFolder === f.id;
                  return (
                    <div
                      key={f.id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                        isSelected
                          ? "border-[#C87960] bg-[#C87960] text-white"
                          : "border-[#DCCBB5] bg-white text-[#172B3A] hover:bg-[#F7F4ED]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFolder(isSelected ? "" : f.id)}
                        className="flex items-center gap-1.5 focus:outline-none"
                      >
                        <span>{f.name}</span>
                        <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#252B2E]/60"}`}>
                          ({folderCount})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFolder(e, f.id)}
                        className={`ml-1 rounded-full p-0.5 transition ${
                          isSelected
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-red-50 text-[#252B2E]/50 hover:text-red-700"
                        }`}
                        title={`Delete folder "${f.name}"`}
                        aria-label={`Delete ${f.name} folder`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleCreateProject} className="flex flex-wrap gap-2 border-t border-[#DCCBB5]/60 pt-4">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="New project title (e.g. Master Bedroom Renovation)..."
                  className="flex-1 min-w-[200px] rounded-full border border-[#DCCBB5] bg-[#F7F4ED]/60 px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#C87960]"
                />
                <select
                  value={newProjectCat}
                  onChange={(e) => setNewProjectCat(e.target.value)}
                  className="rounded-full border border-[#DCCBB5] bg-white px-4 py-2 text-xs"
                >
                  <option>Living Room</option>
                  <option>Bedroom</option>
                  <option>Kitchen</option>
                  <option>Bathroom</option>
                  <option>Dining Room</option>
                  <option>Office</option>
                  <option>House Exterior</option>
                  <option>Garden</option>
                </select>
                <button type="submit" className="btn-primary py-2 px-5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create Project
                </button>
              </form>

              {visibleProjects.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#252B2E]/65">
                  {selectedFolder
                    ? "No projects in this folder yet. Use the form above to add one, or select 'All Folders'."
                    : "No projects created yet. Use the form above to create your first design project."}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProjects.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-[#DCCBB5] bg-white overflow-hidden shadow-sm hover:shadow-md transition">
                      <img src={p.cover_image || "/images/hero-after.jpg"} alt={p.title} className="h-36 w-full object-cover" />
                      <div className="p-4 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold uppercase text-[#C87960] truncate">{p.category}</div>
                          <div className="font-semibold text-sm text-[#172B3A] truncate">{p.title}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/studio?room=${encodeURIComponent(p.category)}&title=${encodeURIComponent(p.title)}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#172B3A] hover:bg-[#F7F4ED] hover:text-[#C87960] transition"
                            title="Open in AI Design Studio"
                          >
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3 & 4: DESIGN HISTORY & SAVED DESIGNS */}
          {(tab === "saved" || tab === "history") && (
            <div className="editorial-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                    {tab === "saved" ? "Saved Designs" : "Complete Design History"}
                  </h2>
                  <p className="text-xs text-[#252B2E]/65 mt-0.5">
                    {tab === "saved"
                      ? `Your pinned architectural concepts (${savedDesigns.length} saved)`
                      : `All generated designs from your studio sessions (${designs.length} total)`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full border border-[#DCCBB5] bg-[#F7F4ED] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTab("history")}
                      className={`rounded-full px-3.5 py-1 font-medium transition ${tab === "history" ? "bg-[#172B3A] text-white" : "text-[#252B2E]"
                        }`}
                    >
                      All ({designs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("saved")}
                      className={`rounded-full px-3.5 py-1 font-medium transition ${tab === "saved" ? "bg-[#172B3A] text-white" : "text-[#252B2E]"
                        }`}
                    >
                      Saved ({savedDesigns.length})
                    </button>
                  </div>
                  <Link to="/studio" className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> New Redesign
                  </Link>
                </div>
              </div>

              {(tab === "saved" ? savedDesigns : designs).length === 0 ? (
                <div className="py-16 text-center">
                  <Bookmark className="mx-auto h-8 w-8 text-[#DCCBB5] mb-2" />
                  <p className="text-sm font-medium text-[#172B3A]">
                    {tab === "saved" ? "No saved designs yet" : "No designs generated yet"}
                  </p>
                  <p className="text-xs text-[#252B2E]/65 mt-1">
                    {tab === "saved"
                      ? "Click the bookmark icon on any design card to pin it here."
                      : "Start designing in the AI Studio to create your first space."}
                  </p>
                  <Link to="/studio" className="btn-primary mt-4 py-2 px-5 text-xs inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Start Designing
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(tab === "saved" ? savedDesigns : designs).map((d) => (
                    <div
                      key={d.id}
                      className="group flex flex-col justify-between rounded-2xl border border-[#DCCBB5] bg-white overflow-hidden shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-[16/11] bg-black/5 overflow-hidden">
                        <img
                          src={d.generated_image_url}
                          alt={d.style}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="rounded-full bg-[#172B3A]/85 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
                            {d.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSave(d.id)}
                          className="absolute top-2.5 right-2.5 rounded-full bg-white/90 p-1.5 text-[#172B3A] shadow-sm backdrop-blur-sm transition hover:bg-white"
                          title={d.is_saved ? "Remove from Saved" : "Save Design"}
                        >
                          <Bookmark
                            className={`h-3.5 w-3.5 ${d.is_saved ? "fill-[#C87960] text-[#C87960]" : "text-[#172B3A]"}`}
                          />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-1 justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C87960]">
                            {d.feature_type.replace(/_/g, " ")} · {d.intervention_level}
                          </div>
                          <div className="font-editorial text-lg font-semibold text-[#172B3A] mt-0.5">
                            {d.style}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#DCCBB5]/60 flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={`/budget-estimator?image=${encodeURIComponent(d.generated_image_url)}&style=${encodeURIComponent(d.style)}&room=${encodeURIComponent(d.category)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#C87960]/10 px-2.5 py-1.5 text-xs font-semibold text-[#C87960] hover:bg-[#C87960]/20 transition"
                          >
                            <Calculator className="h-3.5 w-3.5" /> Estimate Furniture Cost
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={d.generated_image_url}
                              download={`formaspace-${d.id}.jpg`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#172B3A] hover:bg-[#F7F4ED] transition"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDesign(d.id)}
                              className="inline-flex items-center rounded-lg border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50 transition"
                              title="Delete Design"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FURNITURE COLLECTION */}
          {tab === "furniture" && (
            <div className="editorial-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                    Furniture Collection
                  </h2>
                  <p className="text-xs text-[#252B2E]/65 mt-0.5">
                    Saved furniture pieces and matching interior furnishings ({furniture.length} item{furniture.length !== 1 ? "s" : ""})
                  </p>
                </div>
                <Link to="/furniture-finder" className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Browse Furniture Finder
                </Link>
              </div>

              {furniture.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-[#DCCBB5] mb-2" />
                  <p className="text-sm font-medium text-[#172B3A]">No furniture items saved yet</p>
                  <p className="text-xs text-[#252B2E]/65 mt-1">
                    Discover matching chairs, sofas, beds, and decor using the Smart Furniture Finder.
                  </p>
                  <Link to="/furniture-finder" className="btn-primary mt-4 py-2 px-5 text-xs inline-flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Find Furniture
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {furniture.map((f) => (
                    <div key={f.id} className="rounded-2xl border border-[#DCCBB5] bg-white p-3.5 shadow-sm">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5">
                        <img src={f.image_url} alt={f.product_name} className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">{f.category}</div>
                        <div className="font-semibold text-sm text-[#172B3A] line-clamp-1">{f.product_name}</div>
                        <div className="text-xs text-[#252B2E]/70 line-clamp-1 mt-0.5">{f.material}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#DCCBB5]/50 flex items-center justify-between">
                        <span className="font-editorial text-base font-bold text-[#C87960]">
                          ~${f.approx_price}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={getDirectRetailerUrl(f)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#172B3A] hover:text-[#C87960] flex items-center gap-1 font-medium"
                            title={`Open exact ${f.product_name} on original retailer store`}
                          >
                            Buy <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteFurniture(f.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COST ESTIMATES */}
          {tab === "budgets" && (
            <div className="editorial-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                    Furniture & Cost Estimates
                  </h2>
                  <p className="text-xs text-[#252B2E]/65 mt-0.5">
                    Saved room estimations and furniture budget scenarios ({budgets.length} saved)
                  </p>
                </div>
                <Link to="/budget-estimator" className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" /> New Cost Estimate
                </Link>
              </div>

              {budgets.length === 0 ? (
                <div className="py-16 text-center">
                  <Calculator className="mx-auto h-8 w-8 text-[#DCCBB5] mb-2" />
                  <p className="text-sm font-medium text-[#172B3A]">No cost estimates saved yet</p>
                  <p className="text-xs text-[#252B2E]/65 mt-1">
                    Calculate full furniture costs, materials, and surface finishes for any space.
                  </p>
                  <Link to="/budget-estimator" className="btn-primary mt-4 py-2 px-5 text-xs inline-flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" /> Calculate Room Cost
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {budgets.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCCBB5] bg-white p-4 shadow-sm"
                    >
                      <div>
                        <div className="font-semibold text-sm text-[#172B3A]">{b.title}</div>
                        <div className="text-xs text-[#252B2E]/65 mt-0.5">
                          {b.inputs?.room_type || "Room"} · {b.inputs?.flooring_material || "Finishes"} · {b.inputs?.renovation_quality || "Standard"}
                        </div>
                        <div className="text-[11px] text-[#252B2E]/50 mt-1">
                          Created {b.created_at ? new Date(b.created_at).toLocaleDateString() : "Recently"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-[#252B2E]/60 font-semibold">
                            Total Estimate
                          </div>
                          <div className="font-editorial text-xl font-bold text-[#172B3A]">
                            ${Math.round(b.estimated_total).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/budget-estimator?room=${encodeURIComponent(b.inputs?.room_type || "Bedroom")}`}
                            className="btn-secondary py-1.5 px-3.5 text-xs"
                          >
                            View Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteBudget(b.id)}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50 transition"
                            title="Delete Estimate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ACCOUNT SETTINGS */}
          {tab === "settings" && (
            <div className="editorial-card p-6 space-y-6 max-w-2xl">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                  Account Settings
                </h2>
                <p className="text-xs text-[#252B2E]/65 mt-0.5">
                  Manage your architectural profile, plan tier, and credentials
                </p>
              </div>

              {/* Plan Summary Card */}
              <div className="rounded-2xl border border-[#DCCBB5] bg-[#F7F4ED]/60 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#C87960]">
                    Current Subscription
                  </div>
                  <div className="font-editorial text-lg font-semibold text-[#172B3A] capitalize">
                    {user.plan_id} Plan · {user.role === "admin" ? "Administrator" : "Architect"}
                  </div>
                  <div className="text-xs text-[#252B2E]/70 mt-0.5">
                    Architectural plan active · Full access to design studio & modules.
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#252B2E]">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C87960]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#252B2E]">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED] px-3.5 py-2.5 text-sm text-[#252B2E]/60 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-[#252B2E]/50">
                    Primary login identity for this architectural workspace.
                  </p>
                </div>
                <div className="pt-2">
                  <button type="submit" className="btn-primary py-2.5 px-6 text-xs">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
