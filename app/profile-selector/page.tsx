"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

const ProfileSelector = () => {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const profiles: Profile[] = [
    {
      id: "developer",
      name: "Developer",
      role: "Full Stack Engineer",
      avatar: "👨‍💻",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "designer",
      name: "Designer",
      role: "UI/UX Designer",
      avatar: "🎨",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "manager",
      name: "Project Manager",
      role: "Team Lead",
      avatar: "👔",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "analyst",
      name: "Data Analyst",
      role: "Analytics Expert",
      avatar: "📊",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="absolute inset-0 -z-0 h-full w-full dark:bg-[radial-gradient(#1d1d1d_1px,transparent_1px)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-4xl">
          <div className="mb-12 text-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3">
              Select Your Profile
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Choose your role to continue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 transform hover:scale-105 ${
                  selectedProfile === profile.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-400 dark:hover:border-blue-500"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${profile.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                <div className="relative z-10 space-y-4">
                  <div className="text-5xl mb-4">{profile.avatar}</div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-left">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 text-left">
                      {profile.role}
                    </p>
                  </div>

                  <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${profile.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                </div>

                {selectedProfile === profile.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-500">
              {selectedProfile ? (
                <p className="animate-pulse">
                  Redirecting to homepage...
                </p>
              ) : (
                <p>Select a profile to get started</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelector;
