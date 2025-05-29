import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ButtonTest() {
  const [clickCount, setClickCount] = useState(0);
  const [nativeCount, setNativeCount] = useState(0);

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Button Click Test</h2>
      
      <div className="space-y-4">
        {/* Shadcn Button Test */}
        <div>
          <Button 
            onClick={() => {
              console.log("Shadcn button clicked!");
              setClickCount(prev => prev + 1);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Shadcn Button (Clicks: {clickCount})
          </Button>
        </div>

        {/* Native HTML Button Test */}
        <div>
          <button 
            onClick={() => {
              console.log("Native button clicked!");
              setNativeCount(prev => prev + 1);
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium"
          >
            Native Button (Clicks: {nativeCount})
          </button>
        </div>

        {/* Button with asChild Test */}
        <div>
          <Button
            variant="outline"
            onClick={() => {
              console.log("Outline button clicked!");
              alert("Outline button works!");
            }}
          >
            Test Outline Button
          </Button>
        </div>
      </div>
    </div>
  );
}