// services/twoFactorService.ts
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import config from "../../config";

export const generate2FACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const send2FACode = async (
  email: string,
  code: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: Number(config.smtp.port) === 465, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  } as nodemailer.TransportOptions);

  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const save2FACode = async (
  userId: string,
  code: string
): Promise<void> => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorCode: code,
      twoFactorExpires: expiresAt,
    },
  });
};

export const verify2FACode = async (
  userId: string,
  code: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorCode: true, twoFactorExpires: true },
  });

  if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
    return false;
  }

  // Check if code is expired
  if (user.twoFactorExpires < new Date()) {
    return false;
  }

  // Check if code matches
  return user.twoFactorCode === code;
};

export const clear2FACode = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorCode: null,
      twoFactorExpires: null,
    },
  });
};
