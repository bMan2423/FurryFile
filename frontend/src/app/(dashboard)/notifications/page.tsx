"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import type { Notification } from "@/types";
import { formatDateTime, capitalize } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/notifications")).data,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter((n) => !n.is_read).map((n) => n.id) ?? [];
      if (unread.length === 0) return;
      return api.patch("/notifications/read", { notification_ids: unread });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : notifications?.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {notifications?.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "py-4 flex items-start gap-3",
                !notif.is_read && "bg-primary-50/30"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                notif.is_read ? "bg-gray-200" : "bg-primary-500"
              )} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("font-medium text-sm", !notif.is_read && "text-gray-900")}>
                    {notif.title}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDateTime(notif.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                <span className="badge bg-gray-100 text-gray-600 mt-1">
                  {capitalize(notif.type.replace(/_/g, " "))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
