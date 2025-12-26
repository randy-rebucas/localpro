"use client";

import { User, Briefcase, MapPin, Camera, CheckCircle } from "lucide-react";

interface ProfileStepsProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  profileData: Record<string, unknown>;
}

const steps = [
  {
    id: 1,
    title: "Personal Info",
    description: "Basic information about yourself",
    icon: User,
    fields: ["firstName", "lastName", "email", "name", "phone", "bio"]
  },
  {
    id: 2,
    title: "Professional",
    description: "Your work experience and skills",
    icon: Briefcase,
    fields: ["skills", "experience", "website"]
  },
  {
    id: 3,
    title: "Location",
    description: "Where you're based",
    icon: MapPin,
    fields: ["location"]
  },
  {
    id: 4,
    title: "Media",
    description: "Photos and portfolio",
    icon: Camera,
    fields: ["avatar", "portfolio"]
  }
];

export function ProfileSteps({ currentStep, profileData }: ProfileStepsProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  const getStepCompletion = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return 0;
    
    const completedFields = step.fields.filter(field => {
      if (field === "skills") return Array.isArray(profileData?.skills) && profileData.skills.length > 0;    
      if (field === "portfolio") return Array.isArray(profileData?.portfolio) && profileData.portfolio.length > 0;                                                                              
      return profileData?.[field] && profileData[field] !== "";
    });
    
    return (completedFields.length / step.fields.length) * 100;
  };

  return (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const status = getStepStatus(step.id);
            const completion = getStepCompletion(step.id);
            const Icon = step.icon;
            
            return (
              <li key={step.id} className="relative flex-1">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex items-center">
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        status === "completed"
                          ? "border-accent bg-accent"
                          : status === "current"
                          ? "border-accent bg-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className={`h-5 w-5 ${
                          status === "current" ? "text-accent" : "text-gray-400"
                        }`} />
                      )}
                    </div>
                    
                    {/* Step Info */}
                    <div className="ml-4 min-w-0">
                      <div className={`text-sm font-medium ${
                        status === "current" ? "text-accent" : 
                        status === "completed" ? "text-gray-700" : "text-gray-500"
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.description}
                      </div>
                      {status !== "upcoming" && (
                        <div className="mt-1">
                          <div className="w-20 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-accent h-1 rounded-full transition-all duration-300"
                              style={{ width: `${completion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(completion)}% complete
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {stepIdx < steps.length - 1 && (
                    <div className="absolute top-5 left-10 right-0 h-0.5 bg-gray-300" />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
