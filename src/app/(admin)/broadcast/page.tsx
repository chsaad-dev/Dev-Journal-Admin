"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Send, History, Loader2, Smartphone, Bell } from "lucide-react";
import { sendBroadcast } from "@/lib/notify";
import { logBroadcast, subscribeToRecentBroadcasts, BroadcastHistory } from "@/lib/broadcasts";
import ConfirmModal from "@/components/ConfirmModal";
import { auth } from "@/lib/firebase";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<BroadcastHistory[]>([]);

  useEffect(() => {
    const unsub = subscribeToRecentBroadcasts(setRecentBroadcasts);
    return () => unsub();
  }, []);

  const handleSend = async () => {
    setShowConfirm(false);
    setError(null);
    setSuccessMsg(null);
    setIsSending(true);
    
    try {
      const adminUid = auth.currentUser?.uid || "unknown";
      
      // 1. Send via Cloudflare Worker to all FCM tokens
      const result = await sendBroadcast(title.trim(), body.trim());
      
      // 2. Log to Firestore history
      await logBroadcast(title.trim(), body.trim(), adminUid);
      
      setSuccessMsg(`Successfully sent to ${result.sentCount || "all"} users!`);
      setTitle("");
      setBody("");
    } catch (err: any) {
      setError(err.message || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Sending...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Broadcast Notification</h1>
      </div>

      <div className="bg-error-container/20 border border-error-container rounded-[var(--radius-card)] p-5 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-error shrink-0 mt-0.5" />
        <div>
          <h3 className="text-error font-semibold text-lg">Use with Extreme Caution</h3>
          <p className="text-on-surface-variant mt-1">
            Sending a broadcast pushes a live notification to <strong>every single active user</strong> of the Android application instantly. This cannot be undone or recalled. Ensure your message is final before confirming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Composer Form */}
        <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 space-y-6">
          <h2 className="text-xl font-semibold text-on-surface">Compose Message</h2>
          
          {error && <div className="text-error text-sm font-medium">{error}</div>}
          {successMsg && <div className="text-success text-sm font-medium">{successMsg}</div>}

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-sm font-medium text-on-surface-variant">Notification Title <span className="text-error">*</span></label>
              <span className={`text-xs ${title.length > 50 ? 'text-error' : 'text-on-surface-variant'}`}>{title.length}/50</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              placeholder="e.g. New Version Available!"
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-sm font-medium text-on-surface-variant">Message Body <span className="text-error">*</span></label>
              <span className={`text-xs ${body.length > 150 ? 'text-error' : 'text-on-surface-variant'}`}>{body.length}/150</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 150))}
              placeholder="Keep it brief and actionable..."
              rows={4}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary-container transition-colors resize-none placeholder:text-on-surface-variant/50"
            />
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSending || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-container hover:bg-[#4338ca] text-on-surface font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSending ? "Broadcasting to all users..." : "Send Broadcast Now"}
          </button>
        </div>

        {/* Live Preview & History */}
        <div className="space-y-8">
          
          {/* Mock Android Preview */}
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 space-y-6">
            <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-on-surface-variant" />
              Live Preview
            </h2>
            
            <div className="bg-surface-container-high rounded-2xl p-4 max-w-sm mx-auto shadow-xl border border-outline-variant/50 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
              <div className="absolute top-2 right-4 text-[10px] text-on-surface-variant">12:00</div>
              
              <div className="bg-[#191f2f] rounded-xl p-4 shadow-md flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs text-on-surface-variant mb-1 font-medium tracking-wide">DevJournal</div>
                  <h4 className="text-on-surface font-semibold truncate">{title || "Notification Title"}</h4>
                  <p className="text-on-surface-variant text-sm mt-0.5 line-clamp-2">
                    {body || "This is how your message will appear on an Android device."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 space-y-4">
            <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
              <History className="w-5 h-5 text-on-surface-variant" />
              Recent Broadcasts
            </h2>
            
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No broadcasts sent yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBroadcasts.map((b) => (
                  <div key={b.id} className="bg-surface-container-high rounded-lg p-3 border border-outline-variant/50">
                    <h4 className="text-sm font-semibold text-on-surface">{b.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{b.body}</p>
                    <div className="text-[10px] text-tertiary mt-2 text-right">
                      {formatDate(b.sentAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Broadcast"
        message={`Are you absolutely sure you want to send this notification to ALL active users?\n\nTitle: "${title}"`}
        confirmText="Yes, Send to Everyone"
        onConfirm={handleSend}
        onCancel={() => setShowConfirm(false)}
      />

    </div>
  );
}
