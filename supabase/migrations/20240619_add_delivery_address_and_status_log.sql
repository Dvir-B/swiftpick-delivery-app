-- הוספת delivery_address לטבלת shipments
ALTER TABLE public.shipments ADD COLUMN delivery_address TEXT;

-- יצירת טבלת shipment_status_log
CREATE TABLE public.shipment_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  status TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE
);

CREATE INDEX idx_shipment_status_log_shipment_id ON public.shipment_status_log(shipment_id); 