import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name must be at most 100 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  emailVerified: z.boolean().default(false),
  image: z.string().url({ message: "Invalid image URL" }).optional(),
  role: z.string().optional(),
  banned: z.boolean().default(false).optional(),
  banReason: z.string().optional(),
  banExpires: z.date().optional(),
});

export const sessionSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  expiresAt: z.date({ message: "Expiration date is required" }),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().min(1, { message: "User ID is required" }),
  impersonatedBy: z.string().optional(),
});

export const accountSchema = z.object({
  accountId: z.string().min(1, { message: "Account ID is required" }),
  providerId: z.string().min(1, { message: "Provider ID is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  idToken: z.string().optional(),
  accessTokenExpiresAt: z.date().optional(),
  refreshTokenExpiresAt: z.date().optional(),
  scope: z.string().optional(),
  password: z.string().optional(),
});

export const verificationSchema = z.object({
  identifier: z.string().min(1, { message: "Identifier is required" }),
  value: z.string().min(1, { message: "Value is required" }),
  expiresAt: z.date({ message: "Expiration date is required" }),
});

export const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  whatsappNumber: z
    .string()
    .min(10, "WhatsApp number must be at least 10 digits"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  registration: z.string().min(2, "Registration number is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
  branch: z.string().min(1, "Please select a branch"),
  admissionYear: z.string().min(1, "Please select admission year"),
  collegeName: z.string().min(1, "Please select a college"),
  collegeAddress: z.string().min(5, "College address is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  postOffice: z.string().min(1, "Post Office is required"),
  policeStation: z.string().min(1, "Police Station is required"),
  block: z.string().min(1, "Block is required"),
  pinCode: z.string().min(4, "Pin Code is required"),
  state: z.string().min(1, "Please select a state"),
  district: z.string().min(1, "Please select a district"),
});

export type FormValues = z.infer<typeof formSchema>;