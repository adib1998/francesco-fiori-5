import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Plus, Minus, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/category';
import StripeCheckout from './StripeCheckout';
import { CheckoutItem, CustomerInfo } from '@/services/stripeService';

interface ProductOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  specialRequests: string;
  deliveryDate: string;
  deliveryAddress: string;
}

const ProductOrderModal: React.FC<ProductOrderModalProps> = ({ product, isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    specialRequests: '',
    deliveryDate: '',
    deliveryAddress: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof OrderData, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuantityChange = (increment: boolean) => {
    setOrderData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + (increment ? 1 : -1))
    }));
  };

  const calculateTotal = () => {
    if (!product) return 0;
    return product.price * orderData.quantity;
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  };

  const createOrder = async () => {
    if (!product) return null;

    try {
      const orderNumber = generateOrderNumber();
      const totalAmount = calculateTotal();

      // Create order with payment_pending status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone || null,
          total_amount: totalAmount,
          status: 'payment_pending',
          payment_status: 'pending',
          billing_address: {
            street: orderData.deliveryAddress,
            city: '',
            postalCode: '',
            country: 'Italy'
          },
          shipping_address: {
            street: orderData.deliveryAddress,
            city: '',
            postalCode: '',
            country: 'Italy'
          },
          notes: `Product Order - ${product.name}\nQuantity: ${orderData.quantity}\nSpecial Requests: ${orderData.specialRequests}\nDelivery Date: ${orderData.deliveryDate}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity: orderData.quantity,
          price: product.price
        });

      if (itemError) throw itemError;

      return order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This will be handled by the payment tabs
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Ordina: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600 text-sm">{product.description}</p>
              <p className="text-xl font-bold text-emerald-600 mt-2">€{product.price.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="customerName"
                  value={orderData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Il tuo nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={orderData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="la-tua-email@esempio.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefono
                </Label>
                <Input
                  id="customerPhone"
                  value={orderData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Data di Consegna</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={orderData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantità</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(false)}
                  disabled={orderData.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{orderData.quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Indirizzo di Consegna *
              </Label>
              <Input
                id="deliveryAddress"
                value={orderData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                placeholder="Via, Città, CAP"
                required
              />
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Richieste Speciali</Label>
              <Textarea
                id="specialRequests"
                value={orderData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Eventuali richieste particolari o personalizzazioni..."
                rows={3}
              />
            </div>

            {/* Total */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Totale:</span>
                <span className="text-emerald-600">€{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Scegli il metodo di pagamento</h3>

              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Form valid: {orderData.customerName && orderData.customerEmail && orderData.deliveryAddress ? 'Yes' : 'No'}
              </div>

              <Tabs defaultValue="stripe" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="stripe" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Paga Ora (Stripe)
                  </TabsTrigger>
                  <TabsTrigger value="later">Paga Dopo</TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Pagamento Sicuro con Stripe</h4>
                    <p className="text-blue-700 text-sm">
                      Paga subito con carta di credito o debito. Il tuo ordine sarà confermato immediatamente.
                    </p>
                  </div>

                  {orderData.customerName && orderData.customerEmail && orderData.deliveryAddress ? (
                    <StripeCheckout
                      items={[{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: orderData.quantity,
                        image: product.image_url || undefined,
                        description: product.description || undefined,
                      }]}
                      customerInfo={{
                        name: orderData.customerName,
                        email: orderData.customerEmail,
                        phone: orderData.customerPhone || undefined,
                      }}
                      onCreateOrder={async () => {
                        const order = await createOrder();
                        if (!order) {
                          throw new Error('Failed to create order');
                        }
                        return order.id;
                      }}
                      onSuccess={() => {
                        toast({
                          title: 'Ordine Completato! 🎉',
                          description: 'Il pagamento è stato elaborato con successo.',
                        });
                        // Reset form and close modal
                        setOrderData({
                          customerName: '',
                          customerEmail: '',
                          customerPhone: '',
                          quantity: 1,
                          specialRequests: '',
                          deliveryDate: '',
                          deliveryAddress: ''
                        });
                        onClose();
                      }}
                      onError={(error) => {
                        toast({
                          title: 'Errore nel Pagamento',
                          description: error,
                          variant: 'destructive',
                        });
                      }}
                    />
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-amber-800 text-sm">
                        Compila tutti i campi obbligatori sopra per procedere al pagamento.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="later" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Ordina Ora, Paga Dopo</h4>
                    <p className="text-gray-700 text-sm">
                      Il tuo ordine sarà salvato e ti contatteremo per confermare i dettagli e il pagamento.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting || !orderData.customerName || !orderData.customerEmail || !orderData.deliveryAddress}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          const order = await createOrder();
                          if (order) {
                            // Create notification for pay-later orders
                            await supabase
                              .from('order_notifications')
                              .insert({
                                order_id: order.id,
                                notification_type: 'new_order',
                                is_read: false
                              });

                            toast({
                              title: 'Ordine Inviato con Successo! 🎉',
                              description: `Il tuo ordine #${order.order_number} è stato ricevuto. Ti contatteremo presto per confermare i dettagli.`,
                            });

                            // Reset form and close modal
                            setOrderData({
                              customerName: '',
                              customerEmail: '',
                              customerPhone: '',
                              quantity: 1,
                              specialRequests: '',
                              deliveryDate: '',
                              deliveryAddress: ''
                            });
                            onClose();
                          }
                        } catch (error) {
                          toast({
                            title: 'Errore nell\'invio dell\'ordine',
                            description: error.message || 'Riprova o contattaci direttamente.',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Conferma Ordine
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOrderModal;
