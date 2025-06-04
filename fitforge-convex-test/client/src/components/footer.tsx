import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Twitter, Instagram, Youtube, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">FitForge</span>
            </div>
            <p className="text-gray-400 mb-6">
              The ultimate AI-powered fitness ecosystem that revolutionizes how you train, compete, and achieve your goals.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-800 hover:bg-primary">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-800 hover:bg-primary">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-800 hover:bg-primary">
                <Youtube className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Platform</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/workouts" className="hover:text-white transition-colors duration-200">
                  Workouts
                </Link>
              </li>
              <li>
                <Link href="/nutrition" className="hover:text-white transition-colors duration-200">
                  Nutrition
                </Link>
              </li>
              <li>
                <Link href="/progress" className="hover:text-white transition-colors duration-200">
                  Progress Tracking
                </Link>
              </li>
              <li>
                <Link href="/ai-analysis" className="hover:text-white transition-colors duration-200">
                  AI Analysis
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors duration-200">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/help" className="hover:text-white transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-white transition-colors duration-200">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Stay Updated</h4>
            <p className="text-gray-400 mb-4">
              Get the latest features and fitness tips delivered to your inbox.
            </p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-gray-800 border-gray-700 rounded-l-lg rounded-r-none focus:ring-primary"
              />
              <Button className="gradient-bg rounded-l-none rounded-r-lg px-4">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 FitForge. All rights reserved. Built with passion for fitness excellence.</p>
        </div>
      </div>
    </footer>
  );
}
