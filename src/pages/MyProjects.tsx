import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    IndianRupee,
    Clock,
    Briefcase,
    Calendar,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Project {
    id: string;
    title: string;
    description: string;
    budget: string;
    status: 'Open' | 'assigned' | 'completed';
    createdAt: any;
    deadline?: any;
    postedBy: string;
    assignedTo: string;
}

const MyProjects = () => {
    const { user, userProfile } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        if (user && userProfile) {
            setLoading(true);
            try {
                let q;

                if (userProfile.role === 'developer') {
                    q = query(
                        collection(db, 'projects'),
                        where('postedBy', '==', user.uid)
                    );
                } else {
                    q = query(
                        collection(db, 'projects'),
                        where('assignedTo', '==', user.uid)
                    );
                }

                unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedProjects = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data() as any
                    })) as Project[];

                    // Sort by createdAt desc
                    fetchedProjects.sort((a, b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    });

                    setProjects(fetchedProjects);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching projects:", error);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Error setting up listener:", error);
                setLoading(false);
            }
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, userProfile]);

    return (
        <DashboardLayout role={userProfile?.role as 'developer' | 'freelancer' || 'freelancer'}>
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Projects</h1>
                    <p className="text-muted-foreground">Manage your active and completed work.</p>
                </motion.div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading your projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                            <p className="text-muted-foreground mb-4">You have no assigned projects yet.</p>
                            <Button asChild variant="gradient">
                                <Link to="/freelancer/projects">Browse Projects</Link>
                            </Button>
                        </div>
                    ) : (
                        projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-success/50">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold font-display mb-1">
                                                            {project.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                Posted {project.createdAt?.seconds ? formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true }) : 'Recently'}
                                                            </span>
                                                            <span>•</span>
                                                            <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} className="bg-success/10 text-success hover:bg-success/20 border-0">
                                                                {project.status === 'assigned' ? 'In Progress' : project.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {project.description}
                                                </p>

                                                <div className="flex items-center gap-4 text-sm font-medium">
                                                    <div className="flex items-center gap-1 text-primary">
                                                        <IndianRupee className="h-4 w-4" />
                                                        {project.budget}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-center gap-2 md:border-l pl-0 md:pl-6 md:w-48">
                                                <Button variant="default" size="sm" className="w-full gap-2" asChild>
                                                    <Link to={`/projects/${project.id}`}>
                                                        View Details
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyProjects;
