import { Pipette, Trash } from 'lucide-react';

import { TASK_COLOR_HEX, TaskColor } from '@/entities/task';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Separator } from '@/shared/ui/separator';

import { getTaskColorClass } from './task-color-utils';

type Props = {
  selectedColor: TaskColor | null;
  onColorChange: (color: TaskColor | null) => void;
};

export const ColorPicker: React.FC<Props> = ({
  selectedColor,
  onColorChange,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        className={cn(
          'rounded-full h-8 w-8 p-0 sm:h-10 sm:w-10',
          selectedColor && getTaskColorClass(selectedColor),
          selectedColor && 'bg-task-color',
        )}
        variant="outline"
        title="Change color"
      >
        <Pipette className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="p-3">
      <DropdownMenuGroup className="flex justify-center gap-2">
        <DropdownMenuItem onClick={() => onColorChange('STANDART')}>
          <div
            className="w-6 h-6 rounded-full cursor-pointer"
            style={{ backgroundColor: TASK_COLOR_HEX.STANDART }}
          />
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onColorChange('BLUE')}>
          <div
            className="w-6 h-6 rounded-full cursor-pointer"
            style={{ backgroundColor: TASK_COLOR_HEX.BLUE }}
          />
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onColorChange('RED')}>
          <div
            className="w-6 h-6 rounded-full cursor-pointer"
            style={{ backgroundColor: TASK_COLOR_HEX.RED }}
          />
        </DropdownMenuItem>

        {selectedColor && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenuItem onClick={() => onColorChange(null)}>
              <div className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 flex items-center justify-center">
                <Trash className="h-3 w-3 text-gray-500" />
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);
