import MainView from "@/components/MainView";
import CameraDropdownTop from "@/components/CameraDropdownTop";
import AddCameraButton from "@/components/AddCameraButton";
import CameraSettingsButton from "@/components/CameraSettingsButton";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-linear-to-b from-gray-900 via-gray-900 to-black">
      {/* Minimal Header */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              VAPR
            </h1>
            <p className="text-xs text-gray-500">
              Video Analytics Pro Recorder
            </p>
          </div>
        </div>

        {/* Right side - Settings/Info */}
        <div className="flex items-center gap-4">
          {/* Camera dropdown and add button in header */}
          <div className="hidden md:flex items-center gap-2">
            <CameraDropdownTop />
            <AddCameraButton />
          </div>
          <CameraSettingsButton />
          <a
            href="https://github.com/theVerveAutomation/verve-recorder"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main View (handles cameras, video grid, controls) */}
      <MainView />
    </div>
  );
}
