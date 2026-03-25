import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import {
  FolderOpen,
  Users,
  IndianRupee, // Using IndianRupee instead of DollarSign
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Briefcase,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEscrow } from '@/hooks/useEscrow';

const DeveloperDashboard = () => {
  const { user, userProfile } = useAuth();
  const { walletBalance } = useEscrow();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user) {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'projects'),
          where('postedBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const myProjects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProjects(myProjects);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching my projects:", error);
          // Fallback logic could be complex with onSnapshot, simplified here
          setLoading(false);
        });
      } catch (error) {
        console.error("Setup error:", error);
        setLoading(false);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Open</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">Completed</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">{status}</span>;
    }
  };

  // Analytics Data
  const analyticsData = [
    { label: 'Total Projects', value: projects.length.toString(), icon: Briefcase, change: '+2 this month' },
  ];

  return (
    <DashboardLayout role="developer">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold text-foreground"
            >
              Welcome back, {userProfile?.fullName?.split(' ')[0] || 'Developer'}! 👋
            </motion.h1>
            <p className="text-muted-foreground mt-1">
              Here is your project overview and analytics.
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/developer/projects/new" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Post New Project
            </Link>
          </Button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                  <p className="text-2xl font-bold font-display mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Active Projects List - Full Width */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">Active Projects</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/developer/my-projects">View All</Link>
              </Button>
            </div>

            <Card className="border border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No active projects found.</p>
                    </div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">{project.title}</h3>
                              {getStatusBadge(project.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {project.bids || 0} bids
                              </span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                {project.budget}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {project.deadline}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/projects/${project.id}`}>Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeveloperDashboard;
