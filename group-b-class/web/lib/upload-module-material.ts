import { supabase } from "@/lib/supabase";

export type UploadedMaterialFile = {
  url: string;
  size: number;
  mimeType: string;
};

/**
 * Upload mentor module material to Supabase Storage (public bucket).
 * Bucket + policies must exist in the projet Supabase hackathon.
 */
export async function uploadModuleMaterialFile(params: {
  classId: string;
  sessionId: string;
  moduleId: string;
  file: File;
}): Promise<UploadedMaterialFile> {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_MODULE_MATERIAL_BUCKET ?? "";
  if (!bucket) {
    throw new Error(
      "Variable NEXT_PUBLIC_SUPABASE_MODULE_MATERIAL_BUCKET manquante : configure un bucket public pour les fichiers module.",
    );
  }

  const safeName = params.file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${params.classId}/${params.sessionId}/${params.moduleId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, params.file, {
    upsert: false,
    contentType: params.file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const mimeType = params.file.type || "application/octet-stream";

  return {
    url: data.publicUrl,
    size: params.file.size,
    mimeType,
  };
}

export function isModuleMaterialUploadConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_MODULE_MATERIAL_BUCKET);
}
