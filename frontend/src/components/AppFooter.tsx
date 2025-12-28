export default function AppFooter({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div>
          Version <span className="font-medium text-gray-700">{__APP_VERSION__}</span>
        </div>
        <div>Built with love in India</div>
      </div>
    </div>
  );
}



