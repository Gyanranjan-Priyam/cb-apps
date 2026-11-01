export function useConstructUrl(key: string) : string {
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    if (!bucketName) {
        console.error('NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES is not defined');
        return '';
    }
    return `https://${bucketName}.t3.storage.dev/${key}`
}