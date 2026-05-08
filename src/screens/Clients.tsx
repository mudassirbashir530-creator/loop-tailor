import React, { useState } from 'react';
import { UserPlus, Search, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Button } from '../components/ui/button';
import { mockCustomers } from '../lib/mockData';
import { formatDate } from '../lib/utils';

export default function Clients() {
  const [search, setSearch] = useState('');

  const filteredCustomers = mockCustomers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-muted-foreground">{mockCustomers.length} total customers</p>
        </div>
        <Button size="sm" className="hidden sm:flex gap-2">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
        <Button size="icon" className="sm:hidden">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <SearchBar 
        placeholder="Search by name or phone..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border">
            <p>No customers found.</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <p className="font-bold text-foreground">{customer.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-bold">{customer.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{customer.totalOrders} {customer.totalOrders === 1 ? 'Order' : 'Orders'}</span>
                  </div>
                  <span>Joined {formatDate(customer.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
