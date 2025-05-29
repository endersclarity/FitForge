import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function NavigationTest() {
  const [location, setLocation] = useLocation();

  const testNavigation = (path: string) => {
    console.log(`[NavigationTest] Attempting to navigate to: ${path}`);
    setLocation(path);
  };

  return (
    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg space-y-4">
      <h3 className="font-bold text-lg">Navigation Test</h3>
      
      <div className="space-y-2">
        <p className="text-sm">Current Location: <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{location}</code></p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Test with Link component */}
        <Link href="/dashboard" className="block">
          <Button variant="outline" className="w-full">
            Link to Dashboard
          </Button>
        </Link>

        <Link href="/workouts" className="block">
          <Button variant="outline" className="w-full">
            Link to Workouts
          </Button>
        </Link>

        {/* Test with programmatic navigation */}
        <Button 
          onClick={() => testNavigation("/dashboard")}
          className="bg-green-500 hover:bg-green-600"
        >
          Navigate to Dashboard
        </Button>

        <Button 
          onClick={() => testNavigation("/workouts")}
          className="bg-green-500 hover:bg-green-600"
        >
          Navigate to Workouts
        </Button>
      </div>

      {/* Test with native anchor tags */}
      <div className="grid grid-cols-2 gap-2">
        <a href="/dashboard" className="block">
          <button className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded">
            Anchor to Dashboard
          </button>
        </a>

        <a href="/workouts" className="block">
          <button className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded">
            Anchor to Workouts
          </button>
        </a>
      </div>
    </div>
  );
}