import fs from 'fs';
import path from 'path';

const file = 'src/pages/Orders.tsx';
let content = fs.readFileSync(file, 'utf8');

const startString = `return (\n    <div className="space-y-8">`;
let idx = content.lastIndexOf(startString);

if (idx === -1) {
  console.log("Could not find startString");
  process.exit(1);
}

const replacement = `return (
    <div className="min-h-screen bg-[#F5F7FA] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate(-1)} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Orders</h1>
        <button className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>
      </div>

      {/* Toggle Stats Pills */}
      <div className="flex gap-3 px-4 mb-5">
        <div className="flex-1 rounded-full bg-[#16A34A] text-white text-center py-2 text-[14px] font-semibold">Total: {orders.length.toString().padStart(2, '0')}</div>
        <div className="flex-1 rounded-full bg-white border-2 border-[#16A34A] text-[#16A34A] text-center py-2 text-[14px] font-semibold">Filtered: {filteredOrders.length.toString().padStart(2, '0')}</div>
      </div>

      {/* Filter Row */}
      <div className="px-4 mb-6 flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Enter Order ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[48px] rounded-[12px] bg-white border border-[#E2E8F0] pl-10 pr-3 focus:outline-none focus:border-[#16A34A] text-[14px] placeholder-[#94A3B8]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
        </div>
        <div className="flex-1 relative">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-[48px] rounded-[12px] bg-white border border-[#E2E8F0] pl-3 pr-10 appearance-none focus:outline-none focus:border-[#16A34A] text-[14px] font-medium text-[#0F172A]"
          >
            <option value="All">All Statuses</option>
            {Object.values(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      {/* Order List */}
      <div className="px-4 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1" className="mb-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">No orders yet</h3>
            <p className="text-[13px] text-[#64748B]">Try adjusting your filters or search</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
              <div className="w-[56px] h-[56px] rounded-[16px] flex-shrink-0 bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] overflow-hidden">
                <Scissors className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#0F172A] truncate leading-tight">{order.dressType || 'Custom Order'}</div>
                <div className="text-[12px] text-[#64748B] mt-0.5 mix-blend-multiply">ID: {order.tokenId || order.id.slice(0,8)}</div>
                <div className="text-[12px] text-[#64748B] mix-blend-multiply">{order.createdAt ? startOfDay(order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt)).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[15px] font-semibold text-[#16A34A] leading-tight mb-2">{(order.price || 0).toLocaleString()}</div>
                <Link to={\`/dashboard/orders/\${order.id}\`} className="text-[12px] font-medium text-[#16A34A] underline">View details</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`;

content = content.slice(0, idx) + replacement;
fs.writeFileSync(file, content);
console.log('Successfully replaced Orders JSX');
