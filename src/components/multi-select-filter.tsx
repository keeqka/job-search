import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  renderLabel = (v) => v,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** Maps a raw option value to its display label; the value passed to onChange stays untranslated. */
  renderLabel?: (value: string) => string;
}) {
  const { t } = useTranslation();
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="border-dashed" />}>
        {label}
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
            {selected.length}
          </Badge>
        )}
        <ChevronDown className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <CommandItem key={option} onSelect={() => toggle(option)}>
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'opacity-50',
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <span>{renderLabel(option)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onChange([])}>
              {t('common.clearFilters')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
