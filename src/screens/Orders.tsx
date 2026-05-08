import React, { useState } from 'react';
import { Calendar, DollarSign, User } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Badge } from '../components/ui/badge';
import { mockOrders } from '../lib/mockData';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { OrderStatus } from '../lib/types';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');

  const tabs: { label: string, value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Stitching', value: 'stitching' },
    { label: 'Ready', value: 'ready' },
    { label: 'Delivered', value: 'delivered' },
  ];

  const filteredOrders = mockOrders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          o.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTabCount = (tab: OrderStatus | 'all') => {
    if (tab === 'all') return mockOrders.length;
    return mockOrders.filter(o => o.status === tab).length;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage all your tailoring orders</p>
      </div>

      {/* Search */}
      <SearchBar 
        placeholder="Search by customer or order #..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              activeTab === tab.value 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full ml-1",
              activeTab === tab.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              {getTabCount(tab.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-4 pb-12">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border">
            <p>No orders found.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground text-base leading-tight">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.clothingType} • {order.id}</p>
                  </div>
                  <Badge variant={order.status} className="capitalize">{order.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(order.deliveryDate)}</span>
                  </div>
                  
                  {order.workerName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate">{order.workerName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium text-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatCurrency(order.price)}</span>
                  </div>

                  {order.remainingPayment > 0 && (
                    <div className="flex items-center text-xs font-semibold text-orange-600">
                      Bal: {formatCurrency(order.remainingPayment)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
