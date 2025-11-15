
export interface EditedImageResult {
  imageUrl: string | null;
  text: string | null;
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}
