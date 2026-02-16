import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Shield, BadgeCheck } from "lucide-react";

const DashboardSettings = () => {
  const { user, roles } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground italic">Manage your administrative profile and access privileges.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Profile Identity</CardTitle>
              <CardDescription>Your registered administrative details.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Primary Email</span>
              <span className="text-sm font-bold text-foreground bg-muted/30 p-2 rounded-lg border border-border/50">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Account Status</span>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-tighter">
                <BadgeCheck className="h-4 w-4" /> Fully Authorized
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Access Matrix</CardTitle>
              <CardDescription>Verified system roles and permissions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Assigned Roles</span>
              <div className="flex flex-wrap gap-2">
                {roles.length > 0 ? roles.map(role => (
                  <span key={role} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full border border-indigo-500/20">
                    {role}
                  </span>
                )) : (
                  <span className="text-sm text-muted-foreground italic">No specific roles identified.</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] font-medium text-amber-700 leading-relaxed italic">
              Note: System roles are managed by the core infrastructure panel. Contact the lead engineer for privilege elevation.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSettings;
