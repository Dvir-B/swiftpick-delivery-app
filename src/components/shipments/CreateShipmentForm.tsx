import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { createDelivery } from '@/services/delivery';

const shipmentSchema = z.object({
  nameTo: z.string().min(1, 'שם הנמען הוא שדה חובה'),
  cityName: z.string().min(1, 'שם העיר הוא שדה חובה'),
  streetName: z.string().min(1, 'שם הרחוב הוא שדה חובה'),
  houseNum: z.string().min(1, 'מספר הבית הוא שדה חובה'),
  telFirst: z.string().min(1, 'מספר הטלפון הוא שדה חובה'),
  email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
  shipmentRemarks: z.string().optional(),
  productsPrice: z.number().min(0, 'מחיר חייב להיות חיובי').optional(),
  shipmentWeight: z.number().min(1, 'משקל חייב להיות לפחות 1 גרם').optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface CreateShipmentFormProps {
  orderId?: string;
  onSuccess?: (shipmentNumber: string) => void;
}

export function CreateShipmentForm({ orderId, onSuccess }: CreateShipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      productsPrice: 0,
      shipmentWeight: 1000, // Default 1kg
    }
  });

  const onSubmit = async (data: ShipmentFormData) => {
    setIsLoading(true);
    
    try {
      // Create order data from form
      const orderData = {
        id: orderId || `manual-${Date.now()}`,
        customer_name: data.nameTo,
        customer_phone: data.telFirst,
        customer_email: data.email || '',
        shipping_address: {
          address: data.streetName,
          city: data.cityName,
          zipCode: '',
          country: 'Israel'
        },
        total_amount: data.productsPrice || 0,
        weight: data.shipmentWeight || 1000,
        notes: data.shipmentRemarks || '',
        order_number: orderId || `MANUAL-${Date.now()}`,
        platform: 'manual' as const
      };

      const result = await createDelivery(orderData);

      if (result.success) {
        toast({
          title: 'משלוח נוצר בהצלחה',
          description: `מספר המשלוח: ${result.shipment?.hfd_shipment_number}`,
        });
        
        reset();
        onSuccess?.(result.shipment?.hfd_shipment_number || '');
      } else {
        toast({
          title: 'שגיאה ביצירת המשלוח',
          description: result.error || 'שגיאה לא ידועה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'שגיאה ביצירת המשלוח',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>יצירת משלוח חדש</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameTo">שם הנמען *</Label>
              <Input
                id="nameTo"
                {...register('nameTo')}
                placeholder="שם מלא"
              />
              {errors.nameTo && (
                <p className="text-sm text-red-500">{errors.nameTo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telFirst">טלפון *</Label>
              <Input
                id="telFirst"
                {...register('telFirst')}
                placeholder="050-1234567"
              />
              {errors.telFirst && (
                <p className="text-sm text-red-500">{errors.telFirst.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityName">עיר *</Label>
              <Input
                id="cityName"
                {...register('cityName')}
                placeholder="תל אביב"
              />
              {errors.cityName && (
                <p className="text-sm text-red-500">{errors.cityName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetName">רחוב *</Label>
              <Input
                id="streetName"
                {...register('streetName')}
                placeholder="דיזנגוף"
              />
              {errors.streetName && (
                <p className="text-sm text-red-500">{errors.streetName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseNum">מספר בית *</Label>
              <Input
                id="houseNum"
                {...register('houseNum')}
                placeholder="1"
              />
              {errors.houseNum && (
                <p className="text-sm text-red-500">{errors.houseNum.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productsPrice">מחיר המוצרים (₪)</Label>
              <Input
                id="productsPrice"
                type="number"
                {...register('productsPrice', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.productsPrice && (
                <p className="text-sm text-red-500">{errors.productsPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipmentWeight">משקל המשלוח (גרם)</Label>
              <Input
                id="shipmentWeight"
                type="number"
                {...register('shipmentWeight', { valueAsNumber: true })}
                placeholder="1000"
              />
              {errors.shipmentWeight && (
                <p className="text-sm text-red-500">{errors.shipmentWeight.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipmentRemarks">הערות למשלוח</Label>
            <Textarea
              id="shipmentRemarks"
              {...register('shipmentRemarks')}
              placeholder="הערות נוספות למשלוח..."
              rows={3}
            />
            {errors.shipmentRemarks && (
              <p className="text-sm text-red-500">{errors.shipmentRemarks.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'יוצר משלוח...' : 'צור משלוח'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 