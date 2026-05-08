import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filePath = `${user.id}/${params.id}/${timestamp}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('skripsi-docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the consultation to link to booking_id if needed
    const { data: consultation } = await supabase
        .from('consultations')
        .select('booking_id')
        .eq('id', params.id)
        .single();

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        consultation_id: params.id,
        booking_id: consultation?.booking_id,
        uploader_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Generate signed URL
    const { data: urlData } = await supabase.storage
      .from('skripsi-docs')
      .createSignedUrl(filePath, 3600); // 1 hour valid

    // FIXED: SDK returns signedUrl property (lowercase)
    const signedUrl = urlData?.signedUrl ?? null;

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
