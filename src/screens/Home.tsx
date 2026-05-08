import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, CheckCircle, Banknote } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { mockDashboardStats, mockOrders } from '../lib/mockData';
import { formatCurrency, formatDate } from '../lib/utils';

export default function Home() {
  const { totalOrders, pendingOrders, completedToday, revenue } = mockDashboardStats;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Orders"
          value={totalOrders.toString()}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard 
          title="Pending"
          value={pendingOrders.toString()}
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-100"
        />
        <StatCard 
          title="Completed Today"
          value={completedToday.toString()}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard 
          title="Total Revenue"
          value={formatCurrency(revenue)}
          icon={<Banknote className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <Link to="/app/orders" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        
        <div className="space-y-4">
          {mockOrders.slice(0, 5).map(order => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                
                <div className="flex-1">
                  <p className="font-bold text-foreground mb-0.5">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.clothingType} • {order.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">Delivery: {formatDate(order.deliveryDate)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={order.status}>{order.status}</Badge>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(order.price)}</p>
                    {order.remainingPayment > 0 && (
                      <p className="text-xs text-orange-600 font-medium">Bal: {formatCurrency(order.remainingPayment)}</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon, iconBg }: { title: string, value: string, icon: React.ReactNode, iconBg: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-foreground truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
