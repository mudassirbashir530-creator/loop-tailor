import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';

interface RecordStaffPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { 
    amount: number; 
    method: string; 
    type: string; 
    note: string;
    date: string;
  }) => void;
  staffName: string;
}

export function RecordStaffPaymentModal({ isOpen, onClose, onConfirm, staffName }: RecordStaffPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [type, setType] = useState('Salary');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    
    onConfirm({ 
      amount: Number(amount), 
      method, 
      type, 
      note,
      date: new Date(date).toISOString()
    });
    
    // Reset
    setAmount('');
    setNote('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment for {staffName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash (نقد)</SelectItem>
                <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                <SelectItem value="JazzCash">JazzCash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Payment Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary">Salary (ماہانہ تنخواہ)</SelectItem>
                <SelectItem value="Advance">Advance (ایڈوانس)</SelectItem>
                <SelectItem value="Bonus">Bonus (بونس)</SelectItem>
                <SelectItem value="Overtime">Overtime (اوور ٹائم)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note / Description (Optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g. Remaining balance for May"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold">
              Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
