"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResumeData, ExperienceItem, EducationItem, ProjectItem, SkillCategory } from "@/lib/resume/types";

interface VisualBuilderProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function VisualBuilder({ data, onChange }: VisualBuilderProps) {
  const [activeTab, setActiveTab] = useState("personal");

  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
      },
    });
  };

  const updateTheme = (field: keyof ResumeData["theme"], value: any) => {
    onChange({
      ...data,
      theme: {
        ...data.theme,
        [field]: value,
      },
    });
  };

  // Experience Handlers
  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: "Company Name",
      role: "Software Engineer",
      location: "City, Country",
      startDate: "Jan 2023",
      endDate: "Present",
      current: true,
      bullets: ["Accomplished [X] by doing [Y], resulting in [Z] (e.g. 30% performance boost)."],
    };
    onChange({
      ...data,
      experience: [newExp, ...data.experience],
    });
  };

  const updateExperience = (id: string, updated: Partial<ExperienceItem>) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    });
  };

  // Education Handlers
  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "University / College",
      degree: "Bachelor of Technology",
      fieldOfStudy: "Computer Science",
      location: "City, State",
      startDate: "2020",
      endDate: "2024",
      current: false,
      gpa: "8.5 / 10",
      bullets: ["Relevant Coursework: Algorithms, OS, DBMS, Networks"],
    };
    onChange({
      ...data,
      education: [...data.education, newEdu],
    });
  };

  const updateEducation = (id: string, updated: Partial<EducationItem>) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    });
  };

  const deleteEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    });
  };

  // Project Handlers
  const addProject = () => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: "New Project",
      techStack: ["Next.js", "TypeScript", "PostgreSQL"],
      date: "2024",
      bullets: ["Built full-stack application serving active users with low latency."],
    };
    onChange({
      ...data,
      projects: [...data.projects, newProj],
    });
  };

  const updateProject = (id: string, updated: Partial<ProjectItem>) => {
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
    });
  };

  // Skills Handlers
  const addSkillCategory = () => {
    const newCat: SkillCategory = {
      id: `skill-${Date.now()}`,
      name: "Tools & Cloud",
      skills: ["Docker", "Kubernetes", "AWS", "Git"],
    };
    onChange({
      ...data,
      skills: [...data.skills, newCat],
    });
  };

  const updateSkillCategory = (id: string, name: string, skillsStr: string) => {
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({
      ...data,
      skills: data.skills.map((s) => (s.id === id ? { ...s, name, skills } : s)),
    });
  };

  const deleteSkillCategory = (id: string) => {
    onChange({
      ...data,
      skills: data.skills.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-full bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs">
      {/* ── Sub Navigation Tabs ── */}
      <div className="border-b border-border/60 bg-muted/40 p-2 shrink-0 w-full min-w-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted w-full">
            <TabsTrigger value="personal" className="text-xs py-1.5 gap-1">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="text-xs py-1.5 gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs py-1.5 gap-1">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs py-1.5 gap-1">
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs py-1.5 gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger value="styling" className="text-xs py-1.5 gap-1">
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Tab Contents Scroll Area (Hidden Scrollbars & Lenis Prevent) ── */}
      <div
        data-lenis-prevent
        className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-4 sm:p-6 space-y-6"
      >
        {/* 1. Personal Information */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Personal & Contact Details</h3>
              <span className="text-xs text-muted-foreground">Header Section</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Job Title / Target Role</Label>
                <Input
                  value={data.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo("jobTitle", e.target.value)}
                  placeholder="e.g. Full Stack Software Engineer"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo("location", e.target.value)}
                  placeholder="e.g. Odisha, India"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">LinkedIn Profile</Label>
                <Input
                  value={data.personalInfo.linkedin || ""}
                  onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                  placeholder="e.g. linkedin.com/in/username"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">GitHub Profile</Label>
                <Input
                  value={data.personalInfo.github || ""}
                  onChange={(e) => updatePersonalInfo("github", e.target.value)}
                  placeholder="e.g. github.com/username"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Portfolio / Website</Label>
                <Input
                  value={data.personalInfo.portfolio || ""}
                  onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                  placeholder="e.g. yourname.dev"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Professional Summary</Label>
                <span className="text-[10px] text-muted-foreground">
                  {data.personalInfo.summary.length} characters
                </span>
              </div>
              <Textarea
                value={data.personalInfo.summary}
                onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                placeholder="2-3 impactful sentences highlighting your skills, domain experience, and quantifiable achievements."
                rows={4}
                className="text-xs leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* 2. Experience Section */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Work Experience</h3>
                <p className="text-xs text-muted-foreground">Add your professional roles, internships, and impact.</p>
              </div>
              <Button size="sm" onClick={addExperience} className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Role
              </Button>
            </div>

            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <Card key={exp.id} className="border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      #{idx + 1} {exp.role} at {exp.company}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExperience(exp.id)}
                      className="h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      placeholder="Role Title"
                      className="text-xs h-8"
                    />
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      placeholder="Company / Org"
                      className="text-xs h-8"
                    />
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      placeholder="Location"
                      className="text-xs h-8"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="Start Date"
                        className="text-xs h-8 flex-1"
                      />
                      <Input
                        value={exp.current ? "Present" : exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="End Date"
                        disabled={exp.current}
                        className="text-xs h-8 flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Bullet Points (one per line, use quantifiable metrics)
                    </Label>
                    <Textarea
                      value={exp.bullets.join("\n")}
                      onChange={(e) =>
                        updateExperience(exp.id, {
                          bullets: e.target.value.split("\n").filter((b) => b.trim().length > 0),
                        })
                      }
                      rows={3}
                      className="text-xs font-mono"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3. Projects Section */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Featured Projects</h3>
                <p className="text-xs text-muted-foreground">Highlight engineering projects and tech stacks.</p>
              </div>
              <Button size="sm" onClick={addProject} className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </Button>
            </div>

            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <Card key={proj.id} className="border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      #{idx + 1} {proj.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(proj.id)}
                      className="h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={proj.name}
                      onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                      placeholder="Project Name"
                      className="text-xs h-8"
                    />
                    <Input
                      value={proj.techStack.join(", ")}
                      onChange={(e) =>
                        updateProject(proj.id, {
                          techStack: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                      placeholder="Technologies (comma separated, e.g. React, Go, Docker)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={proj.githubUrl || ""}
                      onChange={(e) => updateProject(proj.id, { githubUrl: e.target.value })}
                      placeholder="GitHub Link (optional)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={proj.liveUrl || ""}
                      onChange={(e) => updateProject(proj.id, { liveUrl: e.target.value })}
                      placeholder="Live Demo Link (optional)"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Bullet Points (one per line)
                    </Label>
                    <Textarea
                      value={proj.bullets.join("\n")}
                      onChange={(e) =>
                        updateProject(proj.id, {
                          bullets: e.target.value.split("\n").filter((b) => b.trim().length > 0),
                        })
                      }
                      rows={3}
                      className="text-xs font-mono"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. Skills Section */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Technical Skills</h3>
                <p className="text-xs text-muted-foreground">Categorize your technical skills for optimal ATS keyword matching.</p>
              </div>
              <Button size="sm" onClick={addSkillCategory} className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </Button>
            </div>

            <div className="space-y-3">
              {data.skills.map((cat) => (
                <Card key={cat.id} className="border-border/60 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={cat.name}
                      onChange={(e) => updateSkillCategory(cat.id, e.target.value, cat.skills.join(", "))}
                      placeholder="Category Name (e.g. Languages)"
                      className="text-xs font-bold w-48 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSkillCategory(cat.id)}
                      className="h-7 text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <Textarea
                    value={cat.skills.join(", ")}
                    onChange={(e) => updateSkillCategory(cat.id, cat.name, e.target.value)}
                    placeholder="Skills comma-separated (e.g. TypeScript, Python, C++, Java, SQL)"
                    rows={2}
                    className="text-xs"
                  />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 5. Education Section */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Education</h3>
                <p className="text-xs text-muted-foreground">Add college degrees, certifications, and coursework.</p>
              </div>
              <Button size="sm" onClick={addEducation} className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Degree
              </Button>
            </div>

            <div className="space-y-4">
              {data.education.map((edu, idx) => (
                <Card key={edu.id} className="border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      #{idx + 1} {edu.degree} - {edu.institution}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEducation(edu.id)}
                      className="h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      placeholder="Institution / College Name"
                      className="text-xs h-8"
                    />
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      placeholder="Degree (e.g. B.Tech / B.S.)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                      placeholder="Field of Study (e.g. Computer Science)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={edu.gpa || ""}
                      onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                      placeholder="GPA / Percentage (e.g. 8.8 / 10)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                      placeholder="Location"
                      className="text-xs h-8"
                    />
                    <Input
                      value={edu.startDate ? `${edu.startDate} - ${edu.endDate}` : ""}
                      onChange={(e) => {
                        const parts = e.target.value.split("-");
                        updateEducation(edu.id, {
                          startDate: parts[0]?.trim() || "",
                          endDate: parts[1]?.trim() || "",
                        });
                      }}
                      placeholder="Dates (e.g. 2020 - 2024)"
                      className="text-xs h-8"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 6. Theme & Styling Customizer (Canva-style) */}
        {activeTab === "styling" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Theme & Layout Customizer</h3>
              <p className="text-xs text-muted-foreground">
                Customize typography, layout scheme, and accent palette.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={data.theme.fontFamily}
                  onValueChange={(val) => updateTheme("fontFamily", val)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Modern Clean Sans)</SelectItem>
                    <SelectItem value="Roboto">Roboto (Google Standard)</SelectItem>
                    <SelectItem value="Outfit">Outfit (Tech Aesthetic)</SelectItem>
                    <SelectItem value="Merriweather">Merriweather (Classic Editorial Serif)</SelectItem>
                    <SelectItem value="Computer Modern">Computer Modern (LaTeX Academic Serif)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Layout Style</Label>
                <Select
                  value={data.theme.layout}
                  onValueChange={(val) => updateTheme("layout", val)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-column">Single Column (ATS Highest Rating)</SelectItem>
                    <SelectItem value="two-column-left">Two Column (Left Sidebar)</SelectItem>
                    <SelectItem value="compact-grid">Compact One-Pager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Primary Theme Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.theme.primaryColor}
                    onChange={(e) => updateTheme("primaryColor", e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0 bg-transparent"
                  />
                  <Input
                    value={data.theme.primaryColor}
                    onChange={(e) => updateTheme("primaryColor", e.target.value)}
                    className="text-xs font-mono h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Margins & Spacing</Label>
                <Select
                  value={data.theme.margins}
                  onValueChange={(val) => updateTheme("margins", val)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select margins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact (Fit more content on 1 page)</SelectItem>
                    <SelectItem value="normal">Normal (Standard balanced)</SelectItem>
                    <SelectItem value="spacious">Spacious (Clean & relaxed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
