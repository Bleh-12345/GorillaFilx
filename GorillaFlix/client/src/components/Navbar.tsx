import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Upload, ChevronDown, LogOut, Shield } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Handle scroll for transparent to solid header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? "bg-black/90 backdrop-blur-sm" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="px-4 md:px-16 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <h1 className="text-primary font-black text-2xl md:text-3xl tracking-tighter">GORILLAFLIX</h1>
            </a>
          </Link>
          
          {/* Netflix-style Navigation Links (hidden on mobile) */}
          <div className="hidden md:flex ml-10 space-x-6">
            <Link href="/">
              <a className="text-white text-sm font-medium hover:text-white/80 transition-colors">Home</a>
            </Link>
            <Link href="/#movies">
              <a className="text-white/70 text-sm font-medium hover:text-white transition-colors">Movies</a>
            </Link>
            {user && (
              <Link href={`/profile/${user.id}#watchlist`}>
                <a className="text-white/70 text-sm font-medium hover:text-white transition-colors">My List</a>
              </Link>
            )}
            <Link href="/#popular">
              <a className="text-white/70 text-sm font-medium hover:text-white transition-colors">Popular</a>
            </Link>
          </div>
        </div>
        
        {/* Right-side actions - Netflix style */}
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-transparent p-0 h-auto"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={20} />
            </Button>
            
            {showSearch && (
              <form
                onSubmit={handleSearch}
                className="absolute right-0 top-10 bg-black/90 p-2 rounded-sm border border-slate-700"
              >
                <Input
                  type="text"
                  placeholder="Search"
                  className="bg-black/70 border border-slate-600 text-white w-[240px] focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>
            )}
          </div>
          
          {/* Upload Button - Netflix-style */}
          <Link href="/upload">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-transparent px-0 h-auto rounded-none"
            >
              <Upload size={18} className="mr-1" />
              <span className="text-sm font-medium">Upload</span>
            </Button>
          </Link>
          
          {/* User Menu - Netflix style */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-0 h-auto hover:bg-transparent">
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarImage src={user.avatar || ""} alt={user.username} />
                    <AvatarFallback className="bg-slate-800 text-white">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown size={14} className="text-white/80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black/95 border border-slate-700 text-white rounded-sm mt-2 p-1">
                <DropdownMenuItem asChild className="px-4 py-2 hover:bg-slate-800 rounded-none focus:bg-slate-800">
                  <Link href={`/profile/${user.id}`}>
                    <a className="w-full cursor-pointer text-white">
                      <span className="font-medium text-sm">Profile</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-2 hover:bg-slate-800 rounded-none focus:bg-slate-800">
                  <Link href={`/analytics/${user.id}`}>
                    <a className="w-full cursor-pointer text-white">
                      <span className="font-medium text-sm">Channel Analytics</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-2 hover:bg-slate-800 rounded-none focus:bg-slate-800">
                  <Link href="/upload">
                    <a className="w-full cursor-pointer text-white">
                      <span className="font-medium text-sm">Upload Content</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-2 hover:bg-slate-800 rounded-none focus:bg-slate-800">
                  <Link href={`/profile/${user.id}#watchlist`}>
                    <a className="w-full cursor-pointer text-white">
                      <span className="font-medium text-sm">My List</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                {/* Admin functionality - Only visible to Gorilla Tag Dev (user ID 1) */}
                {user.id === 1 && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-700 my-1" />
                    <DropdownMenuItem asChild className="px-4 py-2 hover:bg-slate-800 rounded-none focus:bg-slate-800">
                      <Link href="/moderation">
                        <a className="w-full cursor-pointer text-red-500">
                          <Shield className="mr-2 h-4 w-4" />
                          <span className="font-medium text-sm">Content Moderation</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator className="bg-slate-700 my-1" />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="px-4 py-2 hover:bg-slate-800 focus:bg-slate-800 text-red-500 rounded-none"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium text-sm">{logoutMutation.isPending ? 'Logging out...' : 'Sign Out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white rounded-sm px-4 py-1 text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
