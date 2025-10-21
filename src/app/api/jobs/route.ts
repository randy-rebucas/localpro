import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";

const mockJobs = [
  {
    id: "1",
    title: "E-commerce Website Development",
    description: "Need a full-stack developer to build a modern e-commerce platform with React and Node.js. Must include payment integration, user authentication, and admin dashboard.",
    category: "WEB_DEVELOPMENT",
    budget: 5000,
    duration: 30,
    client: {
      id: "client-1",
      name: "Sarah Johnson",
      rating: 4.8,
      reviewCount: 45,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "New York",
      state: "NY"
    },
    images: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
    ],
    rating: 4.8,
    reviewCount: 45,
    isAvailable: true,
    createdAt: "2024-01-15T10:00:00Z",
    deadline: "2024-02-15T23:59:59Z",
    skills: ["React", "Node.js", "JavaScript", "E-commerce"]
  },
  {
    id: "2",
    title: "Mobile App UI/UX Design",
    description: "Looking for a talented UI/UX designer to create wireframes and high-fidelity designs for a fitness tracking mobile app.",
    category: "DESIGN",
    budget: 2500,
    duration: 14,
    client: {
      id: "client-2",
      name: "Mike Rodriguez",
      rating: 4.9,
      reviewCount: 32,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "Los Angeles",
      state: "CA"
    },
    images: [
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop"
    ],
    rating: 4.9,
    reviewCount: 32,
    isAvailable: true,
    createdAt: "2024-01-10T14:30:00Z",
    deadline: "2024-01-25T23:59:59Z",
    skills: ["UI/UX Design", "Figma", "Mobile Design", "Prototyping"]
  },
  {
    id: "3",
    title: "Content Marketing Strategy",
    description: "Need a content marketing expert to develop a comprehensive strategy for our SaaS product launch. Includes blog content, social media strategy, and email campaigns.",
    category: "MARKETING",
    budget: 3000,
    duration: 21,
    client: {
      id: "client-3",
      name: "Emily Chen",
      rating: 4.7,
      reviewCount: 28,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "San Francisco",
      state: "CA"
    },
    images: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
    ],
    rating: 4.7,
    reviewCount: 28,
    isAvailable: true,
    createdAt: "2024-01-12T09:15:00Z",
    deadline: "2024-02-02T23:59:59Z",
    skills: ["Content Marketing", "SEO", "Social Media", "Email Marketing"]
  },
  {
    id: "4",
    title: "Data Analysis Dashboard",
    description: "Looking for a data analyst to create interactive dashboards using Python and Tableau. Must have experience with SQL and data visualization.",
    category: "CONSULTING",
    budget: 4000,
    duration: 25,
    client: {
      id: "client-4",
      name: "David Wilson",
      rating: 4.6,
      reviewCount: 19,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "Chicago",
      state: "IL"
    },
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
    ],
    rating: 4.6,
    reviewCount: 19,
    isAvailable: true,
    createdAt: "2024-01-08T16:45:00Z",
    deadline: "2024-02-02T23:59:59Z",
    skills: ["Python", "SQL", "Tableau", "Data Visualization"]
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    console.log("Jobs API: Session:", session?.user?.email);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const available = searchParams.get("available");
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");
    const skills = searchParams.get("skills");
    const sort = searchParams.get("sort") || "relevance";

    console.log("Jobs API: Query params:", {
      search,
      category,
      location,
      available,
      minBudget,
      maxBudget,
      skills,
      sort
    });

    // Filter jobs
    let filteredJobs = [...mockJobs];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
        job.location.city.toLowerCase().includes(searchLower) ||
        job.location.state.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category) {
      filteredJobs = filteredJobs.filter(job => job.category === category);
    }

    // Location filter
    if (location) {
      const locationLower = location.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.location.city.toLowerCase().includes(locationLower) ||
        job.location.state.toLowerCase().includes(locationLower)
      );
    }

    // Availability filter
    if (available === "true") {
      filteredJobs = filteredJobs.filter(job => job.isAvailable);
    }

    // Budget filter
    if (minBudget) {
      filteredJobs = filteredJobs.filter(job => job.budget >= parseInt(minBudget));
    }
    if (maxBudget) {
      filteredJobs = filteredJobs.filter(job => job.budget <= parseInt(maxBudget));
    }

    // Skills filter
    if (skills) {
      const requiredSkills = skills.split(",").map(s => s.trim().toLowerCase());
      filteredJobs = filteredJobs.filter(job =>
        requiredSkills.some(requiredSkill =>
          job.skills.some(jobSkill => jobSkill.toLowerCase().includes(requiredSkill))
        )
      );
    }

    // Sort jobs
    switch (sort) {
      case "newest":
        filteredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "budget-high":
        filteredJobs.sort((a, b) => b.budget - a.budget);
        break;
      case "budget-low":
        filteredJobs.sort((a, b) => a.budget - b.budget);
        break;
      case "deadline":
        filteredJobs.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
      case "relevance":
      default:
        // Keep original order for relevance
        break;
    }

    console.log("Jobs API: Returning", filteredJobs.length, "jobs");

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      page: 1,
      limit: 20
    });

  } catch (error) {
    console.error("Jobs API: Error fetching jobs:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Jobs API: Creating job:", body);

    // In a real app, you would save to database
    const newJob = {
      id: Date.now().toString(),
      ...body,
      client: {
        id: session.user.id,
        name: session.user.name || "Unknown",
        rating: 5.0,
        reviewCount: 0,
        avatar: session.user.avatar || ""
      },
      createdAt: new Date().toISOString(),
      isAvailable: true
    };

    return NextResponse.json(newJob, { status: 201 });

  } catch (error) {
    console.error("Jobs API: Error creating job:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}