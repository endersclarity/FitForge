import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormTest() {
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [submitResult, setSubmitResult] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FormTest] Form submitted with data:", formData);
    setSubmitResult(`Form submitted! Email: ${formData.email}, Name: ${formData.name}`);
  };

  const handleNativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nativeFormData = new FormData(form);
    console.log("[FormTest] Native form submitted");
    const data = Object.fromEntries(nativeFormData.entries());
    setSubmitResult(`Native form submitted! ${JSON.stringify(data)}`);
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold">Form Submission Test</h3>

      {/* React controlled form */}
      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h4 className="font-semibold">React Controlled Form</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <Button type="submit" className="w-full">
            Submit with Shadcn Button
          </Button>
        </form>
      </div>

      {/* Native HTML form */}
      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
        <h4 className="font-semibold">Native HTML Form</h4>
        <form onSubmit={handleNativeSubmit} className="space-y-3">
          <div>
            <label htmlFor="native-email" className="block text-sm font-medium">Email</label>
            <input
              id="native-email"
              name="email"
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label htmlFor="native-name" className="block text-sm font-medium">Name</label>
            <input
              id="native-name"
              name="name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
          >
            Submit with Native Button
          </button>
        </form>
      </div>

      {/* Submit result */}
      {submitResult && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-sm font-mono">{submitResult}</p>
        </div>
      )}
    </div>
  );
}