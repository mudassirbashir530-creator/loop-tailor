import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Share2, Edit2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

interface InvoiceActionsProps {
  invoiceRef: React.RefObject<HTMLDivElement>;
  orderId: string;
  customerName: string;
  shopName: string;
  currentFooter: string;
  onSaveFooter: (newFooter: string) => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoiceRef,
  orderId,
  customerName,
  shopName,
  currentFooter,
  onSaveFooter
}) => {
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [footerText, setFooterText] = useState(currentFooter);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const generateCanvas = async () => {
    if (!invoiceRef.current) return null;
    return await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
  };

  const handleSaveAsPNG = async () => {
    try {
      setIsActionLoading(true);
      const canvas = await generateCanvas();
      if (!canvas) return;
      
      const link = document.createElement('a');
      link.download = `Invoice-${orderId.slice(-6)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsActionLoading(true);
      const canvas = await generateCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File(
          [blob], 
          `Invoice-${orderId.slice(-6)}.png`,
          { type: 'image/png' }
        );
        
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Invoice - ${customerName}`,
              text: `Order Invoice from ${shopName}`,
              files: [file]
            });
          } catch (e: any) {
             if (e.name !== 'AbortError') {
               handleSaveAsPNG();
             }
          }
        } else {
          // Fallback: download
          handleSaveAsPNG();
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveFooterClick = () => {
    onSaveFooter(footerText);
    setIsEditingFooter(false);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto mt-6 space-y-6">
      {/* Action Buttons */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-wrap sm:flex-nowrap justify-center gap-3 shadow-sm">
        <Button 
          variant="outline"
          onClick={handleSaveAsPNG}
          disabled={isActionLoading}
          className="flex-1 min-w-[120px] rounded-xl font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-100 h-14"
        >
          <Download className="w-5 h-5 mr-2 text-primary" />
          📥 Save PNG
        </Button>
        <Button 
          onClick={handleShare}
          disabled={isActionLoading}
          className="flex-1 min-w-[120px] rounded-xl font-bold bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white shadow-md active:scale-95 transition-transform h-14"
        >
          <Share2 className="w-5 h-5 mr-2" />
          📤 Share
        </Button>
        <Button 
          variant="outline"
          onClick={() => setIsEditingFooter(!isEditingFooter)}
          className="flex-1 min-w-[120px] rounded-xl font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-100 h-14"
        >
          <Edit2 className="w-5 h-5 mr-2 text-primary" />
          ✏️ Edit Footer
        </Button>
      </div>

      {/* Footer Edit Mode */}
      {isEditingFooter && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Edit Invoice Footer</p>
          <textarea
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 focus:border-[#1a3a2a] outline-none text-sm font-medium resize-none shadow-inner bg-slate-50"
            rows={3}
            placeholder={`Thank you for choosing ${shopName}!\nFor queries contact us on WhatsApp.`}
          />
          <div className="flex justify-end mt-4 gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditingFooter(false)}
              className="rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveFooterClick}
              className="rounded-xl bg-[#1a3a2a] text-white font-bold"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Footer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
