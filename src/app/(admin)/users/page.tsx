"use client";

import { useEffect, useState, useMemo } from "react";
import { UserProfile } from "@/types/user";
import { subscribeToAllUsers, updateUserRole, setUserSuspended } from "@/lib/users";
import { Search, Users as UsersIcon, MoreVertical, ShieldAlert, Shield, Ban, CheckCircle2, User as UserPlaceholder } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";

type FilterStatus = "All" | "Admins" | "Readers" | "Suspended";

type ConfirmAction = {
  type: "promote" | "demote" | "suspend" | "unsuspend";
  user: UserProfile;
} | null;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");
  
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((data) => {
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!users) return null;
    return users.filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filter === "Admins") matchesFilter = user.role === "admin";
      if (filter === "Readers") matchesFilter = user.role === "reader";
      if (filter === "Suspended") matchesFilter = user.suspended === true;

      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filter]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    
    try {
      const { type, user } = confirmAction;
      if (type === "promote") await updateUserRole(user.uid, "admin");
      if (type === "demote") await updateUserRole(user.uid, "reader");
      if (type === "suspend") await setUserSuspended(user.uid, true);
      if (type === "unsuspend") await setUserSuspended(user.uid, false);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setConfirmAction(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Users</h1>
        {users && (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium border border-outline-variant">
            {users.length}
          </span>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1">
          {(["All", "Admins", "Readers", "Suspended"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f
                  ? "bg-primary-container text-on-surface shadow"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] overflow-visible shadow-lg">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-high border-b border-outline-variant text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              
              {/* Loading State */}
              {!filteredUsers && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-8 h-8 bg-surface-container-high rounded-full"></div><div className="w-32 h-4 bg-surface-container-high rounded"></div></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-5 bg-surface-container-high rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-5 bg-surface-container-high rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-8 h-8 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {filteredUsers && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                        <UsersIcon className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-on-surface">No users found</h3>
                        <p className="text-on-surface-variant text-sm mt-1">
                          No users match your current filters.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {filteredUsers && filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-surface-container-high" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                          <UserPlaceholder className="w-4 h-4 text-on-surface-variant" />
                        </div>
                      )}
                      <div className="flex flex-col truncate max-w-[200px]">
                        <span className="font-medium text-on-surface truncate">{user.name || "Unknown User"}</span>
                        <span className="text-xs text-on-surface-variant truncate">{user.email || "No email"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-container text-on-surface">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                        Reader
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">
                    <div>{user.followerCount || 0} followers</div>
                    <div>{user.followingCount || 0} following</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.suspended ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error-container text-error border border-error/20">
                        <Ban className="w-3 h-3 mr-1" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-container text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative group inline-block">
                      <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-surface-container border border-outline-variant rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1 overflow-hidden">
                        
                        <Link href="#" className="block px-4 py-2 text-sm text-left text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
                          View Profile
                        </Link>
                        
                        <div className="h-px bg-outline-variant my-1" />
                        
                        {user.role === "admin" ? (
                          <button 
                            onClick={() => setConfirmAction({ type: "demote", user })}
                            className="w-full px-4 py-2 text-sm text-left text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                          >
                            Demote to Reader
                          </button>
                        ) : (
                          <button 
                            onClick={() => setConfirmAction({ type: "promote", user })}
                            className="w-full px-4 py-2 text-sm text-left text-on-surface-variant hover:bg-surface-container-high hover:text-primary-container"
                          >
                            Promote to Admin
                          </button>
                        )}
                        
                        {user.suspended ? (
                          <button 
                            onClick={() => setConfirmAction({ type: "unsuspend", user })}
                            className="w-full px-4 py-2 text-sm text-left text-success hover:bg-success-container transition-colors"
                          >
                            Unsuspend User
                          </button>
                        ) : (
                          <button 
                            onClick={() => setConfirmAction({ type: "suspend", user })}
                            className="w-full px-4 py-2 text-sm text-left text-error hover:bg-error-container transition-colors"
                          >
                            Suspend User
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "promote" ? "Promote to Admin" :
          confirmAction?.type === "demote" ? "Demote to Reader" :
          confirmAction?.type === "suspend" ? "Suspend User" :
          "Unsuspend User"
        }
        message={
          confirmAction?.type === "promote" ? `Are you sure you want to promote ${confirmAction.user.name} to Admin? They will have full access to this panel.` :
          confirmAction?.type === "demote" ? `Are you sure you want to demote ${confirmAction.user.name} to Reader? They will lose access to this panel.` :
          confirmAction?.type === "suspend" ? `Are you sure you want to suspend ${confirmAction.user.name}? They will not be able to interact with the app.` :
          `Are you sure you want to unsuspend ${confirmAction?.user.name}? Their access will be restored.`
        }
        confirmText={
          confirmAction?.type === "promote" ? "Promote" :
          confirmAction?.type === "demote" ? "Demote" :
          confirmAction?.type === "suspend" ? "Suspend" :
          "Unsuspend"
        }
        confirmColorClass={
          (confirmAction?.type === "suspend" || confirmAction?.type === "demote") 
            ? "bg-error-container text-error hover:bg-error hover:text-on-surface border border-error-container"
            : "bg-primary-container text-on-surface hover:bg-[#4338ca] border border-primary-container"
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

    </div>
  );
}
