import fs from 'fs';
import path from 'path';

const file = 'src/pages/CustomerDetails.tsx';
let content = fs.readFileSync(file, 'utf8');

const returnStartStr = `  if (!customer) return null;`;
let idx = content.indexOf(returnStartStr);
if (idx === -1) {
  console.log("Could not find line: if (!customer) return null;");
  process.exit(1);
}

// Find the end of the file. It's safe to just replace the remainder.
// Wait, we need to extract `activeOrdersCount` logic that might be there.
// We will just rewrite from `if (!customer) return null;` downwards.

const replacement = `  if (!customer) return null;

  // Visual filters for Orders list
  const [orderFilter, setOrderFilter] = useState<'All' | 'Complete' | 'Not Complete'>('All');
  const [activeTab, setActiveTab] = useState<'Orders' | 'Measurements'>('Orders');

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'All') return true;
    if (orderFilter === 'Complete') return o.status === ORDER_STATUS.DELIVERED;
    return o.status !== ORDER_STATUS.DELIVERED;
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate('/dashboard/customers')} className="p-2">
          <ArrowLeft className="h-6 w-6 text-[#0F172A]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#0F172A]">Customer Detail</h1>
        <button className="p-2" onClick={() => setIsEditingCustomer(!isEditingCustomer)}>
          <Edit className="h-5 w-5 text-[#0F172A]" />
        </button>
      </div>

      <AnimatePresence>
        {isEditingCustomer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 mb-6 overflow-hidden">
             <div className="bg-white p-4 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
               <h3 className="font-bold text-[#0F172A] mb-3">Edit Customer</h3>
               <form onSubmit={handleUpdateCustomer} className="space-y-3">
                 <Input value={editCustomerData.name} onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} placeholder="Name" className="bg-[#F1F5F9] border-none" />
                 <Input value={editCustomerData.phone} onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} placeholder="Phone" className="bg-[#F1F5F9] border-none" />
                 <Input value={editCustomerData.address} onChange={e => setEditCustomerData({...editCustomerData, address: e.target.value})} placeholder="Address" className="bg-[#F1F5F9] border-none" />
                 <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" onClick={() => setIsEditingCustomer(false)} className="bg-transparent text-[#64748B] border border-[#E2E8F0] rounded-full px-5 py-2 h-auto text-[14px]">Cancel</Button>
                   <Button type="submit" className="bg-[#16A34A] text-white rounded-full px-5 py-2 h-auto text-[14px]">Save</Button>
                 </div>
               </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Section */}
      <div className="px-4 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-[72px] h-[72px] rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-2xl font-bold mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-[18px] font-bold text-[#0F172A]">{customer.name}</div>
          <div className="text-[13px] text-[#64748B] mb-5">ID: {customer.id.substring(0,8)}</div>
          
          <div className="w-full flex justify-center items-center bg-white rounded-[16px] py-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              <div className="text-[12px] text-[#64748B] mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> Phone</div>
              <div className="text-[14px] font-semibold text-[#0F172A] text-center">{customer.phone}</div>
            </div>
            <div className="h-10 w-[1px] bg-[#E2E8F0]"></div>
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              <div className="text-[12px] text-[#64748B] mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Location</div>
              <div className="text-[14px] font-semibold text-[#0F172A] text-center line-clamp-1">{customer.address || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="px-4 mb-6 flex justify-center">
        <div className="bg-[#F1F5F9] rounded-full p-1 flex">
          {['Orders', 'Measurements'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-8 py-2 rounded-full text-[14px] font-semibold transition-all",
                activeTab === tab ? "bg-[#16A34A] text-white shadow-sm" : "text-[#64748B] bg-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4 flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          {activeTab === 'Orders' ? 'Order History' : 'Measurements'}
        </h2>
        {activeTab === 'Orders' && (
          <Button onClick={() => setIsAddingOrder(!isAddingOrder)} className="bg-[#16A34A] text-white rounded-full h-8 px-4 text-[13px] font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4"/> New Order
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAddingOrder && activeTab === 'Orders' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 mb-6 overflow-hidden">
             <div className="bg-white p-4 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
               <h3 className="font-bold text-[#0F172A] mb-3">Add New Order</h3>
               <form onSubmit={handleCreateOrder} className="space-y-3">
                 <Input value={newOrder.dressType} onChange={e => setNewOrder({...newOrder, dressType: e.target.value})} placeholder="Dress Type" required className="bg-[#F1F5F9] border-none" />
                 <Input type="date" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} required className="bg-[#F1F5F9] border-none" />
                 <Input type="number" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} placeholder="Total Price" required className="bg-[#F1F5F9] border-none" />
                 <Input type="number" value={newOrder.advancePayment} onChange={e => setNewOrder({...newOrder, advancePayment: e.target.value})} placeholder="Advance Payment" className="bg-[#F1F5F9] border-none" />
                 <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" onClick={() => setIsAddingOrder(false)} className="bg-transparent text-[#64748B] border border-[#E2E8F0] rounded-full px-5 py-2 h-auto text-[14px]">Cancel</Button>
                   <Button disabled={isUploading} type="submit" className="bg-[#16A34A] text-white rounded-full px-5 py-2 h-auto text-[14px]">
                     {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create'}
                   </Button>
                 </div>
               </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'Orders' ? (
        <>
          {/* Orders Filter Pills */}
          <div className="flex gap-2 px-4 mb-4">
            {['All', 'Complete', 'Not Complete'].map(f => (
              <button 
                key={f}
                onClick={() => setOrderFilter(f as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  orderFilter === f ? "bg-[#16A34A] text-white" : "bg-white text-[#64748B] border border-[#E2E8F0]"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="px-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-[14px]">No orders found.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]" onClick={() => navigate(\`/dashboard/orders/\${order.id}\`)}>
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#0F172A] truncate leading-tight">{order.dressType || 'Order'}</div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                    <div className="text-[14px] font-semibold text-[#0F172A] leading-none mb-0.5">{(order.price || 0).toLocaleString()}</div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider leading-relaxed",
                      order.status === ORDER_STATUS.DELIVERED ? "bg-[#16A34A]" : 
                      order.status === ORDER_STATUS.PENDING ? "bg-[#F59E0B]" : "bg-[#1E293B]"
                    )}>
                      {order.status === ORDER_STATUS.DELIVERED ? 'Completed' : 
                       order.status === ORDER_STATUS.PENDING ? 'Pending' : 'Not Complete'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="px-4">
           {/* Measurements UI preserving original Logic */}
           <div className="bg-white p-5 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] mb-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                {Object.keys(measurementSets).map((setName) => (
                  <button
                    key={setName}
                    onClick={() => setActiveSet(setName)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap",
                      activeSet === setName 
                        ? "bg-[#16A34A] text-white" 
                        : "bg-[#F1F5F9] text-[#64748B]"
                    )}
                  >
                    {setName}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSaveMeasurements} className="grid grid-cols-2 gap-4">
                {getMeasurementCategoriesForDress(activeSet, selectedGender).map((cat) => (
                  <div key={cat.id} className="col-span-2 sm:col-span-1">
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1.5 ml-1">{cat.label.en}</label>
                    <Input 
                      type={cat.type === 'number' ? 'number' : 'text'}
                      value={measurements[cat.id] || ''}
                      onChange={(e) => setMeasurements({...measurements, [cat.id]: e.target.value})}
                      placeholder={cat.placeholder?.en}
                      className="bg-[#F8FAFC] border-[#E2E8F0] h-[44px] rounded-[12px] text-[14px]"
                    />
                  </div>
                ))}
                <div className="col-span-2 pt-2">
                  <Button type="submit" disabled={savingMeasurements} className="w-full bg-[#16A34A] text-white rounded-full py-6 text-[15px] font-semibold">
                    {savingMeasurements ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Save Measurements'}
                  </Button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.slice(0, idx) + replacement;
fs.writeFileSync(file, content);
console.log('Successfully replaced Customer JSX');
