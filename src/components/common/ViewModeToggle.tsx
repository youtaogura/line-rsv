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
    <div className="flex space-x-2">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onModeChange(mode.key)}
          className={`px-4 py-2 rounded-md ${
            currentMode === mode.key
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};