import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrders } from "@/hooks/useOrders";
import { OrdersTableToolbar } from "./orders/OrdersTableToolbar";
import { OrdersTableRow } from "./orders/OrdersTableRow";

export function OrdersTable() {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filteredOrders,
    selectedOrders,
    handleGoBack,
    handleStartPicking,
    handleViewOrder,
    handleDeleteOrder,
    handleUpdateStatus,
    handleSendToShipping,
    handleBulkSendToShipping,
    handleBulkDeleteOrders,
    handleSelectOrder,
    handleSelectAllOrders
  } = useOrders();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>טוען הזמנות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrdersTableToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedOrdersCount={selectedOrders.length}
        onBulkSend={handleBulkSendToShipping}
        onBulkDelete={handleBulkDeleteOrders}
        onGoBack={handleGoBack}
      />
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  id="select-all"
                  checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                  onCheckedChange={(checked) => {
                    handleSelectAllOrders(Boolean(checked));
                  }}
                  aria-label="בחר הכל"
                />
              </TableHead>
              <TableHead className="text-right">מספר הזמנה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right hidden md:table-cell">אימייל</TableHead>
              <TableHead className="text-right hidden lg:table-cell">פלטפורמה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right hidden lg:table-cell">תאריך הזמנה</TableHead>
              <TableHead className="text-right hidden md:table-cell">סכום</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  לא נמצאו הזמנות
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <OrdersTableRow
                  key={order.id}
                  order={order}
                  isSelected={selectedOrders.includes(order.id!)}
                  onSelectChange={(checked) => handleSelectOrder(order.id!, checked)}
                  onStartPicking={handleStartPicking}
                  onSendToShipping={handleSendToShipping}
                  onUpdateStatus={handleUpdateStatus}
                  onViewOrder={handleViewOrder}
                  onDeleteOrder={handleDeleteOrder}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
