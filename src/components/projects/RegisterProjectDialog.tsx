import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegisterProjectDialogProps {
    project: {
        id: string;
        title: string;
        skills?: string[];
    };
    trigger?: React.ReactNode;
    onRegisterSuccess?: () => void;
}

const RegisterProjectDialog = ({ project, trigger, onRegisterSuccess }: RegisterProjectDialogProps) => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Pre-fill skills from user profile when dialog opens
    useEffect(() => {
        if (open && userProfile?.skills) {
            setSkills([...userProfile.skills]);
        }
    }, [open, userProfile]);

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        if (skills.includes(newSkill.trim())) return;
        setSkills([...skills, newSkill.trim()]);
        setNewSkill('');
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleRegister = async () => {
        if (!user || !userProfile) {
            toast.error("Please login to register");
            navigate('/login');
            return;
        }

        if (skills.length === 0) {
            toast.error("Please add at least one relevant skill.");
            return;
        }

        setSubmitting(true);
        try {
            const projectRef = doc(db, 'projects', project.id);
            // Fetch latest project data to allow atomic-like check for first registrant
            const projectSnap = await getDoc(projectRef); // Importing getDoc is needed? It is likely needed.
            if (!projectSnap.exists()) {
                toast.error("Project not found");
                return;
            }

            const projectData = projectSnap.data();
            const currentRegistrants = projectData.registrants || [];

            const updatePayload: any = {
                registrants: arrayUnion({
                    freelancerId: user.uid,
                    freelancerName: userProfile.fullName,
                    appliedAt: new Date().toISOString(),
                    rating: userProfile.rating || 0,
                    skills: skills // Use the confirmed/edited skills
                })
            };

            // If this is the first registrant, start the 5-minute timer
            if (currentRegistrants.length === 0 && !projectData.registrationEndsAt) {
                const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
                updatePayload.registrationEndsAt = fiveMinutesFromNow;
            }

            await updateDoc(projectRef, updatePayload);

            toast.success("Successfully registered for project!");
            setOpen(false);
            onRegisterSuccess?.();
        } catch (error) {
            console.error("Error registering:", error);
            toast.error("Failed to register");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="lg" className="w-full">
                        Register Now
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Register for {project.title}</DialogTitle>
                    <DialogDescription>
                        Confirm your skills for this project. The system uses these to calculate your match score.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Your Skills</Label>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/20">
                            {skills.length === 0 && (
                                <span className="text-sm text-muted-foreground italic">No skills added yet.</span>
                            )}
                            {skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                                    {skill}
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="hover:bg-destructive/20 rounded-full p-0.5"
                                        type="button"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a skill (e.g. React, Python)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={submitting}
                        />
                        <Button type="button" size="icon" onClick={handleAddSkill} disabled={submitting}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="bg-primary/5 p-3 rounded-lg flex gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <p>
                            Matching skills: {
                                skills.filter(s => project.skills?.some(ps => ps.toLowerCase() === s.toLowerCase())).length
                            } found from project requirements.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleRegister} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Registration'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterProjectDialog;
