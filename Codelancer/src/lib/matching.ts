export const calculateMatchScore = (projectSkills: string[] = [], userSkills: string[] = []): number => {
    if (!projectSkills.length || !userSkills.length) return 0;

    const normalize = (s: string) => s.toLowerCase().trim();
    const normalizedProjectSkills = projectSkills.map(normalize);
    const normalizedUserSkills = userSkills.map(normalize);

    const matchedSkills = normalizedProjectSkills.filter(skill =>
        normalizedUserSkills.includes(skill)
    );

    return Math.round((matchedSkills.length / normalizedProjectSkills.length) * 100);
};

export const sortProjectsByMatch = (projects: any[], userSkills: string[]): any[] => {
    return [...projects].sort((a, b) => {
        const scoreA = calculateMatchScore(a.skills, userSkills);
        const scoreB = calculateMatchScore(b.skills, userSkills);
        return scoreB - scoreA;
    });
};
