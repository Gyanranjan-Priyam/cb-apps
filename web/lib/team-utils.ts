export function generateTeamSlug(teamName: string, eventTitle: string): string {
  // Remove special characters and convert to lowercase
  const cleanTeamName = teamName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  
  const cleanEventTitle = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Generate a random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${cleanTeamName}-${cleanEventTitle}-${randomSuffix}`;
}

export function validateTeamSlug(slug: string): boolean {
  // Check if slug matches expected pattern
  const slugPattern = /^[a-z0-9-]+$/;
  return slugPattern.test(slug) && slug.length >= 3 && slug.length <= 100;
}