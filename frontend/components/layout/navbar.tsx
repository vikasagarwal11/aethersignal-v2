"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  Upload,
  Download,
  FileText,
  Home,
  Activity,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onUploadClick?: () => void;
  onExportClick?: () => void;
  exportCount?: number;
}

export function Navbar({ onUploadClick, onExportClick, exportCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/signals", label: "Signals", icon: Activity },
  ];

  return (
    <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AetherSignal</h1>
                <p className="text-xs text-gray-400">AI-Powered Pharmacovigilance</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-500/10 text-primary-400"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {onUploadClick && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Data
              </Button>
            )}
            {onExportClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportClick}
                disabled={exportCount === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export {exportCount > 0 && `(${exportCount})`}
              </Button>
            )}
            <Button variant="primary" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar fallback="VK" size="sm" status="online" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Vikas Kumar</p>
                    <p className="text-xs leading-none text-gray-400">vikas@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

