import { useState } from "react";
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

const DEPARTMENTS = [
  "Education",
  "Entertainment",
  "AI Agent and Automation",
  "Core AI/ML",
  "Big Data",
  "Mass Communication",
  "Cutting Agents"
];

const CandidateForm = () => {
  const [phase, setPhase] = useState<"1" | "2">("1");
  const [regType, setRegType] = useState<"Individual" | "Team">("Individual");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
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
    registrationId: "", // For Phase 2
  });

  const [teamMembers, setTeamMembers] = useState([{ name: "", email: "" }]);
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", email: "" }]);
  };

  const handleTeamMemberChange = (index: number, field: "name" | "email", value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      if (phase === "1") {
        data.append("registrationType", regType);
        data.append("department", formData.department);

        if (regType === "Individual") {
          data.append("firstName", formData.firstName);
          data.append("lastName", formData.lastName);
          data.append("email", formData.email);
          data.append("phone", formData.phone);
          data.append("collegeCompany", formData.collegeCompany);
        } else {
          data.append("teamName", formData.teamName);
          data.append("teamLeaderName", formData.teamLeaderName);
          data.append("teamLeaderEmail", formData.teamLeaderEmail);
          data.append("teamMembers", JSON.stringify(teamMembers));
        }

        data.append("projectDescription", formData.projectDescription);
        if (files.ppt) data.append("ppt", files.ppt);

        const res = await candidateApi.submitPhase1(data);
        toast({ title: "Success", description: `Phase 1 submitted! Reg ID: ${res.registrationId}` });
      } else {
        data.append("registrationId", formData.registrationId);
        data.append("githubRepoLink", formData.githubRepoLink);
        if (files.readme) data.append("readme", files.readme);
        if (files.finalZip) data.append("finalZip", files.finalZip);

        await candidateApi.submitPhase2(data);
        toast({ title: "Success", description: "Final project submitted successfully!" });
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.error || err.message, variant: "destructive" });
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
            <p className="text-slate-600">
              {phase === "1"
                ? "Your project description has been received. Check your email for confirmation."
                : "Your final project has been received and is under review."}
            </p>
            <Button onClick={() => setSubmitted(false)} className="bg-indigo-600 hover:bg-indigo-700">Submit Another Response</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            HR Candidate Registration
          </h1>
          <p className="text-lg text-slate-600">Join our next generation of innovators</p>
        </div>

        <Tabs defaultValue="1" onValueChange={(v) => setPhase(v as "1" | "2")} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200">
            <TabsTrigger value="1" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
              Phase 1: Project Description
            </TabsTrigger>
            <TabsTrigger value="2" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
              Phase 2: Final Submission
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="shadow-2xl border-none bg-white/90 backdrop-blur-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-indigo-600 text-white p-8">
            <CardTitle className="text-2xl">
              {phase === "1" ? "Project Description Submission" : "Final Project Submission"}
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {phase === "1" ? "Tell us about your innovative idea" : "Submit your repository and project files"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-8">
              {/* Individual vs Team Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-slate-700">Registration Type</Label>
                <RadioGroup
                  defaultValue="Individual"
                  onValueChange={(v) => setRegType(v as "Individual" | "Team")}
                  className="flex gap-4"
                >
                  <div className={`flex items-center space-x-2 border-2 p-4 rounded-2xl cursor-pointer transition-all ${regType === 'Individual' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`} onClick={() => setRegType('Individual')}>
                    <RadioGroupItem value="Individual" id="individual" />
                    <User className="h-5 w-5 text-indigo-600" />
                    <Label htmlFor="individual" className="cursor-pointer font-medium">Individual</Label>
                  </div>
                  <div className={`flex items-center space-x-2 border-2 p-4 rounded-2xl cursor-pointer transition-all ${regType === 'Team' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`} onClick={() => setRegType('Team')}>
                    <RadioGroupItem value="Team" id="team" />
                    <Users className="h-5 w-5 text-indigo-600" />
                    <Label htmlFor="team" className="cursor-pointer font-medium">Team Registration</Label>
                  </div>
                </RadioGroup>
              </div>

              {phase === "2" && (
                <div className="space-y-2 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <Label htmlFor="registrationId" className="text-amber-800 font-semibold">Registration ID *</Label>
                  <Input
                    id="registrationId"
                    placeholder="Enter your Phase 1 Registration ID (e.g., REG-123456)"
                    value={formData.registrationId}
                    onChange={handleInputChange}
                    className="border-amber-200 focus:ring-amber-500"
                    required
                  />
                  <p className="text-xs text-amber-600 italic">This ID was provided after your Phase 1 submission.</p>
                </div>
              )}

              {/* Department - Only for Phase 1 */}
              {phase === "1" && (
                <div className="space-y-2">
                  <Label htmlFor="department">Category / Department *</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, department: v })}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Personal/Team Details */}
              {regType === "Individual" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} className="rounded-xl" />
                  </div>
                  {phase === "1" && (
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="collegeCompany">College / Company *</Label>
                      <Input id="collegeCompany" value={formData.collegeCompany} onChange={handleInputChange} required className="rounded-xl" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input id="teamName" value={formData.teamName} onChange={handleInputChange} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamLeaderName">Team Leader Name *</Label>
                      <Input id="teamLeaderName" value={formData.teamLeaderName} onChange={handleInputChange} required className="rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="teamLeaderEmail">Team Leader Email *</Label>
                      <Input id="teamLeaderEmail" type="email" value={formData.teamLeaderEmail} onChange={handleInputChange} required className="rounded-xl" />
                    </div>
                  </div>

                  {phase === "1" && (
                    <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <Label className="text-slate-700 font-bold">Team Members</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTeamMember} className="rounded-lg h-8">Add Member</Button>
                      </div>
                      {teamMembers.map((member, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(idx, 'name', e.target.value)}
                            className="h-10 text-sm rounded-lg"
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={member.email}
                            onChange={(e) => handleTeamMemberChange(idx, 'email', e.target.value)}
                            className="h-10 text-sm rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Phase Specific Fields */}
              {phase === "1" ? (
                <div className="space-y-6 border-t pt-8 border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Project Description *</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Briefly describe your project goals..."
                      className="min-h-[150px] rounded-2xl"
                      value={formData.projectDescription}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-slate-700">Upload Project PPT (PDF/PPT) *</Label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer group">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <div className="flex text-sm text-slate-600">
                          <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                            <span>Upload a file</span>
                            <input type="file" className="sr-only" onChange={(e) => handleFileChange('ppt', e.target.files?.[0] || null)} required />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">PDF, PPTX up to 10MB</p>
                        {files.ppt && <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center justify-center gap-1"><FileText className="h-4 w-4" /> {files.ppt.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 border-t pt-8 border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="githubRepoLink">GitHub Repository Link *</Label>
                    <div className="relative">
                      <Github className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="githubRepoLink"
                        placeholder="https://github.com/username/project"
                        className="pl-12 rounded-xl h-12"
                        value={formData.githubRepoLink}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>README File (PDF/DOC) *</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer relative">
                        <FileText className="h-8 w-8 text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{files.readme ? files.readme.name : "Select README"}</p>
                          <p className="text-xs text-slate-500">PDF or Word</p>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('readme', e.target.files?.[0] || null)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Final Project Files (ZIP) - Optional</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer relative">
                        <FileArchive className="h-8 w-8 text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{files.finalZip ? files.finalZip.name : "Select ZIP archive"}</p>
                          <p className="text-xs text-slate-500">Project source code</p>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('finalZip', e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95" disabled={loading}>
                {loading ? "Processing Submission..." : phase === "1" ? "Submit Project Description" : "Complete Final Submission"}
              </Button>
            </CardContent>
          </form>
        </Card>

        <p className="text-center mt-12 text-slate-500 text-sm">
          Protected by HR Security Protocol • © 2026 People Drive Manager
        </p>
      </div>
    </div>
  );
};

export default CandidateForm;
