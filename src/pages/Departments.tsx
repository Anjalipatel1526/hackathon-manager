import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Building2, Search, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { googleSheets } from "@/lib/googleSheets";
import Candidates from "./Candidates";
import { Skeleton } from "@/components/ui/skeleton";

const Departments = () => {
  const [newDept, setNewDept] = useState("");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await googleSheets.getDepartments();
      if (res.result === "success") {
        return res.data || ["HR", "Tech", "Finance", "Marketing", "Operations"];
      }
      return ["HR", "Tech", "Finance", "Marketing", "Operations"];
    }
  });

  const [activeTab, setActiveTab] = useState("");

  // Automatically set first tab as active when departments load
  if (!activeTab && departments.length > 0) {
    setActiveTab(departments[0]);
  }

  const addMutation = useMutation({
    mutationFn: (name: string) => googleSheets.addDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Department Added", description: `${newDept} has been created.` });
      setNewDept("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to add", description: err.message, variant: "destructive" });
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    addMutation.mutate(newDept.trim());
  };

  const filteredDepts = departments.filter(d => d.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" /> Sector Management
        </h1>
        <p className="text-muted-foreground">Manage and monitor talent distribution across corporate departments.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Add Department Card */}
        <Card className="md:col-span-1 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">New Department</CardTitle>
            <CardDescription>Expand the organizational structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="e.g. Research & Development"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <Button className="w-full gap-2" disabled={addMutation.isPending || !newDept.trim()}>
                <Plus className="h-4 w-4" /> {addMutation.isPending ? "Adding..." : "Add Department"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search & Tabs Card */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Operational View</CardTitle>
              <CardDescription>Browse candidates by sector.</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Filter sectors..."
                className="pl-8 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 gap-1">
                  {filteredDepts.map((d) => (
                    <TabsTrigger
                      key={d}
                      value={d}
                      className="px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      {d}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="mt-6">
                  {departments.map((d) => (
                    <TabsContent key={d} value={d} className="mt-0">
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span className="font-bold text-sm">{d} Candidates</span>
                          </div>
                        </div>
                        <Candidates filterDepartment={d} />
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground italic">No departments configured.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Departments;
