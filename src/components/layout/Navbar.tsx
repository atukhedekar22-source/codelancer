import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, LogOut, User, LayoutDashboard, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!userProfile) return '/dashboard';
    switch (userProfile.role) {
      case 'admin': return '/admin';
      case 'developer': return '/developer';
      case 'freelancer': return '/freelancer';
      default: return '/dashboard';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Code<span className="gradient-text">Lancer</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Home
            </Link>
            <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Browse Projects
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How it Works
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link to={getDashboardLink()} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to={userProfile?.role === 'developer' ? '/developer/messages' : '/freelancer/messages'} className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border/50"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/projects"
                className="text-foreground font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Browse Projects
              </Link>
              <Link
                to="/how-it-works"
                className="text-foreground font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                How it Works
              </Link>

              <div className="border-t border-border/50 pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to={getDashboardLink()} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to={userProfile?.role === 'developer' ? '/developer/messages' : '/freelancer/messages'} onClick={() => setIsOpen(false)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                    </Button>
                    <Button variant="gradient" asChild>
                      <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
