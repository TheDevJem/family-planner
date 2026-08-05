export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function defaultAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name.trim() || 'Kid');
  return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}`;
}

export function isGeneratedInitialsAvatar(avatarUrl: string): boolean {
  return avatarUrl === '' || avatarUrl.startsWith('https://api.dicebear.com/8.x/initials/svg?seed=');
}
