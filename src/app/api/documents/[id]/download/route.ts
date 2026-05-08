import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access: uploader, dosen pembimbing, admin, or kajur
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = document.uploader_id === user.id;
    const isPrivileged = profile?.role === 'admin' || profile?.role === 'kajur';

    // Check if the current user is the dosen for the related booking
    let isDosenPembimbing = false;
    if (document.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('dosen_id')
        .eq('id', document.booking_id)
        .single();
      isDosenPembimbing = booking?.dosen_id === user.id;
    }

    if (!isOwner && !isPrivileged && !isDosenPembimbing) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate signed URL (valid for 60 minutes)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('skripsi-docs')
      .createSignedUrl(document.file_path, 3600);

    if (urlError) throw urlError;

    // FIXED: SDK returns signedUrl property (lowercase)
    const signedUrl = urlData?.signedUrl ?? null;

    return NextResponse.json({
      data: {
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        signed_url: signedUrl,
        expires_in: 3600,
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
