import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Scissors, Ruler, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { mockCustomers, mockWorkers } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export default function NewOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [advance, setAdvance] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Order created successfully!");
      navigate('/app/orders');
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in slide-in-from-right-4 duration-300 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New Order</h1>
          <p className="text-sm text-muted-foreground">Create a new tailoring order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card 1: Customer Info */}
        <FormCard title="Customer Information" icon={<User className="h-5 w-5" />}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select Customer</label>
            <select className="w-full h-12 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
              <option value="">Choose a customer...</option>
              {mockCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
        </FormCard>

        {/* Card 2: Order Details */}
        <FormCard title="Order Details" icon={<Scissors className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Clothing Type</label>
              <Input placeholder="e.g. Shalwar Kameez, Pant Coat" required />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign Worker (Optional)</label>
              <select className="w-full h-12 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Unassigned</option>
                {mockWorkers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Design Notes</label>
              <textarea 
                className="w-full min-h-[100px] rounded-xl border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Collar style, cuffs, pockets..."
              />
            </div>
          </div>
        </FormCard>

        {/* Card 3: Measurements */}
        <FormCard title="Measurements (Inches)" icon={<Ruler className="h-5 w-5" />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Shoulder</label><Input type="number" step="0.25" placeholder="0.0" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Chest</label><Input type="number" step="0.25" placeholder="0.0" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Waist</label><Input type="number" step="0.25" placeholder="0.0" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Hip</label><Input type="number" step="0.25" placeholder="0.0" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Length</label><Input type="number" step="0.25" placeholder="0.0" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Sleeve</label><Input type="number" step="0.25" placeholder="0.0" /></div>
          </div>
        </FormCard>

        {/* Card 4: Payment */}
        <FormCard title="Payment & Delivery" icon={<DollarSign className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total Price</label>
                <Input 
                  type="number" 
                  required 
                  min="0"
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Advance</label>
                <Input 
                  type="number" 
                  min="0"
                  onChange={e => setAdvance(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Delivery Date</label>
              <Input type="date" required />
            </div>

            <div className="bg-muted p-4 rounded-xl flex justify-between items-center border">
              <span className="text-sm font-medium text-muted-foreground">Remaining</span>
              <span className="font-bold text-lg text-orange-600">{formatCurrency(Math.max(0, price - advance))}</span>
            </div>
          </div>
        </FormCard>

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </Button>

      </form>
    </div>
  );
}

function FormCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="text-primary">{icon}</div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
