
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>העלאת הזמנות מקובץ</CardTitle>
        <CardDescription>העלה קובץ CSV, XLSX או XLS עם פרטי ההזמנות</CardDescription>
      </Header>
      <CardContent>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="excel-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">לחץ להעלאת קובץ</span> או גרור לכאן
              </p>
              <p className="text-xs text-gray-500">CSV, XLSX, XLS</p>
            </div>
            <input
              id="excel-upload"
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={onFileUpload}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
