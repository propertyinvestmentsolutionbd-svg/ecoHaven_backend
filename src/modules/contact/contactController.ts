// controllers/contactController.ts
import { Request, Response } from "express";
import {
  createContactService,
  getAllContactsService,
  getContactByIdService,
  updateContactService,
  deleteContactService,
  markAsReadService,
  markAsRepliedService,
  markMultipleAsReadService,
  getContactStatsService,
} from "./contactService";
import { reponseFormat } from "../../shared/responseFormat";
import catchAsync from "../../shared/catchAsync";

// Create new contact (public endpoint)
export const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await createContactService(req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 201,
    message: "Contact message sent successfully",
    data: result,
  });
});

// Get all contacts (admin only)
export const getAllContacts = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      search: req.query.search as string,
      read: req.query.read ? req.query.read === "true" : undefined,
      replied: req.query.replied ? req.query.replied === "true" : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await getAllContactsService(filters, page, limit);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Contacts retrieved successfully",
      data: result,
    });
  }
);

// Get single contact (admin only)
export const getContactById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await getContactByIdService(parseInt(id));

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Contact retrieved successfully",
      data: result,
    });
  }
);

// Update contact (admin only)
export const updateContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await updateContactService(parseInt(id), req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Contact updated successfully",
    data: result,
  });
});

// Delete contact (admin only)
export const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteContactService(parseInt(id));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Contact deleted successfully",
    data: result,
  });
});

// Mark contact as read (admin only)
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await markAsReadService(parseInt(id));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Contact marked as read",
    data: result,
  });
});

// Mark contact as replied (admin only)
export const markAsReplied = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await markAsRepliedService(parseInt(id));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Contact marked as replied",
    data: result,
  });
});

// Mark multiple contacts as read (admin only)
export const markMultipleAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    const result = await markMultipleAsReadService(ids);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    });
  }
);

// Get contact statistics (admin only)
export const getContactStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getContactStatsService();

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Contact statistics retrieved successfully",
      data: result,
    });
  }
);
