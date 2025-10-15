// interfaces/project.ts
export interface IProject {
  id: number;
  name: string;
  mapUrl?: string;
  location?: string;
  priceRange?: string;
  sizeSqft?: number;
  landArea?: string;
  status: "ongoing" | "completed";
  description?: string;
  amenities: string[];
  projectType?: string;
  progressPercentage?: number;
  completionYear?: number;
  brochureUrl?: string;
  virtualTourUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectUpdate {
  name?: string;
  mapUrl?: string;
  location?: string;
  priceRange?: string;
  sizeSqft?: number;
  landArea?: string;
  status?: "ongoing" | "completed";
  description?: string;
  amenities?: string[];
  projectType?: string;
  progressPercentage?: number;
  completionYear?: number;
  brochureUrl?: string;
  virtualTourUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface IProjectImage {
  id: number;
  imageUrl: string;
  caption?: string;
  isFeatured: boolean;
  projectId: number;
}

export interface IProjectFilters {
  search?: string;
  status?: "ongoing" | "completed";
  projectType?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface IProjectStats {
  total: number;
  ongoing: number;
  completed: number;
}
// interfaces/project.ts
export interface IProjectImageCreate {
  imageUrl: string;
  caption?: string;
  isFeatured?: boolean;
}

export interface IGalleryItemCreate {
  title?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface IProjectCreate {
  name: string;
  mapUrl?: string;
  location?: string;
  priceRange?: string;
  sizeSqft?: number;
  landArea?: string;
  status: "ongoing" | "completed";
  description?: string;
  amenities?: string[];
  projectType?: string;
  progressPercentage?: number;
  completionYear?: number;
  brochureUrl?: string;
  virtualTourUrl?: string;
  latitude?: number;
  longitude?: number;
  images?: IProjectImageCreate[];
  galleryItems?: IGalleryItemCreate[];
}
