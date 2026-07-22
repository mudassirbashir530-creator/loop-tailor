import React from 'react';
import { X, Download, Trash2, Edit2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onDelete?: () => void;
  onReplace?: () => void;
  title?: string;
}

export function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onDelete, 
  onReplace,
  title = "Image Preview" 
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `TailorImage-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 h-[80vh] md:h-[90vh] bg-black/95 border-none overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/50 text-white z-50">
          <div className="flex flex-col">
             <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={() => setRotation(r => r + 90)}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            {onReplace && (
              <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={onReplace}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" className="text-destructive hover:bg-destructive/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" className="text-white hover:bg-white/20 h-11 w-11 p-2 flex items-center justify-center rounded-lg ml-2" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={imageUrl}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out'
              }}
            >
              <img 
                src={imageUrl} 
                alt="Full Preview" 
                className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain shadow-2xl rounded-sm"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
