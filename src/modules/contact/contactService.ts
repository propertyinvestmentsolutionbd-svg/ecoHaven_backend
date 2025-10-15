// services/contactService.ts
import { Prisma } from "@prisma/client";
import {
  IContactCreate,
  IContactUpdate,
  IContactFilters,
  IContactStats,
} from "./contact";
import prisma from "../../shared/prisma";
import APIError from "../../errorHelpers/APIError";

// Create new contact
export const createContactService = async (
  payload: IContactCreate
): Promise<any> => {
  const result = await prisma.contact.create({
    data: payload,
  });

  return result;
};

// Get all contacts with filtering and pagination
export const getAllContactsService = async (
  filters: IContactFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<{
  contacts: any[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  // Build where clause for filters
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { message: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.read !== undefined) {
    where.read = filters.read;
  }

  if (filters.replied !== undefined) {
    where.replied = filters.replied;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    contacts,
    total,
    page,
    totalPages,
  };
};

// Get single contact by ID
export const getContactByIdService = async (id: number): Promise<any> => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new APIError(404, "Contact not found");
  }

  return contact;
};

// Update contact (mark as read/replied)
export const updateContactService = async (
  id: number,
  payload: IContactUpdate
): Promise<any> => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new APIError(404, "Contact not found");
  }

  const result = await prisma.contact.update({
    where: { id },
    data: payload,
  });

  return result;
};

// Delete contact
export const deleteContactService = async (id: number): Promise<any> => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new APIError(404, "Contact not found");
  }

  const result = await prisma.contact.delete({
    where: { id },
  });

  return result;
};

// Mark contact as read
export const markAsReadService = async (id: number): Promise<any> => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new APIError(404, "Contact not found");
  }

  const result = await prisma.contact.update({
    where: { id },
    data: { read: true },
  });

  return result;
};

// Mark contact as replied
export const markAsRepliedService = async (id: number): Promise<any> => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new APIError(404, "Contact not found");
  }

  const result = await prisma.contact.update({
    where: { id },
    data: { replied: true },
  });

  return result;
};

// Mark multiple contacts as read
export const markMultipleAsReadService = async (
  ids: number[]
): Promise<any> => {
  const result = await prisma.contact.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      read: true,
    },
  });

  return {
    count: result.count,
    message: `${result.count} contacts marked as read`,
  };
};

// Get contact statistics
export const getContactStatsService = async (): Promise<IContactStats> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, unread, unreplied, todayCount] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { read: false } }),
    prisma.contact.count({ where: { replied: false } }),
    prisma.contact.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
  ]);

  return {
    total,
    unread,
    unreplied,
    today: todayCount,
  };
};
