import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewModeToggleProps {
  currentMode: string;
  modes: Array<{
    key: string;
    label: string;
  }>;
  onModeChange: (mode: string) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  currentMode,
  modes,
  onModeChange,
}) => {
  return (
    <Tabs value={currentMode} onValueChange={onModeChange}>
      <TabsList>
        {modes.map((mode) => (
          <TabsTrigger key={mode.key} value={mode.key}>
            {mode.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
