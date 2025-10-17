import { useState } from 'react';

interface FileUploadSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const FileUploadSection = ({ isCollapsed, onToggle }: FileUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // 파일 업로드 로직
      console.log('파일 업로드:', files);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-4">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">📁</span>
          <h3 className="text-lg font-medium text-gray-900">파일 업로드 (MD, TXT, HTML, PDF)</h3>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="mt-4">
            <input
              type="file"
              multiple
              accept=".md,.txt,.html,.pdf"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowUploadedFiles(!showUploadedFiles)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                업로드된 파일 보기 ({uploadedFiles.length}개)
              </button>
              
              {showUploadedFiles && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
