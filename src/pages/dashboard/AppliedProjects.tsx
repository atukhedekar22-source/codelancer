import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, IndianRupee, ArrowRight, Eye } from 'lucide-react';
import { Project } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const AppliedProjects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppliedProjects = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // Fetch projects posted by user
                // Note: Removing orderBy from query to avoid needing a composite index for now.
                const q = query(
                    collection(db, 'projects'),
                    where('postedBy', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const fetchedProjects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Project[];

                // Sort client-side
                fetchedProjects.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });

                // Filter for projects that have registrants (registrants array exists and has length > 0)
                const appliedProjects = fetchedProjects.filter(p => p.registrants && p.registrants.length > 0);

                setProjects(appliedProjects);
            } catch (error) {
                console.error("Error fetching applied projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppliedProjects();
    }, [user]);

    return (
        <DashboardLayout role="developer">
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">Applied Projects</h1>
                    <p className="text-muted-foreground">Projects with active freelancer applications.</p>
                </motion.div>

                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground mt-2">Loading applications...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">No Applications Yet</h3>
                        <p className="text-muted-foreground mb-4">None of your posted projects have received freelancer registrations yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h2 className="text-xl font-bold font-display">{project.title}</h2>
                                                <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                                                    {project.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-2">{project.description}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <IndianRupee className="h-4 w-4" />
                                                {project.budget}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Posted {project.createdAt?.seconds ? formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true }) : 'Recently'}
                                            </div>
                                        </div>

                                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Users className="h-5 w-5 text-primary" />
                                                <span className="font-semibold text-primary">
                                                    {project.registrants?.length} Application{project.registrants && project.registrants.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="flex -space-x-2 overflow-hidden mb-2">
                                                {project.registrants?.slice(0, 8).map((r, i) => (
                                                    <div key={i} className="h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-xs font-bold text-muted-foreground" title={r.freelancerName}>
                                                        {r.freelancerName.charAt(0)}
                                                    </div>
                                                ))}
                                                {project.registrants && project.registrants.length > 8 && (
                                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                                                        +{project.registrants.length - 8}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col justify-center items-end gap-2">
                                        <Button
                                            className="w-full md:w-auto gap-2"
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                        >
                                            View Details <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AppliedProjects;
