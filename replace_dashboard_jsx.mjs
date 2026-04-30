import fs from 'fs';
import path from 'path';

const file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const returnStart = content.indexOf('return (', content.indexOf('if (!loading && !hasData)'));
// Actually, it's safer to just replace from the final return statement until the end of the file.
// The final return starts with `return (\n    <>\n      <OnboardingTour />`
const startString = `return (\n    <>`;
let idx = content.lastIndexOf(startString);

if (idx === -1) {
  console.log("Could not find startString");
  process.exit(1);
}

const replacement = `return (
    <>
      <OnboardingTour />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("bg-[#F5F7FA] min-h-screen pb-[80px]", loading ? "opacity-70 pointer-events-none animate-pulse" : "")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div>
              <div className="font-bold text-[18px] text-[#0F172A] leading-tight">
                Hello, {user?.displayName?.split(' ')[0] || 'Tailor'}
              </div>
              <div className="text-[13px] text-[#64748B]">Good morning</div>
            </div>
          </div>
          <button className="relative p-2 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-6">
          <form 
            onSubmit={handleTokenSearch} 
            className="flex items-center gap-3 relative h-[44px] bg-[#F1F5F9] rounded-[12px] px-3"
          >
            <Search className="h-5 w-5 text-[#64748B]" />
            <input 
              type="text"
              placeholder="Search orders, customers..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-1 bg-transparent border-none shadow-none p-0 focus:ring-0 text-[#0F172A] text-[14px]"
            />
            {searchError && (
              <p className="absolute -bottom-6 left-0 text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">{searchError}</p>
            )}
            <div className="ml-auto flex items-center justify-center w-8 h-8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </div>
          </form>
        </div>

        {/* Featured Card */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] rounded-[20px] p-5 text-white relative overflow-hidden shadow-[0_4px_16px_rgba(22,163,74,0.3)]">
            <svg className="absolute right-0 bottom-0 opacity-10" width="120" height="120" viewBox="0 0 100 100" fill="white"><circle cx="80" cy="80" r="50"/></svg>
            <div className="relative z-10">
              <div className="text-[13px] font-medium opacity-90 mb-1">Today's Revenue</div>
              <div className="text-[28px] font-bold tracking-tight mb-4">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] opacity-70 uppercase tracking-widest">{t('dashboard.activeOrders')}</div>
                  <div className="text-lg font-bold">{stats.activeOrders}</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-70 uppercase tracking-widest">Completed</div>
                  <div className="text-lg font-bold">{stats.completedOrders}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Quick Access */}
        <div className="px-4 mb-8">
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
            {[
              { label: 'Orders', icon: Scissors, path: '/dashboard/orders', color: 'bg-green-100 text-[#16A34A]' },
              { label: 'Customers', icon: Users, path: '/dashboard/customers', color: 'bg-blue-100 text-blue-600' },
              { label: 'Measurements', icon: FileText, path: '/dashboard/measurements', color: 'bg-purple-100 text-purple-600' },
              { label: 'Designs', icon: TrendingUp, path: '/dashboard', color: 'bg-orange-100 text-orange-600' },
              { label: 'Payments', icon: Search, path: '/dashboard/settings', color: 'bg-indigo-100 text-indigo-600' },
            ].map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]" onClick={() => navigate(cat.path)}>
                <div className={cn("w-[56px] h-[56px] rounded-full flex items-center justify-center", cat.color)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-medium text-[#64748B]">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Orders / Recent */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#0F172A]">Today's Orders</h2>
            <Link to="/dashboard/orders" className="text-[13px] font-medium text-[#16A34A] border border-[#16A34A] rounded-full px-3 py-1">See All</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center text-sm text-[#64748B] py-4 bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">No orders today</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]" onClick={() => navigate(\`/dashboard/orders/\${order.id}\`)}>
                  <div className="w-[56px] h-[56px] rounded-[14px] bg-[#F1F5F9] flex items-center justify-center text-[#16A34A]">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-[#0F172A]">{order.customerName}</div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">{order.dressType}</div>
                    <div className="text-[12px] text-[#64748B]">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold text-[#16A34A] mb-1">{formatCurrency(order.price)}</div>
                    <div className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block", order.status === ORDER_STATUS.DELIVERED ? "bg-[#16A34A] text-white" : "bg-[#1E293B] text-white")}>
                      {t(\`orders.\${order.status.toLowerCase()}\`)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers (Using first 3 recent orders as dummy Top Customers for visually satisfying layout per instructions) */}
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#0F172A]">Top Customers</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
            {recentOrders.slice(0,4).map((order, i) => (
              <div key={i} className="flex flex-col items-center min-w-[72px] bg-white rounded-[16px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
                <div className="w-[52px] h-[52px] rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-lg font-bold mb-2">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="text-[12px] font-medium text-[#0F172A] line-clamp-1 text-center w-full">{order.customerName.split(' ')[0]}</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">3 Orders</div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </>
  );
}`;

content = content.slice(0, idx) + replacement;
fs.writeFileSync(file, content);
console.log('Successfully replaced Dashboard JSX');
