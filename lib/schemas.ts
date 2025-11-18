import { z } from "zod";

const emailValidation = z
  .string()
  .email()
  .refine((email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    const tld = email.split(".").pop();
    if (tld && tld.length < 2) {
      return false;
    }
    return true;
  }, "Invalid email format");

export const signupSchema = z
  .object({
    email: emailValidation,
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string(),
    firstName: z.string().min(1, { message: 'First Name is required' }),
    lastName: z.string().min(1, { message: 'Last Name is required' }),
    phoneNumber: z.string().regex(/^\+?\d{10,15}$/, { message: 'Must be valid phone number' }),
    dateOfBirth: z.coerce
      .date()
      .max(new Date(), { message: "Date of birth must be in the past" })
      .refine(
        (date) => {
          const today = new Date();
          const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
          return date <= eighteenYearsAgo;
        },
        { message: "You must be at least 18 years old to sign up" }
      ),
    ssn: z.string().regex(/^\d{9}$/, { message: 'Must be valid 9 digit SSN' }),
    address: z.string().min(1, { message: 'Address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().length(2).toUpperCase(),
    zipCode: z.string().regex(/^\d{5}$/, { message: 'Must be valid 5 digit zip code' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailValidation,
  password: z.string(),
});
