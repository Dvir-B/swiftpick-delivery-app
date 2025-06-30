# אינטגרציה עם HFD (חברת הדואר)

## סקירה כללית

האפליקציה משלבת עם ה-API של חברת הדואר (HFD) ליצירת משלוחים ומעקב אחריהם.

## שינויים שבוצעו

### 1. עדכון פונקציית Edge `hfd-proxy`

**קובץ**: `supabase/functions/hfd-proxy/index.ts`

**שינויים עיקריים**:
- עדכון URL הבסיס ל-`https://api.hfd.co.il/rest/v2`
- הוספת אימות Bearer token
- שיפור טיפול בשגיאות
- הוספת לוגים מפורטים

### 2. שירות HFD חדש

**קובץ**: `src/services/hfd.ts`

**פונקציונליות**:
- `createHFDShipment()` - יצירת משלוח חדש
- `getHFDShipmentStatus()` - קבלת סטטוס משלוח
- ממשקים TypeScript מלאים

### 3. קומפוננטת יצירת משלוח

**קובץ**: `src/components/shipments/CreateShipmentForm.tsx`

**תכונות**:
- טופס מלא ליצירת משלוח
- ולידציה עם Zod
- עיצוב מותאם עם shadcn/ui
- תמיכה בעברית

## הגדרת HFD

### 1. הגדרת פרטי חיבור

יש להגדיר את פרטי החיבור ל-HFD בטבלת `hfd_settings`:

```sql
INSERT INTO hfd_settings (
  user_id,
  client_number,
  token,
  shipment_type_code,
  cargo_type_haloch,
  is_active
) VALUES (
  'your-user-id',
  'your-client-number',
  'your-bearer-token',
  50,
  1,
  true
);
```

### 2. פרמטרים נדרשים

- **client_number**: מספר הלקוח ב-HFD
- **token**: Bearer token לאימות
- **shipment_type_code**: קוד סוג המשלוח (ברירת מחדל: 50)
- **cargo_type_haloch**: קוד סוג המטען (ברירת מחדל: 1)

## שימוש ב-API

### יצירת משלוח

```typescript
import { createHFDShipment } from '@/services/hfd';

const shipmentData = {
  nameTo: 'ישראל ישראלי',
  cityName: 'תל אביב',
  streetName: 'דיזנגוף',
  houseNum: '123',
  telFirst: '050-1234567',
  email: 'israel@example.com',
  productsPrice: 100,
  shipmentWeight: 1000, // גרמים
  referenceNum1: 'ORDER-123'
};

const result = await createHFDShipment(shipmentData);

if (result.success) {
  console.log('מספר משלוח:', result.shipmentNumber);
} else {
  console.error('שגיאה:', result.error);
}
```

### מעקב אחר משלוח

```typescript
import { getHFDShipmentStatus } from '@/services/hfd';

const status = await getHFDShipmentStatus('SHIPMENT-123');
console.log('סטטוס משלוח:', status);
```

## מבנה נתוני המשלוח

### שדות חובה
- `nameTo` - שם הנמען
- `cityName` - שם העיר
- `streetName` - שם הרחוב
- `houseNum` - מספר הבית
- `telFirst` - מספר טלפון

### שדות אופציונליים
- `email` - כתובת אימייל
- `shipmentRemarks` - הערות למשלוח
- `productsPrice` - מחיר המוצרים
- `shipmentWeight` - משקל המשלוח (גרמים)
- `referenceNum1` - מספר הפניה (מספר הזמנה)

## טיפול בשגיאות

הפונקציה מטפלת בשגיאות הבאות:
- שגיאות רשת (retry אוטומטי)
- שגיאות אימות (401, 403)
- שגיאות ולידציה (400, 422)
- שגיאות שרת (5xx)

## לוגים

כל הבקשות ל-HFD נרשמות בלוגים של Supabase Edge Functions. ניתן לצפות בלוגים דרך:
- Supabase Dashboard → Logs
- או באמצעות Supabase CLI: `supabase logs --function hfd-proxy`

## בדיקות

### בדיקת חיבור
```bash
curl -X POST https://your-project.supabase.co/functions/v1/hfd-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/shipments/create",
    "payload": {
      "nameTo": "בדיקה",
      "cityName": "תל אביב",
      "streetName": "דיזנגוף",
      "houseNum": "1",
      "telFirst": "050-1234567"
    },
    "token": "YOUR_HFD_TOKEN"
  }'
```

## הערות חשובות

1. **אימות**: יש לוודא שה-Bearer token של HFD תקף
2. **משקל**: המשקל נמדד בגרמים (1000 גרם = 1 ק"ג)
3. **מטבע**: ברירת המחדל היא ILS (שקלים)
4. **מספרי טלפון**: יש להזין בפורמט ישראלי (050-1234567)
5. **כתובות**: יש להזין בעברית כפי שמופיעות במסד הנתונים של HFD

## פתרון בעיות

### שגיאה 401/403
- בדוק שה-Bearer token תקף
- וודא שמספר הלקוח נכון

### שגיאה 400/422
- בדוק שכל השדות החובה מלאים
- וודא שהפורמט של הנתונים נכון

### שגיאות רשת
- הפונקציה תנסה שוב אוטומטית עד 3 פעמים
- בדוק את חיבור האינטרנט
- וודא שה-API של HFD זמין 