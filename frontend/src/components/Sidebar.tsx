import { File, Trash2, Library } from 'lucide-react';

interface SidebarProps {
  files: File[];
  onClearChat: () => void;
}

export function Sidebar({ files, onClearChat }: SidebarProps) {
  return (
    <aside className="w-80 h-full bg-card border-r border-border flex flex-col hidden md:flex">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <Library className="w-6 h-6 text-primary" />
          NotebookLM Clone
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sources</h2>

          <div className="mt-4 flex flex-col gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg border border-border/50 shadow-sm">
                <div className="p-1.5 bg-primary/20 rounded text-primary">
                  <File className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="text-center p-4 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                No sources added yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-border">
        <button
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Conversation
        </button>
      </div>
    </aside>
  );
}
