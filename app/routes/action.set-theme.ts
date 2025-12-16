import { createThemeAction } from "remix-themes";
import { themeSessionResolver } from "../sessions.theme.server";

export const action = createThemeAction(themeSessionResolver);
