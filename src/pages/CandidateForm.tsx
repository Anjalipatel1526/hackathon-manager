import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Upload, Users, User, Github, FileArchive } from "lucide-react";
import { candidateApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const TRACKS = [
  "Education",
  "Entertainment",
  "AI Agent and Automation",
  "Core AI/ML",
  "Big Data",
  "Mass Communication",
  "Cutting Agents"
];

const toBase64 = (file: File) => new Promise<{ base64: string, name: string, type: string }>((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64String = (reader.result as string).split(',')[1];
    resolve({
      base64: base64String,
      name: file.name,
      type: file.type
    });
  };
  reader.onerror = error => reject(error);
});

const CandidateForm = () => {
  const [globalPhase, setGlobalPhase] = useState<number>(() => {
    const saved = localStorage.getItem("codekarx_global_phase");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [phase, setPhase] = useState<"1" | "2">(() => {
    const saved = localStorage.getItem("codekarx_global_phase");
    return (saved || "1") as "1" | "2";
  });
  const [regType, setRegType] = useState<"Individual" | "Team">(() => (localStorage.getItem("codekarx_reg_type") as any) || "Individual");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [submitted, setSubmitted] = useState(() => localStorage.getItem("codekarx_cached_submitted") === "true");
  const [teamSize, setTeamSize] = useState<number>(2);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("codekarx_cached_form_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cached form data");
      }
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      collegeCompany: "",
      teamName: "",
      teamLeaderName: "",
      teamLeaderEmail: "",
      projectDescription: "",
      githubRepoLink: "",
      registrationId: "",
      transactionId: "",
      projectName: "",
      member1Email: "",
      member2Email: "",
      member3Email: "",
      member4Email: "",
    };
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  // Logic to fetch registration details by Transaction ID (for Phase 2 resume)
  const handleFetchByTransactionId = async (id: string) => {
    if (!id || id.length < 5) return;
    setFetchingData(true);
    try {
      const data = await candidateApi.getApplicationByRegId(id);
      if (data) {
        // Sync registration type and form data
        if (data.registrationType) {
          setRegType(data.registrationType);
          localStorage.setItem("codekarx_reg_type", data.registrationType);
        }

        const newFormData = {
          ...formData,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          department: data.department || "",
          collegeCompany: data.collegeCompany || "",
          teamName: data.teamName || "",
          teamLeaderName: data.teamLeaderName || "",
          teamLeaderEmail: data.teamLeaderEmail || "",
          projectDescription: data.projectDescription || "",
          githubRepoLink: data.githubRepoLink || "",
          registrationId: data.registrationId || data.transactionId,
          transactionId: data.transactionId || id,
          projectName: data.projectName || "",
          member1Email: data.member1Email || "",
          member2Email: data.member2Email || "",
          member3Email: data.member3Email || "",
          member4Email: data.member4Email || "",
        };

        setFormData(newFormData);
        localStorage.setItem("codekarx_cached_form_data", JSON.stringify(newFormData));

        // Check if already submitted for current phase
        if (globalPhase === 1 && data.projectDescription) {
          setSubmitted(true);
          localStorage.setItem("codekarx_cached_submitted", "true");
        } else if (globalPhase === 2 && data.githubRepoLink) {
          setSubmitted(true);
          localStorage.setItem("codekarx_cached_submitted", "true");
        }

        toast({ title: "Registration Loaded", description: `Found project: ${data.projectName}` });
      }
    } catch (err) {
      console.warn("No existing registration found for this ID yet.");
    } finally {
      setFetchingData(false);
    }
  };

  // Watch transactionId for resume logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.transactionId && !submitted) {
        handleFetchByTransactionId(formData.transactionId);
      }
    }, 1500); // 1.5s debounce
    return () => clearTimeout(timer);
  }, [formData.transactionId]);

  useEffect(() => {
    const initPhase = async () => {
      try {
        const currentGlobalPhase = await candidateApi.getPhase();
        setGlobalPhase(currentGlobalPhase);
        localStorage.setItem("codekarx_global_phase", currentGlobalPhase.toString());
        setPhase(currentGlobalPhase.toString() as "1" | "2");
      } catch (error) {
        console.error("Failed to load Phase");
      }
    }
    initPhase();
  }, [globalPhase]);

  const handleClearSession = () => {
    localStorage.removeItem("codekarx_reg_id");
    localStorage.removeItem("codekarx_cached_form_data");
    localStorage.removeItem("codekarx_cached_submitted");
    localStorage.removeItem("codekarx_cached_team_members");
    localStorage.removeItem("codekarx_reg_type");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      collegeCompany: "",
      teamName: "",
      teamLeaderName: "",
      teamLeaderEmail: "",
      projectDescription: "",
      githubRepoLink: "",
      registrationId: "",
      transactionId: "",
      projectName: "",
      member1Email: "",
      member2Email: "",
      member3Email: "",
      member4Email: "",
    });
    setFiles({ ppt: null, readme: null, finalZip: null });
    setPhase("1");
    setRegType("Individual");
    setSubmitted(false);
    toast({ title: "Session Cleared", description: "You have been signed out." });
  };

  const getSanitizedIdentity = () => {
    const name = regType === 'Individual'
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.teamName;
    const email = regType === 'Individual' ? formData.email : formData.teamLeaderEmail;
    const identity = `${name}_${email}`.replace(/[^a-zA-Z0-9.@_-]/g, '_');
    return identity;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transactionId) {
      toast({ title: "Validation Error", description: "Transaction ID is mandatory.", variant: "destructive" });
      return;
    }

    if (!formData.projectName) {
      toast({ title: "Validation Error", description: "Project Name is mandatory.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const identity = getSanitizedIdentity();
      if (globalPhase === 1) {
        const payload: any = {
          data: { ...formData, candidateIdentity: identity },
          files: {}
        };
        if (files.ppt) {
          const fileData = await toBase64(files.ppt);
          fileData.name = `${identity}_${fileData.name}`;
          payload.files.ppt = fileData;
        }

        const res = await candidateApi.submitPhase1(payload);
        setSubmitted(true);
        localStorage.setItem("codekarx_cached_submitted", "true");
        toast({ title: "Registration Successful", description: `Registration ID: ${res.registrationId || formData.transactionId}` });
      } else {
        // Phase 2
        const payload: any = {
          data: {
            registrationId: formData.registrationId || formData.transactionId,
            githubRepoLink: formData.githubRepoLink,
            candidateIdentity: identity,
          },
          files: {}
        };
        if (files.readme) {
          const fileData = await toBase64(files.readme);
          fileData.name = `${identity}_${fileData.name}`;
          payload.files.readme = fileData;
        }
        if (files.finalZip) {
          const fileData = await toBase64(files.finalZip);
          fileData.name = `${identity}_${fileData.name}`;
          payload.files.finalZip = fileData;
        }

        await candidateApi.submitPhase2(payload);
        setSubmitted(true);
        localStorage.setItem("codekarx_cached_submitted", "true");
        toast({ title: "Phase 2 Successful", description: "Your files have been updated." });
      }
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-none bg-white/80 backdrop-blur-md">
          <CardContent className="pt-10 pb-10 space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-bold text-slate-800">Submission Successful!</h2>
            <p className="text-slate-600 font-medium">
              {globalPhase === 1
                ? "Your registration has been received. Please wait for the HR team to approve your project."
                : "Your final project has been received and is under review. All the best!"}
            </p>
            <div className="pt-6">
              <Button variant="outline" onClick={handleClearSession} className="rounded-xl border-slate-200 text-slate-500 font-bold">
                SUBMIT ANOTHER RESPONSE
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl italic uppercase underline decoration-indigo-500 decoration-8 underline-offset-8">
            CODEKARX REGISTRATION
          </h1>
          <p className="text-lg text-slate-600 font-medium">Overhauled registration portal for Phase 1 & 2</p>
        </div>

        <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden ring-1 ring-slate-200">
          <CardHeader className="bg-indigo-600 text-white p-8 relative">
            {fetchingData && (
              <div className="absolute top-4 right-8 flex items-center gap-2 bg-indigo-500 px-3 py-1 rounded-full animate-pulse border border-indigo-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Checking...</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Upload className="h-6 w-6" /> {globalPhase === 1 ? "Phase 1 Registration" : "Phase 2 Submission"}
            </CardTitle>
            <CardDescription className="text-indigo-100 italic">Enter your Transaction ID to resume an existing registration.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Registration Type</Label>
                <RadioGroup
                  defaultValue={regType}
                  onValueChange={(v: any) => setRegType(v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Individual" id="Individual" />
                    <Label htmlFor="Individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Team" id="Team" />
                    <Label htmlFor="Team">Team</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Select Track *</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a tracking" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-indigo-700">
                <Label htmlFor="projectName" className="font-bold">Project Name *</Label>
                <Input id="projectName" placeholder="Your Amazing Project" value={formData.projectName} onChange={handleInputChange} className="rounded-xl border-indigo-200" required />
              </div>
              <div className="space-y-2 text-indigo-700">
                <Label htmlFor="transactionId" className="font-bold">Transaction ID * (Unique)</Label>
                <Input id="transactionId" placeholder="TXN12345678" value={formData.transactionId} onChange={handleInputChange} className="rounded-xl border-indigo-200" required />
              </div>
            </div>

            {regType === "Individual" ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={handleInputChange} className="rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input id="teamName" value={formData.teamName} onChange={handleInputChange} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Count *</Label>
                    <Select value={teamSize.toString()} onValueChange={(v) => setTeamSize(parseInt(v))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Members</SelectItem>
                        <SelectItem value="3">3 Members</SelectItem>
                        <SelectItem value="4">4 Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamLeaderEmail">Team Leader Email *</Label>
                    <Input id="teamLeaderEmail" type="email" value={formData.teamLeaderEmail} onChange={handleInputChange} className="rounded-xl" required />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Array.from({ length: teamSize }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Label htmlFor={`member${i + 1}Email`}>Member {i + 1} Email *</Label>
                        <Input
                          id={`member${i + 1}Email`}
                          type="email"
                          value={formData[`member${i + 1}Email` as keyof typeof formData]}
                          onChange={handleInputChange}
                          className="rounded-xl"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="collegeCompany">College / Company</Label>
              <Input id="collegeCompany" value={formData.collegeCompany} onChange={handleInputChange} className="rounded-xl" />
            </div>

            {globalPhase === 1 ? (
              <div className="space-y-6 border-t pt-8 border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Project Description *</Label>
                  <Textarea id="projectDescription" value={formData.projectDescription} onChange={handleInputChange} className="min-h-[150px] rounded-2xl" placeholder="Describe your idea briefly..." required />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 italic text-indigo-600 font-bold"><FileText className="h-4 w-4" /> Upload Project PPT *</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-indigo-100 border-dashed rounded-2xl hover:border-indigo-400 bg-indigo-50/20 cursor-pointer text-center">
                    <label className="cursor-pointer w-full h-full">
                      <Upload className="mx-auto h-12 w-12 text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-600 mt-2 block">Choose File</span>
                      <input type="file" className="sr-only" onChange={(e) => handleFileChange('ppt', e.target.files?.[0] || null)} required />
                    </label>
                  </div>
                  {files.ppt && <p className="text-sm font-bold text-emerald-600 text-center">{files.ppt.name}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-6 border-t pt-8 border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="githubRepoLink">GitHub Repository Link *</Label>
                  <div className="relative">
                    <Github className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                    <Input id="githubRepoLink" value={formData.githubRepoLink} onChange={handleInputChange} className="pl-12 rounded-xl h-12" required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>README File (PDF/DOC) *</Label>
                    <Input type="file" onChange={(e) => handleFileChange('readme', e.target.files?.[0] || null)} className="rounded-xl h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Project Zip (Optional)</Label>
                    <Input type="file" onChange={(e) => handleFileChange('finalZip', e.target.files?.[0] || null)} className="rounded-xl h-12" />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
              {loading ? "Syncing..." : globalPhase === 1 ? "Complete Phase 1 Registration" : "Submit Final Project"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CandidateForm;
