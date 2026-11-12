import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, KeyRound, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  connectSupabaseAccount,
  disconnectSupabaseAccount,
  listConnectedAccounts,
  updateAccountToken,
} from "@/lib/uptime-api";

const TOKEN_URL = "https://supabase.com/dashboard/account/tokens";

export function ConnectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newToken, setNewToken] = useState("");


  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");

  const accounts = useQuery({
    queryKey: ["connected-accounts"],
    queryFn: () => listConnectedAccounts(),
    enabled: open,
  });

  const connectMutation = useMutation({
    mutationFn: async () => connectSupabaseAccount(label ? { token, label } : { token }),
    onSuccess: async (result) => {
      if (!result.ok) {
        toast.error("Connection failed", { description: result.message });
        return;
      }
      toast.success("Account connected", {
        description: `${result.organizations || "Supabase"} · ${result.discovered} projects found`,
      });
      setToken("");
      setLabel("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["connected-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["uptime-data"] }),
      ]);
      onOpenChange(false);
    },
    onError: () =>
      toast.error("Connection failed", { description: "Please check the token and try again." }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => disconnectSupabaseAccount({ id }),
    onSuccess: async () => {
      toast.success("Account removed");
      await queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => updateAccountToken({ id, token: newToken.trim() }),
    onSuccess: async (result) => {
      if (!result.ok) {
        toast.error("Could not update token", { description: result.message });
        return;
      }
      toast.success("Token updated");
      setEditingId(null);
      setNewToken("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["connected-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["uptime-data"] }),
      ]);
    },
    onError: () =>
      toast.error("Could not update token", { description: "Please check the token and retry." }),
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a Supabase account</DialogTitle>
          <DialogDescription>
            Authorize an account once and every project inside it is monitored automatically.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            1. Open your Supabase account tokens page and create a token.
            <a
              href={TOKEN_URL}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1 font-medium text-primary"
            >
              Open Supabase <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>2. Copy it and paste it below — it is stored encrypted in your own Supabase project.</li>
        </ol>

        <div className="mt-2 space-y-3">
          <Input
            placeholder="Account name (optional, e.g. Personal)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Input
            type="password"
            autoComplete="off"
            placeholder="sbp_..."
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={token.trim().length < 20 || connectMutation.isPending}
            onClick={() => connectMutation.mutate()}
          >
            {connectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing…
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" /> Authorize and scan projects
              </>
            )}
          </Button>
        </div>

        {(accounts.data?.length ?? 0) > 0 && (
          <div className="mt-4 max-h-[45vh] overflow-y-auto border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Connected accounts — press “Update token” to paste a fresh one
            </p>
            <ul className="mt-2 space-y-2">
              {accounts.data?.map((account) => (
                <li
                  key={account.id}
                  className={`rounded-lg border p-2 text-sm ${
                    account.token_readable ? "border-border/60" : "border-destructive/50 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-medium">{account.label}</span>
                      {!account.token_readable && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" /> token needs updating
                        </span>
                      )}
                      {account.organization_names && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {account.organization_names}
                        </span>
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant={account.token_readable ? "outline" : "default"}
                        onClick={() => {
                          setEditingId(editingId === account.id ? null : account.id);
                          setNewToken("");
                        }}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Update token
                      </Button>
                      <button
                        onClick={() => disconnectMutation.mutate(account.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remove ${account.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {editingId === account.id && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="password"
                        autoComplete="off"
                        placeholder="Paste a new sbp_... token"
                        value={newToken}
                        onChange={(event) => setNewToken(event.target.value)}
                      />
                      <Button
                        size="sm"
                        disabled={newToken.trim().length < 20 || updateMutation.isPending}
                        onClick={() => updateMutation.mutate(account.id)}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  )}
                </li>
              ))}

            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
