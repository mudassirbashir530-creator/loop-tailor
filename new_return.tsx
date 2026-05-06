  const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 bg-[#F7F5F0] min-h-screen border-none", loading && "opacity-70 pointer-events-none")}>
      <OnboardingTour />
      <QuickSetupChecklist />

      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0D3D33] flex items-center gap-2">
            Welcome back 👋
          </h1>
          <p className="text-[#4A5568] mt-2 font-medium text-lg">
            {todayFormatted}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/app/new-order')}
            className="rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out bg-[#0D3D33] text-[#FFFFFF] h-11 px-6 font-medium border-none"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Order
          </Button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-30"
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4A5568] transition-colors group-focus-within:text-[#2ECC71]" />
          <input 
            type="text"
            placeholder="Search customers, orders, measurements..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            onFocus={() => { if (searchToken) setShowSearchResults(true); }}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border-none outline-none ring-1 ring-[#0D3D33]/10 bg-[#FFFFFF] text-[#0D3D33] text-sm focus:ring-4 focus:ring-[#2ECC71]/20 placeholder:text-[#4A5568] transition-all shadow-sm hover:shadow-md duration-200 ease-in-out"
          />
        </div>
        
        <AnimatePresence>
          {showSearchResults && searchToken && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#FFFFFF] rounded-2xl shadow-xl ring-1 ring-[#0D3D33]/10 max-h-96 overflow-y-auto z-50 p-2 overflow-hidden"
            >
               {searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <div 
                      key={res.id} 
                      onClick={() => navigate(res.url)} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                    >
                       <div className="w-10 h-10 rounded-full bg-[#0D3D33]/5 flex items-center justify-center text-[#4A5568]">
                         {res.type === 'customer' && <Users className="h-5 w-5" />}
                         {res.type === 'order' && <Scissors className="h-5 w-5" />}
                         {res.type === 'measurement' && <FileText className="h-5 w-5" />}
                       </div>
                       <div>
                         <div className="text-sm font-bold text-[#0D3D33]">{res.title}</div>
                         <div className="text-xs text-[#4A5568] mt-0.5">{res.subtitle}</div>
                       </div>
                    </div>
                  ))
               ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#4A5568]">No results found for "{searchToken}"</p>
                  </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-[#2ECC71]', bg: 'bg-[#2ECC71]/10' },
          { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'text-[#0D3D33]', bg: 'bg-[#0D3D33]/10' },
          { label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + (i * 0.05) }}
            key={i}
            className="bg-[#FFFFFF] rounded-[1.5rem] p-5 sm:p-6 shadow-sm ring-1 ring-[#0D3D33]/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                 <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
            </div>
            <div>
              <div className="text-[#4A5568] text-sm sm:text-base font-medium mb-1">{stat.label}</div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0D3D33]">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (Recent Orders) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#FFFFFF] rounded-[1.5rem] ring-1 ring-[#0D3D33]/5 shadow-sm hover:shadow-md transition-all duration-300 ease-out p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[#0D3D33]">Recent Orders</h3>
              <Link to="/app/orders" className="text-sm font-bold text-[#2ECC71] hover:text-[#0D3D33] transition-colors flex items-center gap-1 bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20 px-4 py-2 rounded-full">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-[#0D3D33]/10">
                  <p className="text-[#4A5568] font-medium text-lg">No recent orders.</p>
                </div>
              ) : (
                recentOrders.map((order, i) => (
                  <React.Fragment key={order.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (i * 0.05) }}
                      className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 rounded-xl hover:bg-[#F7F5F0] transition-colors duration-200 ease-in-out cursor-pointer group" 
                      onClick={() => navigate(`/app/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 rounded-full bg-[#0D3D33]/5 flex items-center justify-center group-hover:bg-[#0D3D33]/10 transition-colors">
                          <Scissors className="w-6 h-6 text-[#0D3D33] relative rotate-45 transform transition-transform group-hover:rotate-0" />
                        </div>
                        <div>
                          <div className="font-bold text-base sm:text-lg text-[#0D3D33] line-clamp-1">{order.customerName}</div>
                          <div className="text-xs sm:text-sm text-[#4A5568] font-medium mt-0.5">{order.dressType || 'Order'} • #{order.tokenId}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-bold text-lg sm:text-xl text-[#0D3D33]">{formatCurrency(order.price)}</div>
                        <div className={cn("text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block uppercase tracking-wider shadow-sm", 
                          order.status === ORDER_STATUS.DELIVERED ? "bg-[#2ECC71] text-[#FFFFFF]" : 
                          order.status === ORDER_STATUS.READY ? "bg-blue-500 text-[#FFFFFF]" :
                          order.status === ORDER_STATUS.STITCHING ? "bg-orange-500 text-[#FFFFFF]" :
                          "bg-[#E2DDD6] text-[#0D3D33]"
                        )}>
                          {t(`orders.${order.status.toLowerCase()}`)}
                        </div>
                      </div>
                    </motion.div>
                    {i < recentOrders.length - 1 && <div className="h-px w-full bg-[#0D3D33]/5 my-1" />}
                  </React.Fragment>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Actions + Top Customers) */}
        <div className="space-y-6 sm:space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-2 gap-4"
          >
             {[
              { label: 'Customers', icon: Users, path: '/app/clients', bg: 'bg-[#0D3D33]/5', hover: 'hover:bg-[#0D3D33]/10', color: 'text-[#0D3D33]' },
              { label: 'Payments', icon: Calendar, path: '/app/payment-reminders', bg: 'bg-[#2ECC71]/10', hover: 'hover:bg-[#2ECC71]/20', color: 'text-[#2ECC71]' },
            ].map((cat, i) => (
              <div 
                key={i} 
                onClick={() => navigate(cat.path)}
                className={cn("bg-[#FFFFFF] rounded-3xl p-6 ring-1 ring-[#0D3D33]/5 shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md")}
              >
                <div className={cn("w-16 h-16 (rounded-full) rounded-2xl flex items-center justify-center mb-4 transition-colors", cat.bg, cat.hover)}>
                  <cat.icon className={cn("w-8 h-8", cat.color)} />
                </div>
                <div className="text-base font-bold text-[#0D3D33]">{cat.label}</div>
              </div>
            ))}
          </motion.div>

          {topCustomersData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#FFFFFF] rounded-[1.5rem] ring-1 ring-[#0D3D33]/5 shadow-sm hover:shadow-md transition-all duration-300 ease-out p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0D3D33]">Top Customers</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {topCustomersData.map((customer, i) => (
                  <div 
                    key={i} 
                    onClick={() => { if (customer.id) navigate(`/app/clients/${customer.id}`); }} 
                    className="flex flex-col items-center p-5 rounded-2xl ring-1 ring-[#0D3D33]/5 hover:ring-[#2ECC71] hover:shadow-md transition-all duration-300 ease-out cursor-pointer bg-[#F7F5F0]/50 hover:bg-[#FFFFFF]"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#0D3D33]/10 flex items-center justify-center text-[#0D3D33] font-bold text-2xl mb-4">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-base font-bold text-[#0D3D33] truncate w-full text-center">{customer.name.split(' ')[0]}</div>
                    <div className="text-sm text-[#4A5568] mt-1 font-medium">{customer.count} Order{customer.count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
