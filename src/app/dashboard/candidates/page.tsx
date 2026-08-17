"use client";

import { useState, useRef, useEffect } from "react";
const initialCandidates: any[] = [];
const jobs: any[] = [];
const interviews: any[] = [];
import { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Play, FileText, Mail, Phone, User, Briefcase, 
  Upload, Loader2, CheckCircle, File, X 
} from "lucide-react";
import { useRouter } from "next/navigation";

// Helper to get stored candidates from localStorage
const getStoredCandidates = (): Candidate[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("interview-candidates");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save candidates to localStorage
const saveStoredCandidates = (candidates: Candidate[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("interview-candidates", JSON.stringify(candidates));
  } catch (e) {
    console.error("Failed to save candidates to localStorage:", e);
  }
};

export default function CandidatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize with mock data only (server-safe) to avoid hydration mismatch
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  
  // Load localStorage candidates after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = getStoredCandidates();
    if (stored.length > 0) {
      const existingIds = new Set(initialCandidates.map(c => c.id));
      const newCandidates = stored.filter(c => !existingIds.has(c.id));
      if (newCandidates.length > 0) {
        setCandidates([...newCandidates, ...initialCandidates]);
      }
    }
  }, []);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    jobId: "",
    resumeSummary: "",
  });

  const jobById = Object.fromEntries(jobs.map((job) => [job.id, job]));

  // Handle file upload and parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [".pdf", ".docx", ".doc", ".txt"];
    const isValid = validTypes.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      alert("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse resume");
      }

      const data = await response.json();
      
      // Update the resume summary with extracted text
      setNewCandidate((prev) => ({
        ...prev,
        resumeSummary: data.extractedText,
      }));

      // Try to extract name from resume text (basic heuristic)
      if (!newCandidate.name && data.extractedText) {
        const lines = data.extractedText.split("\n");
        const potentialName = lines[0]?.trim();
        if (potentialName && potentialName.length < 50 && !potentialName.includes("@")) {
          setNewCandidate((prev) => ({
            ...prev,
            name: potentialName,
          }));
        }
      }
    } catch (error) {
      console.error("Resume upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to parse resume");
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.email || !newCandidate.jobId) {
      alert("Please fill in required fields (Name, Email, Position)");
      return;
    }

    try {
      // Save to API
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCandidate.name,
          email: newCandidate.email,
          phone: newCandidate.phone || undefined,
          jobId: newCandidate.jobId,
          resumeSummary: newCandidate.resumeSummary || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add candidate");
      }

      const data = await response.json();
      
      // Add to local state
      const updatedCandidates = [data.candidate, ...candidates];
      setCandidates(updatedCandidates);
      
      // Save to localStorage for cross-page persistence
      const storedCandidates = getStoredCandidates();
      saveStoredCandidates([data.candidate, ...storedCandidates]);
      
      // Reset form
      setNewCandidate({ name: "", email: "", phone: "", jobId: "", resumeSummary: "" });
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add candidate:", error);
      alert(error instanceof Error ? error.message : "Failed to add candidate");
    }
  };

  const [createdInterviews, setCreatedInterviews] = useState<Record<string, string>>({});
  const [isCreatingInterview, setIsCreatingInterview] = useState<string | null>(null);

  const getInterviewForCandidate = (candidateId: string): { id: string; status?: string } | undefined => {
    // Check created interviews first (newly created, always scheduled)
    if (createdInterviews[candidateId]) {
      return { id: createdInterviews[candidateId], status: "scheduled" };
    }
    // Check existing interviews from mock data
    const existing = interviews.find((i) => i.candidateId === candidateId);
    if (existing) {
      return { id: existing.id, status: existing.status };
    }
    return undefined;
  };

  const handleStartInterview = async (candidate: Candidate) => {
    // Check if interview already exists
    const existingInterview = getInterviewForCandidate(candidate.id);
    if (existingInterview) {
      router.push(`/interview/${existingInterview.id}/hr`);
      return;
    }

    // Create new interview
    setIsCreatingInterview(candidate.id);
    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create interview");
      }

      const data = await response.json();
      
      // Store the created interview ID
      setCreatedInterviews((prev) => ({
        ...prev,
        [candidate.id]: data.interview.id,
      }));
      
      // Save interview mapping to localStorage
      try {
        const existingMappings = JSON.parse(localStorage.getItem("interview-mappings") || "{}");
        existingMappings[data.interview.id] = candidate.id;
        localStorage.setItem("interview-mappings", JSON.stringify(existingMappings));
      } catch (e) {
        console.error("Failed to save interview mapping:", e);
      }

      // Navigate to the interview
      router.push(`/interview/${data.interview.id}/hr`);
    } catch (error) {
      console.error("Failed to create interview:", error);
      alert(error instanceof Error ? error.message : "Failed to create interview");
    } finally {
      setIsCreatingInterview(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Candidates</h1>
          <p className="text-sm text-gray-400">Manage candidates and start interviews</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="size-4 mr-2" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription className="text-gray-400">
                Upload a resume or enter details manually. The AI interviewer will use this to personalize questions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Resume Upload Section */}
              <div className="space-y-3">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Upload className="size-4" />
                  Upload Resume
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                
                {!uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <File className="size-8 mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">
                      Click to upload <span className="text-orange-400">PDF</span>, <span className="text-orange-400">DOCX</span>, or <span className="text-orange-400">TXT</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Resume text will be extracted automatically</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-3">
                      {isUploading ? (
                        <Loader2 className="size-5 text-orange-400 animate-spin" />
                      ) : (
                        <CheckCircle className="size-5 text-green-400" />
                      )}
                      <div>
                        <p className="text-sm text-white truncate max-w-[300px]">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-400">
                          {isUploading ? "Extracting text..." : "Resume parsed successfully"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearUploadedFile}
                      className="p-1 hover:bg-gray-700 rounded"
                      disabled={isUploading}
                    >
                      <X className="size-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-800" />
                <span className="text-xs text-gray-500">or enter manually</span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    placeholder="John Doe"
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="john@example.com"
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job" className="text-gray-300">
                    Position *
                  </Label>
                  <Select
                    value={newCandidate.jobId}
                    onValueChange={(value) => setNewCandidate({ ...newCandidate, jobId: value })}
                  >
                    <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-gray-700">
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id} className="text-white">
                          {job.title} at {job.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resume Summary / Extracted Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resume" className="text-gray-300">
                    Resume Content
                  </Label>
                  {newCandidate.resumeSummary && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="size-3" />
                      {newCandidate.resumeSummary.length.toLocaleString()} characters
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {uploadedFile 
                    ? "Extracted from uploaded resume. Edit if needed."
                    : "Paste resume content or key details for the AI interviewer."}
                </p>
                <textarea
                  id="resume"
                  value={newCandidate.resumeSummary}
                  onChange={(e) => setNewCandidate({ ...newCandidate, resumeSummary: e.target.value })}
                  placeholder={`Paste resume content here...

The AI interviewer will use this to:
• Reference their background naturally
• Ask relevant follow-up questions
• Personalize the conversation`}
                  rows={8}
                  className="w-full rounded-md bg-[#2a2a2a] border border-gray-700 text-white text-sm p-3 placeholder:text-gray-500 font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddOpen(false);
                  setUploadedFile(null);
                  setNewCandidate({ name: "", email: "", phone: "", jobId: "", resumeSummary: "" });
                }} 
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCandidate} 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Add Candidate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Candidates Grid */}
      <div className="grid gap-4">
        {candidates.map((candidate) => {
          const job = jobById[candidate.jobId];
          const interview = getInterviewForCandidate(candidate.id);
          const hasResume = !!candidate.resumeSummary;

          return (
            <div
              key={candidate.id}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-lg">
                  {candidate.name.split(" ").map((n) => n[0]).join("")}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{candidate.name}</h3>
                    <Badge variant="outline" className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                    {hasResume && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        <FileText className="size-3 mr-1" />
                        Resume
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" />
                      {candidate.email}
                    </span>
                    {candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {candidate.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="size-3 text-gray-500" />
                    <span className="text-gray-300">{job?.title || "Unknown"}</span>
                    <span className="text-gray-500">at {job?.company || "Unknown"}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {interview ? (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStartInterview(candidate)}
                    disabled={isCreatingInterview === candidate.id}
                  >
                    <Play className="size-4 mr-1" />
                    {interview.status === "in-progress" ? "Continue" : "View"} Interview
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleStartInterview(candidate)}
                    disabled={isCreatingInterview === candidate.id}
                  >
                    {isCreatingInterview === candidate.id ? (
                      <>
                        <Loader2 className="size-4 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="size-4 mr-1" />
                        Start Interview
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {candidates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="size-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white">No candidates yet</h3>
          <p className="text-gray-400 mt-1">Add your first candidate to get started</p>
          <Button className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      )}
    </div>
  );
}
