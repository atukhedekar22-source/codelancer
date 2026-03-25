import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import {
  Search,
  Filter,
  IndianRupee,
  Clock,
  Users,
  Star,
  ChevronDown,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlaceBidDialog from '@/components/projects/PlaceBidDialog';

const skillFilters = ['React', 'Node.js', 'Python', 'TypeScript', 'UI/UX', 'Mobile', 'DevOps'];

const BrowseProjects = ({ isInDashboard = false }: { isInDashboard?: boolean }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Real-time listener
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const fetchedProjects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const projectsWithNames = await Promise.all(fetchedProjects.map(async (project: any) => {
            // Format date directly here
            let postedAt = 'Recently';
            if (project.createdAt?.seconds) {
              postedAt = formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true });
            }

            // Handle missing postedByName
            let postedByName = project.postedByName;
            if (!postedByName && project.postedBy) {
              try {
                const userDocRef = doc(db, 'users', project.postedBy);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  postedByName = userData.fullName || 'Unknown Developer';
                } else {
                  postedByName = 'Unknown Developer';
                }
              } catch (error) {
                console.error(`Error fetching user profile for ${project.postedBy}:`, error);
                postedByName = 'Unknown Developer';
              }
            }

            return {
              ...project,
              postedByName: postedByName,
              postedAt: postedAt
            };
          }));

          setProjects(projectsWithNames);
          setLoading(false);
        }, (error) => {
          console.error("Error with project listener:", error);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up project listener:", error);
        setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const filteredProjects = projects.filter(project => {
    // Status check
    if (project.status !== 'open') return false;

    // Search query check
    const matchesSearch =
      (project.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (project.skills || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Skills filter check
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => (project.skills || []).includes(skill));

    return matchesSearch && matchesSkills;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className={`min-h-screen bg-background ${isInDashboard ? '' : ''}`}>
      {!isInDashboard && <Navbar />}

      <main className={`${isInDashboard ? 'py-6' : 'pt-24 pb-16'}`}>
        <div className={isInDashboard ? "" : "container mx-auto px-4"}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Browse <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find projects that match your skills and start earning. AI-powered matching helps you find the perfect fit.
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title, skills, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
              <Button variant="outline" className="gap-2 h-12">
                <Filter className="h-5 w-5" />
                More Filters
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillFilters.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSkills.includes(skill)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Projects List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found matching your criteria.</p>
              </div>
            ) : (
              filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="font-display text-xl font-bold text-foreground">
                          {project.title}
                        </h2>
                        {project.verified && (
                          <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Verified
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {project.budget}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {project.deadline}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.bids} bids
                        </span>
                        <span>Posted by {project.postedByName || project.postedBy}</span>
                        <span>{project.postedAt}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="flex flex-col gap-3 lg:items-end">
                        <Button variant="outline" onClick={() => navigate(`/projects/${project.id}`)}>View Details</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Projects
            </Button>
          </div>
        </div>
      </main>

      {!isInDashboard && <Footer />}
    </div>
  );
};

export default BrowseProjects;