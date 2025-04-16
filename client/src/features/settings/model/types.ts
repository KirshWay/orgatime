import { z } from "zod";

import { settingsSchema } from "./validation";

export type SettingsFormData = z.infer<typeof settingsSchema>;
