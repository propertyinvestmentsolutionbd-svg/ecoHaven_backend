import prisma from "../../shared/prisma";

interface CreateCareerData {
  title: string;
  description: string;
  type: string;
  deadline: string;
  redirectLink: string;
}

interface UpdateCareerData {
  title?: string;
  description?: string;
  type?: string;
  deadline?: string;
  redirectLink?: string;
  status?: string;
}

export const createCareerService = async (data: CreateCareerData) => {
  try {
    console.log("Creating career with data:", data);

    // Validate employment type
    const validTypes = [
      "full-time",
      "part-time",
      "contract",
      "internship",
      "freelance",
    ];
    if (!validTypes.includes(data.type)) {
      throw new Error("Invalid employment type");
    }

    // Check if deadline is in the past
    const deadlineDate = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status = deadlineDate < today ? "expired" : "active";

    const career = await prisma.career.create({
      data: {
        ...data,
        deadline: deadlineDate,
        status,
      },
    });

    console.log("Career created successfully:", career.id);
    return career;
  } catch (error) {
    console.error("Error in createCareerService:", error);
    throw error;
  }
};

export const getAllCareersService = async () => {
  try {
    console.log("Fetching all careers");

    const careers = await prisma.career.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${careers.length} careers`);

    // Format dates for frontend
    const formattedCareers = careers.map((career) => ({
      ...career,
      deadline: career.deadline.toISOString().split("T")[0],
      createdAt: career.createdAt.toISOString().split("T")[0],
      updatedAt: career.updatedAt.toISOString().split("T")[0],
    }));

    return formattedCareers;
  } catch (error) {
    console.error("Error in getAllCareersService:", error);
    throw error;
  }
};

export const getCareerByIdService = async (id: number) => {
  try {
    console.log("Fetching career by ID:", id);

    const career = await prisma.career.findUnique({
      where: { id },
    });

    if (!career) {
      console.log("Career not found:", id);
      return null;
    }

    // Format dates for frontend
    const formattedCareer = {
      ...career,
      deadline: career.deadline.toISOString().split("T")[0],
      createdAt: career.createdAt.toISOString().split("T")[0],
      updatedAt: career.updatedAt.toISOString().split("T")[0],
    };

    return formattedCareer;
  } catch (error) {
    console.error("Error in getCareerByIdService:", error);
    throw error;
  }
};

export const updateCareerService = async (
  id: number,
  data: UpdateCareerData
) => {
  try {
    console.log("Updating career:", id, data);

    // Check if career exists
    const existingCareer = await prisma.career.findUnique({
      where: { id },
    });

    if (!existingCareer) {
      console.log("Career not found for update:", id);
      return null;
    }

    // Prepare update data
    const updateData: any = { ...data };

    // Handle deadline update and status recalculation
    if (data.deadline) {
      const deadlineDate = new Date(data.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      updateData.deadline = deadlineDate;
      updateData.status = deadlineDate < today ? "expired" : "active";
    }

    // Validate employment type if provided
    if (data.type) {
      const validTypes = [
        "full-time",
        "part-time",
        "contract",
        "internship",
        "freelance",
      ];
      if (!validTypes.includes(data.type)) {
        throw new Error("Invalid employment type");
      }
    }

    const career = await prisma.career.update({
      where: { id },
      data: updateData,
    });

    console.log("Career updated successfully:", id);

    // Format dates for frontend
    const formattedCareer = {
      ...career,
      deadline: career.deadline.toISOString().split("T")[0],
      createdAt: career.createdAt.toISOString().split("T")[0],
      updatedAt: career.updatedAt.toISOString().split("T")[0],
    };

    return formattedCareer;
  } catch (error) {
    console.error("Error in updateCareerService:", error);
    throw error;
  }
};

export const deleteCareerService = async (id: number) => {
  try {
    console.log("Deleting career:", id);

    // Check if career exists
    const existingCareer = await prisma.career.findUnique({
      where: { id },
    });

    if (!existingCareer) {
      console.log("Career not found for deletion:", id);
      return null;
    }

    const career = await prisma.career.delete({
      where: { id },
    });

    console.log("Career deleted successfully:", id);
    return career;
  } catch (error) {
    console.error("Error in deleteCareerService:", error);
    throw error;
  }
};

// Service to update expired careers (can be run as a cron job)
export const updateExpiredCareersService = async () => {
  try {
    console.log("Updating expired careers");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.career.updateMany({
      where: {
        deadline: {
          lt: today,
        },
        status: "active",
      },
      data: {
        status: "expired",
      },
    });

    console.log(`Updated ${result.count} expired careers`);
    return result;
  } catch (error) {
    console.error("Error in updateExpiredCareersService:", error);
    throw error;
  }
};
