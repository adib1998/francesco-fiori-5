import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Phone, 
  Settings,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderDetails from '@/components/OrderDetails';
import OrderNotifications from '@/components/OrderNotifications';
import OrderSystemTester from '@/components/OrderSystemTester';
import phoneNotificationService from '@/services/phoneNotificationService';
import backgroundOrderService from '@/services/backgroundOrderService';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes?: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

const OrderDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isPhoneRinging, setIsPhoneRinging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0
  });
  const { toast } = useToast();

  // Fetch orders with real-time updates
  const { data: orders, isLoading, refetch, error } = useQuery({
    queryKey: ['orders-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is not active
  });

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['order-notifications-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Check notifications every 10 seconds
    refetchIntervalInBackground: true,
  });

  // Calculate dashboard statistics
  useEffect(() => {
    if (orders) {
      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === today
      );

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        acceptedOrders: orders.filter(o => o.status === 'accepted').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.total_amount), 0),
        todayOrders: todayOrders.length
      });
      setLastUpdate(new Date());
    }
  }, [orders]);

  // Set up real-time listeners for orders
  useEffect(() => {
    const channel = supabase
      .channel('order-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 New order received in dashboard:', payload);

          // Only trigger notifications if we're on the order dashboard page
          if (window.location.pathname === '/orders') {
            // Trigger enhanced notifications (SINGLE SOURCE)
            phoneNotificationService.notifyNewOrder(
              payload.new.order_number,
              payload.new.customer_name
            );
          }

          // Show persistent toast notification
          toast({
            title: '🔔 NEW ORDER RECEIVED!',
            description: `Order #${payload.new.order_number} from ${payload.new.customer_name}`,
            duration: 15000, // Show for 15 seconds
          });

          // Trigger browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order Received!', {
              body: `Order #${payload.new.order_number} from ${payload.new.customer_name}`,
              icon: '/favicon.ico',
              tag: 'new-order',
              requireInteraction: true, // Keep notification until user interacts
            });
          }

          refetch();
          refetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchNotifications, toast]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '🌐 Back Online',
        description: 'Connection restored. Syncing data...',
      });
      refetch();
      refetchNotifications();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '📡 Connection Lost',
        description: 'Working offline. Will sync when connection is restored.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch, refetchNotifications, toast]);

  // Update notification count and phone ringing status
  useEffect(() => {
    if (notifications) {
      setNotificationCount(notifications.length);
    }
  }, [notifications]);

  // Monitor phone ringing status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPhoneRinging(phoneNotificationService.isCurrentlyRinging());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Request notification permission and start background service on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: '🔔 Notifications Enabled',
            description: 'You will receive browser notifications for new orders',
          });
        }
      });
    }

    // Start background order service (but disable its notifications since we handle them here)
    backgroundOrderService.updateSettings({
      ...backgroundOrderService.getSettings(),
      soundEnabled: false // Disable background service notifications to prevent duplicates
    });

    backgroundOrderService.start().then(() => {
      toast({
        title: '🚀 Background Service Started',
        description: 'Background monitoring active (notifications handled by dashboard)',
      });
    }).catch(error => {
      console.error('Failed to start background service:', error);
      toast({
        title: '⚠️ Background Service Warning',
        description: 'Some notification features may not work properly',
        variant: 'destructive',
      });
    });

    // Cleanup on unmount
    return () => {
      backgroundOrderService.stop();
    };
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', icon: Package },
      processing: { color: 'bg-purple-100 text-purple-800', icon: Package },
      shipped: { color: 'bg-orange-100 text-orange-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    phoneNotificationService.updateSettings({
      ...phoneNotificationService.getSettings(),
      enabled: !soundEnabled
    });
    
    toast({
      title: soundEnabled ? '🔇 Sound Disabled' : '🔊 Sound Enabled',
      description: soundEnabled ? 'Order notifications will be silent' : 'Order notifications will play sound',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Order Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🌸 Order Dashboard
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Real-time order management and notifications
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="flex items-center gap-2"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>

            {/* Phone Ringing Indicator */}
            {isPhoneRinging && (
              <Button
                onClick={() => phoneNotificationService.stopRinging()}
                variant="destructive"
                size="sm"
                className="animate-pulse flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Stop Ringing
              </Button>
            )}

            {/* Notifications */}
            <OrderNotifications
              notifications={notifications || []}
              count={notificationCount}
              onRefresh={() => {
                refetch();
                refetchNotifications();
              }}
            />

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                refetchNotifications();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Last Update Time */}
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Orders</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Accepted</p>
                <p className="text-lg font-bold text-blue-600">{stats.acceptedOrders}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-lg font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Today</p>
                <p className="text-lg font-bold text-purple-600">{stats.todayOrders}</p>
              </div>
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="testing">System Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Orders</span>
              <Badge variant="secondary">{orders?.length || 0} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">#{order.order_number}</div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {order.customer_name}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="font-medium">{formatCurrency(Number(order.total_amount))}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onUpdate={() => {
                  refetch();
                  setSelectedOrder(null);
                }}
                onDelete={() => {
                  refetch();
                  setSelectedOrder(null);
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select an order to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Orders</span>
                  <Badge variant="secondary">{orders?.length || 0} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                      <Card
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">#{order.order_number}</div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {order.customer_email}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="font-medium">{formatCurrency(Number(order.total_amount))}</span>
                          </div>
                          {order.notes && (
                            <div className="text-xs text-gray-400 mt-2 truncate">
                              {order.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <OrderDetails
                    order={selectedOrder}
                    onUpdate={() => {
                      refetch();
                      setSelectedOrder(null);
                    }}
                    onDelete={() => {
                      refetch();
                      setSelectedOrder(null);
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select an order to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <OrderSystemTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDashboard;
