import { z } from "zod";

const trimString = z.string().transform((v) => v.trim());

export const ModeratorOnboardingSchema = z
  .object({
    targetStateId: z.string().min(1, "Select the target state"),
    residenceStateId: z.string().min(1, "Select your residence state"),
    residenceCity: z.string().min(1, "City is required"),
    educationField: z.string().min(1, "Education field is required"),
    linkedin: trimString,
    x: trimString,
    reddit: trimString,
  })
  .refine(
    (data) =>
      [data.linkedin, data.x, data.reddit].some((v) => v.length > 0),
    {
      message:
        "Please provide at least one social profile: LinkedIn, X, or Reddit.",
      path: ["linkedin"],
    }
  );

export type ModeratorOnboardingValues = z.infer<
  typeof ModeratorOnboardingSchema
>;

