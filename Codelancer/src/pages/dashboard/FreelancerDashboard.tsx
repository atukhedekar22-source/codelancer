import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  IndianRupee,
  Star,
  TrendingUp,
  Search,
  Clock,
  CheckCircle,
  Zap,
  Loader2,
  AlertTriangle,
  Award,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useEscrow } from '@/hooks/useEscrow';

interface Project {
  id: string;
  title: string;
  skills: string[];
  budget: string;
  deadline: string;
  postedBy: string;
  postedByName?: string;
  bids: number;
  status?: 'open' | 'closed' | 'in_progress';
}

interface Bid {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  proposal: string;
}

const FreelancerDashboard = () => {
  const { user, userProfile } = useAuth();
  const { walletBalance, totalEarnings } = useEscrow();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    let unsubscribeProjects: (() => void) | null = null;
    let unsubscribeBids: (() => void) | null = null;

    const setupListeners = async () => {
      // 1. Projects Listener
      try {
        const qProjects = query(
          collection(db, 'projects'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        unsubscribeProjects = onSnapshot(qProjects, async (querySnapshot) => {
          const allProjects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];

          // Client-side filter for 'open' status
          const fetchedProjects = allProjects.filter(p => p.status === undefined || p.status === 'open').slice(0, 5);

          const projectsWithNames = await Promise.all(fetchedProjects.map(async (project) => {
            let postedByName = 'Unknown Developer';
            if (project.postedBy) {
              try {
                const userDocRef = doc(db, 'users', project.postedBy);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  postedByName = userData.fullName || 'Unknown Developer';
                }
              } catch (error) {
                console.error(`Error fetching user profile for ${project.postedBy}:`, error);
              }
            }
            return { ...project, postedByName };
          }));

          setProjects(projectsWithNames);
          // Only stop loading if both are done or if bids are not needed yet, 
          // but better to manage loading state carefully. 
          // For simplicity, we'll set loading false here too, but it might flicker if bids load later.
          // Ideally check if both are loaded.
        }, (error) => {
          console.error("Error fetching projects:", error);
        });
      } catch (error) {
        console.error("Error setting up project listener:", error);
      }

      // 2. Bids Listener
      if (user) {
        try {
          const qBids = query(
            collection(db, 'bids'),
            where('freelancerId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );

          unsubscribeBids = onSnapshot(qBids, (querySnapshot) => {
            const fetchedBids = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Bid[];
            setActiveBids(fetchedBids);
          }, (error) => {
            console.error("Error fetching bids:", error)
          });
        } catch (error) {
          console.error("Error setting up bids listener:", error);
        }
      }

      setLoading(false);
    };

    setupListeners();

    return () => {
      if (unsubscribeProjects) unsubscribeProjects();
      if (unsubscribeBids) unsubscribeBids();
    };
  }, [user]);

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">Pending</span>;
    }
  };

  const analyticsData = [
    { label: 'Active Bids', value: activeBids.length.toString(), icon: Briefcase, change: 'Pending approval' },
    { label: 'Projects Won', value: '2', icon: Award, change: 'Last 30 days' }, // Mock
    { label: 'Total Earnings', value: `₹${totalEarnings.toFixed(2)}`, icon: Wallet, change: '+12% this month' },
    { label: 'Profile Views', value: (userProfile?.profileViews || 0).toString(), icon: TrendingUp, change: '+5 this week' }, // Mock change for now
  ];

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold text-foreground"
            >
              Welcome back, {userProfile?.fullName?.split(' ')[0] || 'Freelancer'}! 👋
            </motion.h1>
            <p className="text-muted-foreground mt-1">
              Find your next project and track your success.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="gradient" asChild>
              <Link to="/freelancer/projects">Find Work</Link>
            </Button>
          </div>
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
          {/* Recent Projects */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">New Projects For You</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/freelancer/projects">View All</Link>
              </Button>
            </div>

            <Card className="border border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No open projects found.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-foreground">{project.title}</h3>
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            New
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {project.budget}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {project.deadline}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">By {project.postedByName || 'Unknown User'}</span>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/projects/${project.id}`}>View Details</Link>
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

export default FreelancerDashboard;
