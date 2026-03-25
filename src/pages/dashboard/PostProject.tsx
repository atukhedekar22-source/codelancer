import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Type,
    AlignLeft,
    IndianRupee,
    Calendar,
    Tags,
    Save,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

const PostProject = () => {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        skills: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('You must be logged in to post a project');
            return;
        }

        if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

            await addDoc(collection(db, 'projects'), {
                ...formData,
                skills: skillsArray,
                postedBy: user.uid,
                postedByName: userProfile?.fullName || 'Anonymous',
                createdAt: serverTimestamp(),
                // registrationEndsAt removed - specific logic now handles this on first registration
                registrants: [],
                status: 'open',
                bids: 0
            });

            toast.success('Project posted successfully!');
            navigate('/developer/projects');

        } catch (error) {
            console.error('Error posting project:', error);
            toast.error('Failed to post project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="developer">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-8"
            >
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Post New Project</h1>
                        <p className="text-muted-foreground">Detailed project descriptions attract better talent.</p>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Title</Label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="e.g. E-commerce Mobile App"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe your project requirements..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="pl-10 min-h-[120px]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget (₹)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="budget"
                                        name="budget"
                                        placeholder="50000"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Deadline</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="deadline"
                                        name="deadline"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.deadline}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Required Skills</Label>
                            <div className="relative">
                                <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="skills"
                                    name="skills"
                                    placeholder="React, Node.js, Firebase (comma separated)"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                            {loading ? 'Posting...' : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Post Project
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default PostProject;
