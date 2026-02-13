import { app } from "./app";
import { checklist } from "./checklist";
import { dialog } from "./dialog";
import { persistence } from "./persistence";
import { shell } from "./shell";
import { theme } from "./theme";
import { updater } from "./updater";
import { window } from "./window";

export const router = {
  theme,
  window,
  app,
  shell,
  updater,
  checklist,
  dialog,
  persistence,
};
