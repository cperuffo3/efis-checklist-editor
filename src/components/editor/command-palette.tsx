import { useMemo, useState } from "react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { useChecklistStore } from "@/stores";
import { GroupIcon } from "@/components/editor/group-icon";
import { TypeIndicator } from "@/components/editor/type-indicator";
import { ChecklistGroupCategory, ChecklistItemType } from "@/types/checklist";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Result types for search
interface ChecklistResult {
  fileId: string;
  groupId: string;
  checklistId: string;
  checklistName: string;
  groupName: string;
  groupCategory: ChecklistGroupCategory;
  fileName: string;
}

interface ItemResult {
  fileId: string;
  groupId: string;
  checklistId: string;
  itemId: string;
  challengeText: string;
  responseText: string;
  type: ChecklistItemType;
  checklistName: string;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  const files = useChecklistStore((s) => s.files);
  const setActiveFile = useChecklistStore((s) => s.setActiveFile);
  const setActiveChecklist = useChecklistStore((s) => s.setActiveChecklist);
  const setActiveItem = useChecklistStore((s) => s.setActiveItem);

  // Compute search results
  const { checklistResults, itemResults } = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return { checklistResults: [], itemResults: [] };
    }

    const checklists: ChecklistResult[] = [];
    const items: ItemResult[] = [];

    for (const file of Object.values(files)) {
      for (const group of file.groups) {
        for (const checklist of group.checklists) {
          // Match checklist names
          if (checklist.name.toLowerCase().includes(query)) {
            checklists.push({
              fileId: file.id,
              groupId: group.id,
              checklistId: checklist.id,
              checklistName: checklist.name,
              groupName: group.name,
              groupCategory: group.category,
              fileName: file.name,
            });
          }

          // Match item challenge/response text
          for (const item of checklist.items) {
            const matchesChallenge = item.challengeText
              .toLowerCase()
              .includes(query);
            const matchesResponse = item.responseText
              .toLowerCase()
              .includes(query);

            if (matchesChallenge || matchesResponse) {
              items.push({
                fileId: file.id,
                groupId: group.id,
                checklistId: checklist.id,
                itemId: item.id,
                challengeText: item.challengeText,
                responseText: item.responseText,
                type: item.type,
                checklistName: checklist.name,
              });
            }
          }
        }
      }
    }

    // Limit results to avoid performance issues
    return {
      checklistResults: checklists.slice(0, 10),
      itemResults: items.slice(0, 10),
    };
  }, [search, files]);

  function handleSelectChecklist(result: ChecklistResult) {
    setActiveFile(result.fileId);
    setActiveChecklist(result.checklistId);
    onOpenChange(false);
    setSearch("");
  }

  function handleSelectItem(result: ItemResult) {
    setActiveFile(result.fileId);
    setActiveChecklist(result.checklistId);
    setActiveItem(result.itemId);
    onOpenChange(false);
    setSearch("");
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search checklists and items"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search checklists and items..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {checklistResults.length > 0 && (
            <CommandGroup heading="Checklists">
              {checklistResults.map((result) => (
                <CommandItem
                  key={result.checklistId}
                  onSelect={() => handleSelectChecklist(result)}
                >
                  <GroupIcon
                    category={result.groupCategory}
                    className="size-3.5"
                  />
                  <span className="flex-1 truncate">
                    {result.checklistName}
                  </span>
                  <span className="text-text-muted text-[10px]">
                    {result.groupName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {itemResults.length > 0 && (
            <CommandGroup heading="Items">
              {itemResults.map((result) => (
                <CommandItem
                  key={`${result.checklistId}-${result.itemId}`}
                  onSelect={() => handleSelectItem(result)}
                >
                  <TypeIndicator type={result.type} className="w-5" />
                  <span className="flex-1 truncate">
                    {result.challengeText}
                  </span>
                  {result.responseText && (
                    <span className="text-efis-accent max-w-[30%] truncate text-[10px]">
                      {result.responseText}
                    </span>
                  )}
                  <span className="text-text-muted ml-1 text-[10px]">
                    {result.checklistName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
